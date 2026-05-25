import { NextResponse } from 'next/server';
import { db, initDb } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { verifyOtp } from '@/lib/otp';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

const MIN_PASSWORD_LENGTH = 8;

/**
 * POST /api/auth/reset-password
 *
 * Body: { email, code, newPassword }
 *
 * Verifies the password_reset OTP and updates the user's password.
 * The OTP must have been validated via /api/auth/verify-otp first —
 * this endpoint re-verifies to ensure no bypass.
 */
export async function POST(req: Request) {
  try {
    await initDb();
    const ip = getClientIp(req);
    const { email, code, newPassword } = await req.json();

    if (!email || !code || !newPassword) {
      return NextResponse.json({ error: 'email, code, and newPassword are required' }, { status: 400 });
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.` },
        { status: 400 }
      );
    }

    // Rate limit to prevent brute force on the final reset step
    const limit = checkRateLimit(`reset-confirm:${email}:${ip}`, 5, 15 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json({ error: 'Too many attempts. Please request a new code.' }, { status: 429 });
    }

    // Re-verify OTP (this invalidates the code so it can't be reused)
    const result = await verifyOtp(email, code, 'password_reset');
    if (!result.valid) {
      return NextResponse.json({ error: result.reason }, { status: 401 });
    }

    // Find user
    const userResult = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userResult.rows[0] as any;
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password and clear any account lockout
    await db.query(
      'UPDATE users SET password = $1, failed_logins = 0, locked_until = NULL WHERE id = $2',
      [hashedPassword, user.id]
    );

    return NextResponse.json({ success: true, message: 'Password updated successfully. You can now log in.' });
  } catch (e: any) {
    console.error('reset-password error:', e);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
