import { NextResponse } from 'next/server';
import { db, initDb } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { sendEmail } from '@/lib/mailer';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-prod';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user: requester, errorResponse } = await verifyAuth(req);
  if (errorResponse) return errorResponse;

  try {
    await initDb();
    
    const userResult = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    if (userResult.rows.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const user = userResult.rows[0] as any;

    // Security: Ensure requester belongs to same company
    if (requester?.company_id !== user.company_id && requester?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Company mismatch' }, { status: 403 });
    }

    // Generate a new temporary invite token
    const inviteToken = jwt.sign({ email: user.email, company_id: user.company_id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const emailSent = await sendEmail({
      to: user.email,
      subject: `Reminder: Join your team on Trackam CRM`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #4f46e5;">Your Invite is Waiting!</h2>
          <p>Hi ${user.name},</p>
          <p>This is a reminder that you've been invited to join your company's workspace on <strong>Trackam CRM</strong>.</p>
          <div style="margin: 30px 0;">
            <a href="${frontendUrl}/accept-invite?token=${inviteToken}" style="background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Accept Invitation & Login</a>
          </div>
          <p style="color: #64748b; font-size: 14px;">If the button doesn't work, copy and paste this link: <br/> ${frontendUrl}/accept-invite?token=${inviteToken}</p>
        </div>
      `
    });

    if (emailSent.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }
  } catch(e: any) {
    console.error(`API Error [POST users/${id}/resend]:`, e);
    return NextResponse.json({ error: 'Failed to resend invite' }, { status: 500 });
  }
}

