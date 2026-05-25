import { NextResponse } from 'next/server';
import { db, initDb } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { sendEmail } from '@/lib/mailer';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, errorResponse } = await verifyAuth(req);
  if (errorResponse) return errorResponse;

  try {
    await initDb();
    
    const invResult = await db.query(`
      SELECT i.*, c.name as client_name, c.email as client_email, 
             comp.name as company_name, comp.bank_name, comp.account_name, comp.account_number, comp.brand_color as brand_color
      FROM invoices i 
      JOIN clients c ON i.client_id = c.id 
      JOIN companies comp ON i.company_id = comp.id 
      WHERE i.id = $1
    `, [id]);

    if (invResult.rows.length === 0) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    const inv = invResult.rows[0] as any;

    // Security: Ensure requester belongs to same company
    if (user?.company_id !== inv.company_id && user?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized: Company mismatch' }, { status: 403 });
    }

    // Proactively generate the PDF invoice attachment
    const { generateInvoicePdf } = require('@/lib/pdf-generator');
    const pdfBuffer = await generateInvoicePdf(inv);

    const emailSent = await sendEmail({
      to: inv.client_email,
      subject: `New Invoice from ${inv.company_name} - #${inv.id.split('-')[1]}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #4f46e5;">New Invoice Generated</h2>
          <p>Hi ${inv.client_name},</p>
          <p>A new invoice has been generated for your recent project with <strong>${inv.company_name}</strong>.</p>
          <p>We have attached the professional PDF copy of the invoice to this email for your records.</p>
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #64748b; font-size: 14px;">Amount Due</p>
            <h1 style="margin: 5px 0; color: #0f172a;">₦${Number(inv.amount).toLocaleString()}</h1>
            <p style="margin: 0; color: #64748b; font-size: 14px;">Due Date: ${new Date(inv.due_date).toLocaleDateString()}</p>
          </div>
          ${inv.bank_name || inv.account_name || inv.account_number ? `
          <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #cbd5e1;">
            <p style="margin: 0 0 10px 0; color: #475569; font-weight: bold; font-size: 14px;">Bank Payment Details</p>
            ${inv.bank_name ? `<p style="margin: 3px 0; font-size: 13px; color: #334155;"><strong>Bank:</strong> ${inv.bank_name}</p>` : ''}
            ${inv.account_name ? `<p style="margin: 3px 0; font-size: 13px; color: #334155;"><strong>Account Name:</strong> ${inv.account_name}</p>` : ''}
            ${inv.account_number ? `<p style="margin: 3px 0; font-size: 13px; color: #334155;"><strong>Account Number:</strong> ${inv.account_number}</p>` : ''}
          </div>
          ` : ''}
          <div style="margin: 30px 0;">
             <p style="color: #64748b;">You can also view and pay your invoice online using the link below:</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/pay/${inv.id}" style="background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View & Pay Invoice Online</a>
          </div>
          <p style="color: #94a3b8; font-size: 12px;">Invoice ID: ${inv.id}</p>
        </div>
      `,
      attachments: [{
        filename: `Invoice-${inv.id.split('-')[1] || inv.id}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }]
    });

    if (emailSent.success) {
      await db.query('UPDATE invoices SET is_sent = TRUE, last_sent_at = $1 WHERE id = $2', [new Date().toISOString(), id]);
      
      const logId = 'log-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
      await db.query(
        'INSERT INTO activity_logs (id, company_id, user_id, action, description, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
        [logId, inv.company_id, user!.id, 'Invoice Sent', `Emailed invoice for ₦${inv.amount} to ${inv.client_name}`, new Date().toISOString()]
      );

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ 
        error: 'Failed to send email', 
        details: emailSent.error 
      }, { status: 500 });
    }
  } catch(e: any) {
    console.error(`API Error [POST invoices/${id}/send]:`, e);
    return NextResponse.json({ error: 'Failed to send invoice' }, { status: 500 });
  }
}

