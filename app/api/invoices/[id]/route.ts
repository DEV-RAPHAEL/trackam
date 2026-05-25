import { NextResponse } from 'next/server';
import { db, initDb } from '@/lib/db';
import { verifyAuth, verifyOwnership } from '@/lib/auth';

const table_name = 'invoices';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, errorResponse } = await verifyAuth(req);
  if (errorResponse) return errorResponse;

  try {
    await initDb();
    
    // Ownership check
    const isOwner = await verifyOwnership(table_name, id, user!.company_id);
    if (!isOwner && user?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized: Record mismatch' }, { status: 403 });
    }

    const body = await req.json();
    
    // Format items as string for PGlite compatibility if present
    if (body.items && typeof body.items !== 'string') {
      body.items = JSON.stringify(body.items);
    }

    
    // SECURITY PATCH: Prevent Mass Assignment & IDOR payload injection
    delete body.id;
    delete body.company_id;
    delete body.created_at;

    const keys = Object.keys(body);
    const values = Object.values(body);
    
    if (keys.length === 0) return NextResponse.json({ success: true });
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    values.push(id);

    await db.query(`UPDATE ${table_name} SET ${setClause} WHERE id = $${values.length}`, values);

    // Send a payment confirmation receipt email if the status is changed to 'paid'
    if (body.status === 'paid') {
      try {
        const invDetails = await db.query(`
          SELECT i.*, c.name as client_name, c.email as client_email, 
                 comp.name as company_name
          FROM invoices i 
          JOIN clients c ON i.client_id = c.id 
          JOIN companies comp ON i.company_id = comp.id 
          WHERE i.id = $1
        `, [id]);
        
        if (invDetails.rows.length > 0) {
          const inv = invDetails.rows[0] as any;
          const { sendEmail } = require('@/lib/mailer');
          
          await sendEmail({
            to: inv.client_email,
            subject: `Payment Received! Thank you - Invoice #${inv.id.split('-')[1] || inv.id}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                <div style="text-align: center; margin-bottom: 25px;">
                  <div style="display: inline-block; background: #d1fae5; color: #065f46; padding: 12px; border-radius: 50%; width: 48px; height: 48px; line-height: 48px; font-size: 24px; font-weight: bold; margin-bottom: 10px;">✓</div>
                  <h2 style="color: #065f46; margin: 0 0 5px 0; font-size: 20px;">Payment Confirmed</h2>
                  <p style="color: #64748b; font-size: 13px; margin: 0;">Invoice #${inv.id.split('-')[1] || inv.id}</p>
                </div>
                <p style="color: #334155; font-size: 15px; line-height: 1.5;">Hi ${inv.client_name},</p>
                <p style="color: #334155; font-size: 15px; line-height: 1.5;">We are pleased to inform you that your payment for invoice <strong>#${inv.id.split('-')[1] || inv.id}</strong> has been successfully received and processed by <strong>${inv.company_name}</strong>.</p>
                
                <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #cbd5e1; text-align: center;">
                  <p style="margin: 0; color: #64748b; font-size: 13px; text-transform: uppercase; tracking-spacing: 1px;">Amount Paid</p>
                  <h1 style="margin: 5px 0; color: #0f172a; font-size: 28px;">₦${Number(inv.amount).toLocaleString()}</h1>
                  <p style="margin: 0; color: #059669; font-size: 13px; font-weight: bold;">Status: Fully Paid</p>
                </div>
                
                <p style="color: #334155; font-size: 15px; line-height: 1.5;">Thank you for your business and timely settlement! A copy of this receipt has been archived under your client history.</p>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
                <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">Powered by Trackam CRM</p>
              </div>
            `
          });
          console.log(`✅ Payment confirmation email sent to ${inv.client_email}`);
        }
      } catch (emailErr) {
        console.error("Failed to send payment receipt email:", emailErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error(`API Error [PUT invoices/${id}]:`, e);
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, errorResponse } = await verifyAuth(req);
  if (errorResponse) return errorResponse;

  try {
    await initDb();
    
    // Ownership check
    const isOwner = await verifyOwnership(table_name, id, user!.company_id);
    if (!isOwner && user?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized: Record mismatch' }, { status: 403 });
    }

    await db.query(`DELETE FROM ${table_name} WHERE id = $1`, [id]);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error(`API Error [DELETE invoices/${id}]:`, e);
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 });
  }
}

