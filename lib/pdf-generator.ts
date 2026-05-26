import PDFDocument from 'pdfkit';

export function generateInvoicePdf(invoice: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];
      
      doc.on('data', chunk => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', err => reject(err));

      // ─── Theme Configurations ──────────────────────────────────────────────
      const isLuxury = invoice.template_id === 'tpl-luxury' || invoice.template_id === 'luxury';
      const brandColor = invoice.brand_color || (isLuxury ? '#c5a880' : '#4f46e5'); // Warm bronze gold for luxury

      const bgColor = isLuxury ? '#111111' : '#ffffff';
      const textPrimary = isLuxury ? '#ffffff' : '#0f172a';
      const textSecondary = isLuxury ? '#cbd5e1' : '#475569';
      const textMuted = isLuxury ? '#94a3b8' : '#64748b';
      const borderTheme = isLuxury ? '#222222' : '#e2e8f0';
      const headerBg = isLuxury ? '#1e1e1e' : '#f1f5f9';
      const rowAltBg = isLuxury ? '#151515' : '#f8fafc';

      if (isLuxury) {
        // Draw deep luxury dark background over entire page
        doc.rect(0, 0, 612, 792).fill(bgColor);
      } else {
        // Standard header banner
        doc.rect(0, 0, 612, 100).fill(brandColor);
      }

      // ─── Document Header ───────────────────────────────────────────────────
      if (isLuxury) {
        // Centered Premium Luxury Letterhead
        doc.fillColor(brandColor).fontSize(20).font('Helvetica-Bold').text(String(invoice.company_name).toUpperCase(), 50, 40, { align: 'center', characterSpacing: 2 });
        doc.fontSize(8).fillColor(textMuted).text('PRIVATE & CONFIDENTIAL  |  PREMIUM INVOICE', 50, 65, { align: 'center', characterSpacing: 3 });
        doc.moveTo(50, 90).lineTo(562, 90).stroke(borderTheme);
      } else {
        // Standard Company Title & Brand
        doc.fillColor('#ffffff').fontSize(24).text(String(invoice.company_name).toUpperCase(), 50, 35, { characterSpacing: 1 });
        doc.fontSize(10).fillColor('#e0e7ff').text('INVOICE PORTAL', 50, 65);

        // Invoice info (Right aligned in banner)
        doc.fillColor('#ffffff').fontSize(12).text('INVOICE', 400, 30, { align: 'right' });
        doc.fontSize(16).text(`#${String(invoice.id).split('-')[1] || invoice.id}`, 400, 48, { align: 'right' });
      }

      // ─── Metadata block ────────────────────────────────────────────────────
      const startY = 130;
      doc.fillColor(textMuted).fontSize(9).font('Helvetica-Bold').text('BILLED TO:', 50, startY);
      doc.fillColor(textPrimary).fontSize(11).font('Helvetica-Bold').text(invoice.client_name, 50, startY + 15);
      doc.font('Helvetica');
      doc.fillColor(textSecondary).fontSize(9).text(invoice.client_email, 50, startY + 32);

      doc.fillColor(textMuted).fontSize(9).font('Helvetica-Bold').text(isLuxury ? 'INVOICE REF:' : 'INVOICE DATE:', 400, startY, { align: 'right' });
      doc.fillColor(isLuxury ? brandColor : textPrimary).fontSize(10).text(isLuxury ? `#${String(invoice.id).split('-')[1] || invoice.id}` : new Date(invoice.created_at || Date.now()).toLocaleDateString(), 400, startY + 15, { align: 'right' });
      
      doc.fillColor(textMuted).fontSize(9).font('Helvetica-Bold').text(isLuxury ? 'SETTLEMENT DATE:' : 'DUE DATE:', 400, startY + 35, { align: 'right' });
      doc.fillColor('#ef4444').fontSize(10).text(new Date(invoice.due_date).toLocaleDateString(), 400, startY + 50, { align: 'right' });

      // ─── Items Table ───────────────────────────────────────────────────────
      const tableHeaderY = 230;
      doc.rect(50, tableHeaderY, 512, 25).fill(headerBg);
      doc.fillColor(textSecondary).fontSize(9).text('DESCRIPTION', 65, tableHeaderY + 8);
      doc.text('QTY', 330, tableHeaderY + 8, { align: 'right', width: 40 });
      doc.text('PRICE', 390, tableHeaderY + 8, { align: 'right', width: 70 });
      doc.text('TOTAL', 480, tableHeaderY + 8, { align: 'right', width: 70 });

      // Render items
      let items = [];
      try {
        items = typeof invoice.items === 'string' ? JSON.parse(invoice.items) : (invoice.items || []);
      } catch (e) {
        items = [];
      }
      if (!Array.isArray(items) || items.length === 0) {
        items = [{ description: 'Project Services', quantity: 1, rate: invoice.amount, amount: invoice.amount }];
      }

      let currentY = tableHeaderY + 25;
      items.forEach((item: any, i: number) => {
        // Alternating background rows
        if (i % 2 === 1) {
          doc.rect(50, currentY, 512, 25).fill(rowAltBg);
        }
        
        const desc = item.description || 'Project Services';
        const qty = Number(item.quantity !== undefined ? item.quantity : (item.qty !== undefined ? item.qty : 1));
        const rate = Number(item.rate !== undefined ? item.rate : (item.price !== undefined ? item.price : 0));
        const amt = Number(item.amount !== undefined ? item.amount : (qty * rate));

        doc.fillColor(textPrimary).fontSize(10).text(desc, 65, currentY + 8);
        doc.text(String(qty), 330, currentY + 8, { align: 'right', width: 40 });
        doc.text(`NGN ${rate.toLocaleString()}`, 390, currentY + 8, { align: 'right', width: 70 });
        doc.text(`NGN ${amt.toLocaleString()}`, 480, currentY + 8, { align: 'right', width: 70 });
        currentY += 25;
      });

      // Bottom Divider Line
      doc.moveTo(50, currentY + 15).lineTo(562, currentY + 15).stroke(borderTheme);

      // Totals Box
      const totalBoxY = currentY + 30;
      doc.rect(342, totalBoxY, 220, 45).fill(brandColor);
      doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold').text(isLuxury ? 'TOTAL VALUATION' : 'TOTAL AMOUNT DUE', 357, totalBoxY + 10);
      doc.fontSize(15).font('Helvetica-Bold').text(`NGN ${Number(invoice.amount).toLocaleString()}`, 357, totalBoxY + 22);
      doc.font('Helvetica');

      // Thank you / powered by
      doc.fillColor(textMuted).fontSize(9).text('Thank you for your business!', 50, totalBoxY + 20);
      doc.text('Powered by Trackam CRM', 50, totalBoxY + 35);

      // ─── Bank Details card (Offline transfers) ──────────────────────────────
      if (invoice.bank_name || invoice.account_name || invoice.account_number) {
        const bankY = totalBoxY + 60;
        doc.fillColor(headerBg).rect(50, bankY, 512, 45).fill();
        doc.strokeColor(borderTheme).rect(50, bankY, 512, 45).stroke();
        
        doc.fillColor(isLuxury ? brandColor : '#475569').fontSize(8).font('Helvetica-Bold').text('OFFLINE DIRECT BANK TRANSFER DETAILS', 65, bankY + 10);
        doc.font('Helvetica').fontSize(8).fillColor(textSecondary);
        
        let bankText = '';
        if (invoice.bank_name) bankText += `Bank: ${invoice.bank_name}   |   `;
        if (invoice.account_name) bankText += `Account Name: ${invoice.account_name}   |   `;
        if (invoice.account_number) bankText += `Account Number: ${invoice.account_number}`;
        
        if (bankText.endsWith('   |   ')) {
          bankText = bankText.slice(0, -7);
        }
        
        doc.text(bankText, 65, bankY + 24);
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
