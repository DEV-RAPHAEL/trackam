import { NextResponse } from 'next/server';
import { db, initDb } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { sendEmail } from '@/lib/mailer';
import { inviteEmail } from '@/lib/email-templates';
import { checkRateLimit, OTP_RESEND_LIMIT } from '@/lib/rate-limit';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret-change-in-production';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user: requester, errorResponse } = await verifyAuth(req);
  if (errorResponse) return errorResponse;

  // Rate limit resend invites to prevent email spam
  const limit = checkRateLimit(`resend-invite:${id}`, OTP_RESEND_LIMIT.max, OTP_RESEND_LIMIT.windowMs);
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Please wait before resending the invite.' }, { status: 429 });
  }

  try {
    await initDb();

    const userResult = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const user = userResult.rows[0] as any;

    // SECURITY: Only allow admins/superadmins in the same company
    if (
      requester?.company_id !== user.company_id &&
      requester?.role !== 'superadmin'
    ) {
      return NextResponse.json({ error: 'Unauthorized: Company mismatch' }, { status: 403 });
    }

    if (requester?.role !== 'owner' && requester?.role !== 'admin' && requester?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized: Only owners or admins can resend invites.' }, { status: 403 });
    }

    // Get inviter name and company name
    const requesterResult = await db.query('SELECT name FROM users WHERE id = $1', [requester!.id]);
    const requesterName = (requesterResult.rows[0] as any)?.name || 'Your team';

    const companyResult = await db.query('SELECT name FROM companies WHERE id = $1', [user.company_id]);
    const companyName = (companyResult.rows[0] as any)?.name || 'your workspace';

    // Generate fresh 72-hour invite token
    const inviteToken = jwt.sign(
      { email: user.email, company_id: user.company_id, role: user.role },
      JWT_SECRET,
      { expiresIn: '72h' }
    );

    const frontendUrl = process.env.FRONTEND_URL || 'https://trackam.com.ng';
    const inviteUrl = `${frontendUrl}/accept-invite?token=${inviteToken}`;

    const emailSent = await sendEmail({
      to: user.email,
      subject: `Reminder: ${requesterName} invited you to join ${companyName} on Trackam`,
      html: inviteEmail({
        name: user.name,
        inviterName: requesterName,
        companyName,
        role: user.role,
        inviteUrl,
      }),
    });

    if (emailSent.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }
  } catch (e: any) {
    console.error(`API Error [POST users/${id}/resend]:`, e);
    return NextResponse.json({ error: 'Failed to resend invite' }, { status: 500 });
  }
}
