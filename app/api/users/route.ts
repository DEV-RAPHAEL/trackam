import { NextResponse } from 'next/server';
import { db, initDb } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { verifyAuth } from '@/lib/auth';
import { sendEmail } from '@/lib/mailer';
import { inviteEmail } from '@/lib/email-templates';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret-change-in-production';

export async function POST(req: Request) {
  const { user: requester, errorResponse } = await verifyAuth(req);
  if (errorResponse) return errorResponse;

  // Only owners, admins, and superadmins can invite users
  if (requester!.role !== 'owner' && requester!.role !== 'admin' && requester!.role !== 'superadmin') {
    return NextResponse.json({ error: 'Unauthorized: Only owners or admins can invite team members.' }, { status: 403 });
  }

  try {
    await initDb();
    const body = await req.json();

    // SECURITY: Prevent mass assignment — only allow safe fields
    const providedId = body.id || crypto.randomUUID();

    if (body.email) {
      const emailCheck = await db.query('SELECT id FROM users WHERE email = $1', [body.email]);
      if (emailCheck.rows.length > 0) {
        return NextResponse.json({ error: 'This email is already in use.' }, { status: 400 });
      }
    }

    if (body.name) {
      const nameCheck = await db.query('SELECT id FROM users WHERE name = $1 AND company_id = $2', [body.name, requester!.company_id]);
      if (nameCheck.rows.length > 0) {
        return NextResponse.json({ error: 'A team member with this name already exists in your workspace.' }, { status: 400 });
      }
    }

    // SECURITY: Force company_id and safe defaults — no mass assignment
    const newUser = {
      id: providedId,
      company_id: requester!.company_id,
      name: body.name,
      email: body.email,
      role: body.role || 'member',
      status: 'invited',
      email_verified: 0,
      otp_enabled: 1,
      // password intentionally omitted — set via accept-invite flow
    };

    const keys = Object.keys(newUser);
    const values = Object.values(newUser);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    await db.query(`INSERT INTO users (${keys.join(', ')}) VALUES (${placeholders})`, values);

    // ── Auto-send invite email ─────────────────────────────────────────────
    // Get the requester's name for the invite email
    const requesterResult = await db.query('SELECT name FROM users WHERE id = $1', [requester!.id]);
    const requesterName = (requesterResult.rows[0] as any)?.name || 'Your team';

    // Get company name
    const companyResult = await db.query('SELECT name FROM companies WHERE id = $1', [requester!.company_id]);
    const companyName = (companyResult.rows[0] as any)?.name || 'your workspace';

    // Generate a 72-hour invite token
    const inviteToken = jwt.sign(
      { email: newUser.email, company_id: newUser.company_id, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '72h' }
    );

    const frontendUrl = process.env.FRONTEND_URL || 'https://trackam.com.ng';
    const inviteUrl = `${frontendUrl}/accept-invite?token=${inviteToken}`;

    await sendEmail({
      to: newUser.email,
      subject: `${requesterName} invited you to join ${companyName} on Trackam`,
      html: inviteEmail({
        name: newUser.name,
        inviterName: requesterName,
        companyName,
        role: newUser.role,
        inviteUrl,
      }),
    }).catch((err) => console.error('Invite email failed:', err));

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('POST /api/users error:', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
