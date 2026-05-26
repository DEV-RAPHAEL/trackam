import { NextResponse } from 'next/server';
import { db, initDb } from '@/lib/db';
import { createOtp } from '@/lib/otp';
import { checkRateLimit, getClientIp, RESET_LIMIT } from '@/lib/rate-limit';
import { sendEmail } from '@/lib/mailer';
import { passwordResetEmail } from '@/lib/email-templates';

/**
 * POST /api/auth/forgot-password
 *
 * Body: { email }
 *
 * Sends a password reset OTP if the email exists.
 * Always returns 200 to avoid user enumeration.
 */
export async function POST(req: Request) {
  try {
    await initDb();
    const ip = getClientIp(req);
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Rate limit per email and per IP
    const emailLimit = checkRateLimit(`reset:email:${email}`, RESET_LIMIT.max, RESET_LIMIT.windowMs);
    const ipLimit = checkRateLimit(`reset:ip:${ip}`, RESET_LIMIT.max * 3, RESET_LIMIT.windowMs);

    if (!emailLimit.allowed || !ipLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many reset attempts. Please wait before trying again.' },
        { status: 429 }
      );
    }

    // Always return 200 regardless — never leak whether email exists
    const genericOk = NextResponse.json({
      success: true,
      message: 'If an account with that email exists, a reset code has been sent.',
    });

    const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return genericOk; // Email not found — silent fail
    }

    const user = userResult.rows[0] as any;

    const { code } = await createOtp(email, 'password_reset', user.id);

    // Wait for email delivery to complete in serverless environments
    await sendEmail({
      to: email,
      subject: '🔑 Reset Your Trackam Password',
      html: passwordResetEmail({ name: user.name, otpCode: code }),
    }).catch(err => console.error('Reset email failed:', err));

    return genericOk;
  } catch (e: any) {
    console.error('forgot-password error:', e);
    // Still return 200 to avoid information leakage
    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, a reset code has been sent.',
    });
  }
}
