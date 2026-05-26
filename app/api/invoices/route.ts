import { NextResponse } from 'next/server';
import { db, initDb } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

const table_name = 'invoices';

export async function POST(req: Request) {
  const { user, errorResponse } = await verifyAuth(req);
  if (errorResponse) return errorResponse;

  try {
    await initDb();
    const rawBody = await req.json();
    
    // Whitelist valid DB columns
    const ALLOWED_COLUMNS = ['id', 'company_id', 'client_id', 'amount', 'status', 'due_date', 'items', 'created_at', 'type', 'bank_name', 'account_name', 'account_number', 'frequency', 'created_by'];
    const body: Record<string, any> = {};
    
    for (const key of ALLOWED_COLUMNS) {
      if (rawBody[key] !== undefined) {
        body[key] = rawBody[key];
      }
    }

    // Security: Enforce user's company_id from authenticated session
    body.company_id = user!.company_id;
    body.created_by = user!.id;
    
    // Format items as string for SQLite compatibility
    if (body.items && typeof body.items !== 'string') {
      body.items = JSON.stringify(body.items);
    }

    // Security: Generate fallback values if missing, ensuring they are not deleted
    if (!body.id) {
      body.id = crypto.randomUUID();
    }
    if (!body.created_at) {
      body.created_at = new Date().toISOString();
    }

    const keys = Object.keys(body);
    const values = Object.values(body);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    
    await db.query(`INSERT INTO ${table_name} (${keys.join(', ')}) VALUES (${placeholders})`, values);

    // If "Send immediately on creation" was selected in the UI
    if (rawBody.is_sent) {
      try {
        const invResult = await db.query(`
          SELECT i.*, c.name as client_name, c.email as client_email, 
                 comp.name as company_name, comp.bank_name as comp_bank, comp.account_name as comp_acc_name, comp.account_number as comp_acc_num, comp.brand_color as brand_color
          FROM invoices i 
          JOIN clients c ON i.client_id = c.id 
          JOIN companies comp ON i.company_id = comp.id 
          WHERE i.id = $1
        `, [body.id]);

        if (invResult.rows.length > 0) {
          const inv = invResult.rows[0] as any;
          
          // Fallback to company bank details if not overridden in the invoice
          inv.bank_name = inv.bank_name || inv.comp_bank;
          inv.account_name = inv.account_name || inv.comp_acc_name;
          inv.account_number = inv.account_number || inv.comp_acc_num;
          const { generateInvoicePdf } = require('@/lib/pdf-generator');
          const pdfBuffer = await generateInvoicePdf(inv);
          const { sendEmail } = require('@/lib/mailer');

          await sendEmail({
            to: inv.client_email,
            subject: `New Invoice from ${inv.company_name} - #${inv.id.split('-')[1] || inv.id}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                <h2 style="color: ${inv.brand_color || '#4f46e5'}; margin: 0 0 15px 0; font-size: 20px;">New Invoice Generated</h2>
                <p style="color: #334155; font-size: 15px; line-height: 1.5;">Hi ${inv.client_name},</p>
                <p style="color: #334155; font-size: 15px; line-height: 1.5;">A new invoice has been generated for your recent project with <strong>${inv.company_name}</strong>.</p>
                <p style="color: #334155; font-size: 15px; line-height: 1.5;">We have attached a professional PDF copy of the invoice to this email for your records.</p>
                
                <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0; text-align: center;">
                  <p style="margin: 0; color: #64748b; font-size: 13px; text-transform: uppercase;">Amount Due</p>
                  <h1 style="margin: 5px 0; color: #0f172a; font-size: 28px;">₦${Number(inv.amount).toLocaleString()}</h1>
                  <p style="margin: 0; color: #64748b; font-size: 13px;">Due Date: ${new Date(inv.due_date).toLocaleDateString()}</p>
                </div>
                
                ${inv.bank_name || inv.account_name || inv.account_number ? `
                <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #cbd5e1;">
                  <p style="margin: 0 0 10px 0; color: #475569; font-weight: bold; font-size: 14px;">Bank Payment Details (Direct Transfer)</p>
                  ${inv.bank_name ? `<p style="margin: 3px 0; font-size: 13px; color: #334155;"><strong>Bank:</strong> ${inv.bank_name}</p>` : ''}
                  ${inv.account_name ? `<p style="margin: 3px 0; font-size: 13px; color: #334155;"><strong>Account Name:</strong> ${inv.account_name}</p>` : ''}
                  ${inv.account_number ? `<p style="margin: 3px 0; font-size: 13px; color: #334155;"><strong>Account Number:</strong> ${inv.account_number}</p>` : ''}
                </div>
                ` : ''}
                
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
                <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">Invoice ID: ${inv.id}</p>
              </div>
            `,
            attachments: [{
              filename: `Invoice-${inv.id.split('-')[1] || inv.id}.pdf`,
              content: pdfBuffer,
              contentType: 'application/pdf'
            }]
          });

          // Update last_sent_at and is_sent in database to keep aligned
          await db.query('UPDATE invoices SET is_sent = 1, last_sent_at = $1 WHERE id = $2', [new Date().toISOString(), body.id]);
        }
      } catch (sendErr) {
        console.error("Auto invoice send failed:", sendErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error(`API Error [POST ${table_name}]:`, e);
    return NextResponse.json({ error: `Failed to create ${table_name}` }, { status: 500 });
  }
}

