import { NextResponse } from 'next/server';
import { db, initDb } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { checkRateLimit, getClientIp, REGISTER_LIMIT } from '@/lib/rate-limit';
import { createOtp } from '@/lib/otp';
import { sendEmail } from '@/lib/mailer';
import { welcomeEmail } from '@/lib/email-templates';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('FATAL: JWT_SECRET environment variable is not set!');
}

const SECRET = JWT_SECRET || 'dev-only-secret-change-in-production';

export async function POST(req: Request) {
  try {
    await initDb();
    const ip = getClientIp(req);

    // Rate limit registrations per IP
    const limit = checkRateLimit(`register:ip:${ip}`, REGISTER_LIMIT.max, REGISTER_LIMIT.windowMs);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'Too many registration attempts from this network. Please wait and try again.' },
        { status: 429 }
      );
    }

    const { company_id, user_id, company_name, user_name, email, password, role } = await req.json();

    if (!company_name || !user_name || !email || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long.' }, { status: 400 });
    }

    // ── Uniqueness Checks ─────────────────────────────────────────────────
    const emailCheck = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) {
      return NextResponse.json({ error: 'This email is already in use.' }, { status: 400 });
    }

    const usernameCheck = await db.query('SELECT id FROM users WHERE name = $1', [user_name]);
    if (usernameCheck.rows.length > 0) {
      return NextResponse.json({ error: 'This username is already taken.' }, { status: 400 });
    }

    const companyCheck = await db.query('SELECT id FROM companies WHERE name = $1', [company_name]);
    if (companyCheck.rows.length > 0) {
      return NextResponse.json({ error: 'A company with this name already exists.' }, { status: 400 });
    }

    const subdomain = company_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const subdomainCheck = await db.query('SELECT id FROM companies WHERE subdomain = $1', [subdomain]);
    if (subdomainCheck.rows.length > 0) {
      return NextResponse.json({ error: 'This workspace subdomain is already taken.' }, { status: 400 });
    }

    // ── Create Company & User ────────────────────────────────────────────
    const hashedPassword = await bcrypt.hash(password, 12);
    const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await db.query(
      'INSERT INTO companies (id, name, status, onboarding_step, trial_ends_at, subscription_status, subdomain) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [company_id, company_name, 'inactive', 'payment', trialEndsAt, 'trialing', subdomain]
    );

    await db.query(
      'INSERT INTO users (id, company_id, name, email, password, role, email_verified, otp_enabled) VALUES ($1, $2, $3, $4, $5, $6, 0, 1)',
      [user_id, company_id, user_name, email, hashedPassword, role]
    );

    // ── Issue JWT (still needed for onboarding flow before OTP verify) ───
    const token = jwt.sign({ id: user_id, company_id, role, email }, SECRET, { expiresIn: '24h' });

    // ── Send Welcome + Email Verification OTP (async, don't block response) ─
    const frontendUrl = process.env.FRONTEND_URL || 'https://trackam.com.ng';
    const workspaceUrl = `https://${subdomain}.trackam.com.ng`;

    createOtp(email, 'email_verify', user_id)
      .then(({ code }) =>
        sendEmail({
          to: email,
          subject: '🎉 Welcome to Trackam — Verify Your Email',
          html: welcomeEmail({
            name: user_name,
            companyName: company_name,
            workspaceUrl,
            otpCode: code,
          }),
        })
      )
      .catch((err) => console.error('Welcome email failed:', err));

    return NextResponse.json({ success: true, token });
  } catch (e: any) {
    console.error('register error:', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
