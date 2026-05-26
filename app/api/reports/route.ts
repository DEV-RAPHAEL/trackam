import { NextResponse } from 'next/server';
import { db, initDb } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import PDFDocument from 'pdfkit';

export async function GET(req: Request) {
  const { user, errorResponse } = await verifyAuth(req);
  if (errorResponse) return errorResponse;

  const url = new URL(req.url);
  const type = url.searchParams.get('type') || 'financial'; // financial, crm, operations
  const dateRange = url.searchParams.get('dateRange') || 'all'; // 30days, year, all
  const format = url.searchParams.get('format') || 'pdf'; // pdf, csv
  const companyId = user!.company_id;

  try {
    await initDb();

    // 1. Fetch Company details
    const companyRes = await db.query('SELECT * FROM companies WHERE id = $1', [companyId]);
    const company = companyRes.rows[0] as any;
    const companyName = company?.name || 'Company Workspace';
    const brandColor = company?.brand_color || '#10b981'; // Emerald brand color

    // 2. Fetch Dashboard Metrics
    const [clientsRes, leadsRes, dealsRes, tasksRes, invoicesRes] = await Promise.all([
      db.query('SELECT * FROM clients WHERE company_id = $1', [companyId]),
      db.query('SELECT * FROM leads WHERE company_id = $1', [companyId]),
      db.query('SELECT * FROM deals WHERE company_id = $1', [companyId]),
      db.query('SELECT * FROM tasks WHERE company_id = $1', [companyId]),
      user?.role === 'user'
        ? db.query('SELECT * FROM invoices WHERE company_id = $1 AND created_by = $2', [companyId, user.id])
        : db.query('SELECT * FROM invoices WHERE company_id = $1', [companyId])
    ]);

    const allClients = clientsRes.rows as any[];
    const allLeads = leadsRes.rows as any[];
    const allDeals = dealsRes.rows as any[];
    const allTasks = tasksRes.rows as any[];
    const allInvoices = invoicesRes.rows as any[];

    // Date filtering helper
    const filterByDateRange = (dateStr: string | undefined | null) => {
      if (!dateStr) return false;
      if (dateRange === 'all') return true;
      const date = new Date(dateStr);
      const now = new Date();
      if (dateRange === '30days') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        return date >= thirtyDaysAgo;
      }
      if (dateRange === 'year') {
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        return date >= startOfYear;
      }
      return true;
    };

    // Effective Retainer Status Helper
    const getEffectiveStatus = (i: any) => {
      if (i.type === 'retainer' && i.status === 'unpaid' && i.due_date) {
        const now = new Date();
        const dueDate = new Date(i.due_date);
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const dueMonthStart = new Date(dueDate.getFullYear(), dueDate.getMonth(), 1);
        if (dueMonthStart > currentMonthStart) {
          return 'paid';
        }
      }
      return i.status;
    };

    // Apply date filters
    const clients = allClients.filter(c => filterByDateRange(c.created_at));
    const leads = allLeads.filter(l => filterByDateRange(l.created_at));
    const deals = allDeals.filter(d => filterByDateRange(d.created_at));
    const tasks = allTasks.filter(t => filterByDateRange(t.created_at));
    const invoices = allInvoices.filter(i => filterByDateRange(i.created_at));

    // Summary calculations
    const totalRevenue = invoices.filter(i => getEffectiveStatus(i) === 'paid').reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const pendingRevenue = invoices.filter(i => getEffectiveStatus(i) === 'unpaid').reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const wonDealsValue = deals.filter(d => d.stage === 'Won').reduce((s, d) => s + (Number(d.value) || 0), 0);
    const totalDealsValue = deals.reduce((s, d) => s + (Number(d.value) || 0), 0);
    const winRate = deals.length > 0 ? Math.round((deals.filter(d => d.stage === 'Won').length / deals.length) * 100) : 0;
    const taskCompletionRate = tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100) : 0;

    // ─────────────────────────────────────────────────────────────────────────
    // CSV EXPORT GENERATION
    // ─────────────────────────────────────────────────────────────────────────
    if (format === 'csv') {
      let csvContent = '';
      if (type === 'financial') {
        csvContent = 'Invoice ID,Client,Amount (NGN),Status,Due Date,Type,Frequency\n';
        invoices.forEach(inv => {
          const clientName = allClients.find(c => c.id === inv.client_id)?.name || 'Unknown Client';
          const effStatus = getEffectiveStatus(inv);
          csvContent += `"${inv.id.substring(0,8)}","${clientName.replace(/"/g, '""')}",${inv.amount},"${effStatus.toUpperCase()}","${inv.due_date}","${inv.type || 'standard'}","${inv.frequency || 'N/A'}"\n`;
        });
      } else if (type === 'crm') {
        csvContent = 'Deal Title,Value (NGN),Stage,Client,Created Date\n';
        deals.forEach(d => {
          const clientName = allClients.find(c => c.id === d.client_id)?.name || 'Unknown Client';
          csvContent += `"${d.title.replace(/"/g, '""')}",${d.value},"${d.stage}","${clientName.replace(/"/g, '""')}","${d.created_at}"\n`;
        });
      } else {
        csvContent = 'Task Title,Status,Priority,Due Date,Created Date\n';
        tasks.forEach(t => {
          csvContent += `"${t.title.replace(/"/g, '""')}","${t.status.toUpperCase()}","${t.priority.toUpperCase()}","${t.due_date}","${t.created_at}"\n`;
        });
      }

      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename=Trackam-Report-${type}-${dateRange}.csv`,
        },
      });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PDF KIT REPORT GENERATION
    // ─────────────────────────────────────────────────────────────────────────
    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 40 });
        const buffers: Buffer[] = [];
        
        doc.on('data', chunk => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', err => reject(err));

        const textPrimary = '#0f172a';
        const textSecondary = '#475569';
        const textMuted = '#94a3b8';
        const borderCol = '#e2e8f0';
        const cardBg = '#f8fafc';

        // Branded Cover/Header Banner
        doc.rect(0, 0, 595, 120).fill(brandColor);
        
        // Branded title
        doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text(companyName.toUpperCase(), 40, 35, { characterSpacing: 1.5 });
        doc.fontSize(9).font('Helvetica').text('ENTERPRISE STRATEGIC CRM & ANALYTICS REPORT', 40, 65, { characterSpacing: 2 });
        doc.text(`DATE RANGE: ${dateRange.toUpperCase()}  |  GENERATED BY: ${user!.email.toUpperCase()}`, 40, 80);

        // Header Metadata
        doc.fillColor('#ffffff').fontSize(14).font('Helvetica-Bold').text(`${type.toUpperCase()} SUMMARY`, 420, 35, { align: 'right' });
        doc.fontSize(8).font('Helvetica').text(`TRACKAM REPORT PORTAL`, 420, 55, { align: 'right' });

        const startY = 150;

        // Draw Executive Summary Section
        doc.fillColor(textPrimary).fontSize(12).font('Helvetica-Bold').text('EXECUTIVE KEY PERFORMANCE METRICS', 40, startY);
        doc.moveTo(40, startY + 18).lineTo(555, startY + 18).stroke(borderCol);

        // Render Summary Grid Cards (Three-column layout)
        const renderGridCard = (x: number, y: number, w: number, h: number, title: string, value: string, sub: string) => {
          doc.rect(x, y, w, h).fill(cardBg);
          doc.strokeColor(borderCol).rect(x, y, w, h).stroke();
          
          doc.fillColor(textSecondary).fontSize(8).font('Helvetica-Bold').text(title.toUpperCase(), x + 15, y + 12);
          doc.fillColor(brandColor).fontSize(14).font('Helvetica-Bold').text(value, x + 15, y + 25);
          doc.fillColor(textMuted).fontSize(7).font('Helvetica').text(sub, x + 15, y + 42);
        };

        const gridY = startY + 30;
        const cardWidth = 160;
        const cardHeight = 55;

        if (type === 'financial') {
          renderGridCard(40, gridY, cardWidth, cardHeight, 'Revenue Collected', `NGN ${totalRevenue.toLocaleString()}`, 'Processed client payments');
          renderGridCard(215, gridY, cardWidth, cardHeight, 'Outstanding Revenue', `NGN ${pendingRevenue.toLocaleString()}`, 'Pending invoicing cycles');
          renderGridCard(390, gridY, cardWidth, cardHeight, 'Total Invoices', `${invoices.length} invoices`, 'Issued billing records');
        } else if (type === 'crm') {
          renderGridCard(40, gridY, cardWidth, cardHeight, 'Pipeline Value', `NGN ${totalDealsValue.toLocaleString()}`, 'Total open, won & lost deals');
          renderGridCard(215, gridY, cardWidth, cardHeight, 'Won Pipeline', `NGN ${wonDealsValue.toLocaleString()}`, 'Successfully closed valuation');
          renderGridCard(390, gridY, cardWidth, cardHeight, 'Sales Win Rate', `${winRate}% conversion`, 'Leads closed vs lost count');
        } else {
          renderGridCard(40, gridY, cardWidth, cardHeight, 'Active Task Log', `${tasks.length} total tasks`, 'Company assigned operations');
          renderGridCard(215, gridY, cardWidth, cardHeight, 'Completion Rate', `${taskCompletionRate}% done`, 'Closed vs open backlog tasks');
          renderGridCard(390, gridY, cardWidth, cardHeight, 'CRM Active Leads', `${leads.length} records`, 'Leads in sales funnel');
        }

        // Data Table Section
        const tableStartY = gridY + 80;
        doc.fillColor(textPrimary).fontSize(12).font('Helvetica-Bold').text(
          type === 'financial' ? 'LATEST DETAILED INVOICE LOG' :
          type === 'crm' ? 'DEALS & CONVERSIONS LOG' : 'OPERATIONAL TASKS & AUDIT LOG',
          40, tableStartY
        );
        doc.moveTo(40, tableStartY + 18).lineTo(555, tableStartY + 18).stroke(borderCol);

        // Table Header
        const headerY = tableStartY + 28;
        doc.rect(40, headerY, 515, 20).fill('#f1f5f9');
        doc.strokeColor(borderCol).rect(40, headerY, 515, 20).stroke();

        doc.fillColor(textSecondary).fontSize(8).font('Helvetica-Bold');
        if (type === 'financial') {
          doc.text('INVOICE ID', 55, headerY + 6);
          doc.text('CLIENT NAME', 145, headerY + 6);
          doc.text('TYPE', 285, headerY + 6);
          doc.text('DUE DATE', 365, headerY + 6);
          doc.text('AMOUNT (NGN)', 445, headerY + 6, { align: 'right', width: 95 });
        } else if (type === 'crm') {
          doc.text('DEAL TITLE', 55, headerY + 6);
          doc.text('CLIENT', 205, headerY + 6);
          doc.text('STAGE', 365, headerY + 6);
          doc.text('VALUATION (NGN)', 445, headerY + 6, { align: 'right', width: 95 });
        } else {
          doc.text('TASK DESCRIPTION', 55, headerY + 6);
          doc.text('STATUS', 285, headerY + 6);
          doc.text('PRIORITY', 365, headerY + 6);
          doc.text('DUE DATE', 445, headerY + 6, { align: 'right', width: 95 });
        }

        // Render rows
        let rowY = headerY + 20;
        const rowHeight = 22;
        doc.font('Helvetica').fontSize(8).fillColor(textPrimary);

        const listToRender = type === 'financial' ? invoices : type === 'crm' ? deals : tasks;

        if (listToRender.length === 0) {
          doc.fillColor(textMuted).text('No records found matching the filters.', 55, rowY + 10, { align: 'center', width: 500 });
        } else {
          listToRender.slice(0, 18).forEach((item: any, idx: number) => {
            // Alternating backgrounds
            if (idx % 2 === 1) {
              doc.rect(40, rowY, 515, rowHeight).fill('#f8fafc');
            }
            doc.strokeColor(borderCol).rect(40, rowY, 515, rowHeight).stroke();
            doc.fillColor(textPrimary);

            if (type === 'financial') {
              const clientName = allClients.find(c => c.id === item.client_id)?.name || 'Unknown Client';
              const effStatus = getEffectiveStatus(item);
              
              doc.text(item.id.substring(0, 8).toUpperCase(), 55, rowY + 7);
              doc.text(clientName.substring(0, 22), 145, rowY + 7);
              doc.text((item.type || 'standard').toUpperCase(), 285, rowY + 7);
              doc.text(new Date(item.due_date).toLocaleDateString(), 365, rowY + 7);
              doc.fillColor(effStatus === 'paid' ? brandColor : '#ef4444').font('Helvetica-Bold');
              doc.text(`NGN ${Number(item.amount).toLocaleString()}`, 445, rowY + 7, { align: 'right', width: 95 });
              doc.font('Helvetica');
            } else if (type === 'crm') {
              const clientName = allClients.find(c => c.id === item.client_id)?.name || 'Unknown Client';
              
              doc.text(item.title.substring(0, 26), 55, rowY + 7);
              doc.text(clientName.substring(0, 22), 205, rowY + 7);
              doc.fillColor(item.stage === 'Won' ? brandColor : item.stage === 'Lost' ? '#ef4444' : '#3b82f6').font('Helvetica-Bold');
              doc.text(item.stage.toUpperCase(), 365, rowY + 7);
              doc.fillColor(textPrimary);
              doc.text(`NGN ${Number(item.value).toLocaleString()}`, 445, rowY + 7, { align: 'right', width: 95 });
              doc.font('Helvetica');
            } else {
              doc.text(item.title.substring(0, 42), 55, rowY + 7);
              doc.fillColor(item.status === 'done' ? brandColor : '#f59e0b').font('Helvetica-Bold');
              doc.text(item.status.toUpperCase(), 285, rowY + 7);
              doc.fillColor(item.priority === 'high' || item.priority === 'urgent' ? '#ef4444' : textSecondary);
              doc.text(item.priority.toUpperCase(), 365, rowY + 7);
              doc.fillColor(textPrimary).font('Helvetica');
              doc.text(item.due_date ? new Date(item.due_date).toLocaleDateString() : 'N/A', 445, rowY + 7, { align: 'right', width: 95 });
            }

            rowY += rowHeight;
          });
        }

        // Bottom Footer
        const footerY = 760;
        doc.moveTo(40, footerY - 5).lineTo(555, footerY - 5).stroke(borderCol);
        doc.fillColor(textMuted).fontSize(7).text(`This document contains confidential proprietary insights for ${companyName}. Generated automatically by Trackam Workspace Intelligence Engine.`, 40, footerY);
        doc.text('Page 1 of 1', 500, footerY, { align: 'right' });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=Trackam-Executive-Report-${type}.pdf`,
      },
    });
  } catch (e: any) {
    console.error('API Error [reports]:', e);
    return NextResponse.json({ error: 'Failed to generate company report' }, { status: 500 });
  }
}
