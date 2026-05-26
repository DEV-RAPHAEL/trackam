import { NextResponse } from 'next/server';
import { db, initDb } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { checkRateLimit, clearRateLimit, getClientIp, LOGIN_LIMIT } from '@/lib/rate-limit';
import { createOtp, cleanupExpiredOtps } from '@/lib/otp';
import { sendEmail } from '@/lib/mailer';
import { loginOtpEmail } from '@/lib/email-templates';

export async function POST(req: Request) {
  try {
    await initDb();
    const ip = getClientIp(req);
    const { email, password, subdomain } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // ── Rate limiting (per email + per IP) ─────────────────────────────────
    const emailLimit = checkRateLimit(`login:email:${email}`, LOGIN_LIMIT.max, LOGIN_LIMIT.windowMs);
    const ipLimit = checkRateLimit(`login:ip:${ip}`, LOGIN_LIMIT.max * 2, LOGIN_LIMIT.windowMs);

    if (!emailLimit.allowed) {
      const waitMin = Math.ceil(emailLimit.retryAfterMs / 60000);
      return NextResponse.json(
        { error: `Too many login attempts. Please wait ${waitMin} minute(s) before trying again.` },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(emailLimit.retryAfterMs / 1000)) } }
      );
    }

    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts from this network. Please wait before trying again.' },
        { status: 429 }
      );
    }

    // Clean up expired OTPs occasionally (background housekeeping)
    cleanupExpiredOtps().catch(() => {});

    // ── Superadmin bypass ──────────────────────────────────────────────────
    const superAdminCheck = await db.query(
      `SELECT * FROM users WHERE email = $1 AND role = 'superadmin'`,
      [email]
    );
    if (superAdminCheck.rows.length > 0) {
      const saUser = superAdminCheck.rows[0] as any;
      const valid = await bcrypt.compare(password, saUser.password || '');
      if (!valid) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }

      // Superadmin also gets OTP — wait for sending to complete in serverless environments
      const { code } = await createOtp(saUser.email, 'login_otp', saUser.id);
      await sendEmail({
        to: saUser.email,
        subject: '🔐 Trackam Admin Login Code',
        html: loginOtpEmail({ name: saUser.name, otpCode: code, ipAddress: ip }),
      }).catch(err => console.error('OTP email failed:', err));

      clearRateLimit(`login:email:${email}`);
      return NextResponse.json({
        requiresOtp: true,
        email: saUser.email,
        message: 'A verification code has been sent to your email address.',
      });
    }

    // ── Regular tenant login ───────────────────────────────────────────────
    let user: any = null;
    let comp: any = null;

    if (subdomain) {
      const r = await db.query(
        `SELECT u.* FROM users u 
         JOIN companies c ON u.company_id = c.id 
         WHERE u.email = $1 AND c.subdomain = $2`,
        [email, subdomain]
      );
      if (r.rows.length > 0) {
        user = r.rows[0];
        const cr = await db.query('SELECT * FROM companies WHERE id = $1', [(user as any).company_id]);
        comp = cr.rows[0];
      }
    } else {
      const r = await db.query('SELECT * FROM users WHERE email = $1', [email]);
      if (r.rows.length > 0) {
        user = r.rows[0];
        const cr = await db.query('SELECT * FROM companies WHERE id = $1', [(user as any).company_id]);
        comp = cr.rows[0];
      }
    }

    if (!user || !comp) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (!user.password) {
      return NextResponse.json({
        error: 'Account not set up. Please use your invite link to set a password.',
      }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Tenant isolation check
    if (subdomain && comp?.subdomain !== subdomain) {
      return NextResponse.json({ error: 'Invalid credentials for this workspace.' }, { status: 401 });
    }

    // ── Send OTP — wait for sending to complete in serverless environments ────────────
    const { code } = await createOtp(user.email, 'login_otp', user.id);
    await sendEmail({
      to: user.email,
      subject: '🔐 Your Trackam Login Code',
      html: loginOtpEmail({ name: user.name, otpCode: code, ipAddress: ip }),
    }).catch(err => console.error('OTP email failed:', err));

    // Clear login rate limit on valid password (OTP failure will be its own check)
    clearRateLimit(`login:email:${email}`);

    return NextResponse.json({
      requiresOtp: true,
      email: user.email,
      message: 'A verification code has been sent to your email address.',
    });
  } catch (e: any) {
    console.error('Login error:', e);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
