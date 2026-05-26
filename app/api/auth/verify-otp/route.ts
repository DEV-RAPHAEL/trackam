import { NextResponse } from 'next/server';
import { db, initDb } from '@/lib/db';
import jwt from 'jsonwebtoken';
import { verifyOtp } from '@/lib/otp';
import { checkRateLimit, getClientIp, OTP_RESEND_LIMIT } from '@/lib/rate-limit';
import { sendEmail } from '@/lib/mailer';
import { emailVerifiedEmail } from '@/lib/email-templates';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('FATAL: JWT_SECRET environment variable is not set!');
}

const SECRET = JWT_SECRET || 'dev-only-secret-change-in-production';

/**
 * POST /api/auth/verify-otp
 *
 * Accepts an OTP code and returns a signed JWT on success.
 *
 * Body: { email, code, type: 'login_otp' | 'email_verify' | 'password_reset' }
 *
 * On success (login_otp / email_verify):
 *   Returns { token, user, company }
 *
 * On success (password_reset):
 *   Returns { valid: true, email } — the client then calls /reset-password
 */
export async function POST(req: Request) {
  try {
    await initDb();
    const ip = getClientIp(req);
    const { email, code, type } = await req.json();

    if (!email || !code || !type) {
      return NextResponse.json({ error: 'email, code, and type are required' }, { status: 400 });
    }

    // Rate limit OTP verification attempts
    const limit = checkRateLimit(`otp:${email}`, OTP_RESEND_LIMIT.max * 2, OTP_RESEND_LIMIT.windowMs);
    if (!limit.allowed) {
      return NextResponse.json({ error: 'Too many attempts. Please request a new code.' }, { status: 429 });
    }

    const result = await verifyOtp(email, code, type);

    if (!result.valid) {
      return NextResponse.json({ error: result.reason }, { status: 401 });
    }

    // For password_reset: just confirm OTP is valid, don't issue a session token
    if (type === 'password_reset') {
      return NextResponse.json({ valid: true, email });
    }

    // For login_otp or email_verify: find user and issue JWT
    // Prefer matching by verified user_id to prevent duplicates/conflicts when multiple users share an email address
    let userResult;
    if (result.userId) {
      userResult = await db.query('SELECT * FROM users WHERE id = $1', [result.userId]);
    } else {
      userResult = await db.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    }

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userResult.rows[0] as any;


    // Mark email as verified when email_verify OTP is used
    if (type === 'email_verify' && !user.email_verified) {
      await db.query('UPDATE users SET email_verified = 1 WHERE id = $1', [user.id]);

      // Send confirmation email
      const companyResult = await db.query('SELECT * FROM companies WHERE id = $1', [user.company_id]);
      const company = companyResult.rows[0] as any;
      const frontendUrl = process.env.FRONTEND_URL || 'https://trackam.com.ng';
      const workspaceUrl = `https://${company?.subdomain}.trackam.com.ng`;

      sendEmail({
        to: user.email,
        subject: '✅ Email Verified — Welcome to Trackam!',
        html: emailVerifiedEmail({
          name: user.name,
          companyName: company?.name || 'your workspace',
          workspaceUrl,
        }),
      }).catch(console.error);
    }

    // Update last login timestamp
    await db.query(
      'UPDATE users SET last_login_at = $1 WHERE id = $2',
      [new Date().toISOString(), user.id]
    );

    const companyResult = await db.query('SELECT * FROM companies WHERE id = $1', [user.company_id]);
    const company = companyResult.rows[0];

    const token = jwt.sign(
      { id: user.id, company_id: user.company_id, role: user.role, email: user.email },
      SECRET,
      { expiresIn: '24h' }
    );

    // Strip sensitive fields before sending back to client
    const safeUser = { ...user };
    delete safeUser.password;
    delete safeUser.failed_logins;
    delete safeUser.locked_until;

    return NextResponse.json({ token, user: safeUser, company });
  } catch (e: any) {
    console.error('verify-otp error:', e);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
