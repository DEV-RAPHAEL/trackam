/**
 * lib/otp.ts
 *
 * OTP (One-Time Password) generation and verification utilities.
 * Uses Node.js crypto for cryptographically secure random number generation.
 *
 * OTP types:
 *  - 'login_otp'       — 2FA code sent after successful password check
 *  - 'email_verify'    — Verify email address on registration
 *  - 'password_reset'  — Password reset confirmation code
 */

import crypto from 'crypto';
import { db } from './db';

export type OtpType = 'login_otp' | 'email_verify' | 'password_reset';

const OTP_EXPIRY_MINUTES = 10;

/**
 * Generate a cryptographically random N-digit numeric OTP string.
 */
export function generateOtpCode(length = 6): string {
  const max = Math.pow(10, length);
  // Use crypto.randomInt for unbiased uniform distribution
  const num = crypto.randomInt(0, max);
  return String(num).padStart(length, '0');
}

/**
 * Persist an OTP to the database.
 * Invalidates any previous unused OTPs of the same type for the same email.
 */
export async function createOtp(
  email: string,
  type: OtpType,
  userId?: string,
): Promise<{ id: string; code: string }> {
  // Invalidate previous OTPs of this type for this email
  await db.query(
    `UPDATE otps SET used = 1 WHERE email = $1 AND type = $2 AND used = 0`,
    [email, type],
  );

  const code = generateOtpCode(6);
  const id = `otp-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();
  const createdAt = new Date().toISOString();

  await db.query(
    `INSERT INTO otps (id, user_id, email, code, type, expires_at, used, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, 0, $7)`,
    [id, userId ?? null, email, code, type, expiresAt, createdAt],
  );

  return { id, code };
}

/**
 * Verify an OTP code.
 * Returns { valid: true, userId } on success, or { valid: false, reason } on failure.
 * On success, marks the OTP as used so it cannot be reused.
 */
export async function verifyOtp(
  email: string,
  code: string,
  type: OtpType,
): Promise<{ valid: true; userId: string | null } | { valid: false; reason: string }> {
  const result = await db.query(
    `SELECT * FROM otps
     WHERE email = $1 AND code = $2 AND type = $3 AND used = 0
     ORDER BY created_at DESC
     LIMIT 1`,
    [email, code, type],
  );

  if (result.rows.length === 0) {
    return { valid: false, reason: 'Invalid or already used code' };
  }

  const otp = result.rows[0] as {
    id: string;
    user_id: string | null;
    expires_at: string;
    used: number;
  };

  if (new Date(otp.expires_at) < new Date()) {
    return { valid: false, reason: 'Code has expired. Please request a new one.' };
  }

  // Mark as used
  await db.query(`UPDATE otps SET used = 1 WHERE id = $1`, [otp.id]);

  return { valid: true, userId: otp.user_id };
}

/**
 * Clean up expired / used OTPs older than 1 hour.
 * Call this periodically (e.g., on each auth request) to keep the table small.
 */
export async function cleanupExpiredOtps(): Promise<void> {
  const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  await db.query(
    `DELETE FROM otps WHERE expires_at < $1 OR (used = 1 AND created_at < $2)`,
    [cutoff, cutoff],
  );
}
