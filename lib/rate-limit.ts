/**
 * lib/rate-limit.ts
 *
 * In-memory sliding window rate limiter.
 * Uses globalThis to survive Next.js HMR reloads in development.
 *
 * No external dependencies (no Redis required).
 * For a multi-instance production deployment, swap the Map store for Redis.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g = globalThis as any;

if (!g.__trackamRateStore) {
  // Map<key, timestamps[]>
  g.__trackamRateStore = new Map<string, number[]>();
}

const store: Map<string, number[]> = g.__trackamRateStore;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

/**
 * Sliding window rate limiter.
 *
 * @param key        Unique key, e.g. `login:user@example.com` or `login:ip:1.2.3.4`
 * @param maxRequests Maximum requests allowed within the window
 * @param windowMs   Window size in milliseconds
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;

  // Get existing timestamps for this key, prune stale ones
  const timestamps = (store.get(key) ?? []).filter((t) => t > windowStart);

  if (timestamps.length >= maxRequests) {
    // The oldest timestamp determines when the earliest slot opens up
    const oldest = timestamps[0];
    const retryAfterMs = oldest + windowMs - now;
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(0, retryAfterMs),
    };
  }

  // Record this request
  timestamps.push(now);
  store.set(key, timestamps);

  return {
    allowed: true,
    remaining: maxRequests - timestamps.length,
    retryAfterMs: 0,
  };
}

/**
 * Clear the rate limit record for a key (e.g., after successful login).
 */
export function clearRateLimit(key: string): void {
  store.delete(key);
}

/**
 * Convenience: Get client IP from a Next.js Request object.
 * Respects X-Forwarded-For from reverse proxies.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return 'unknown';
}

// ─── Preset Configs ──────────────────────────────────────────────────────────

/** 5 login attempts per 15 minutes per identifier */
export const LOGIN_LIMIT = { max: 5, windowMs: 15 * 60 * 1000 };

/** 3 OTP sends per 10 minutes per email */
export const OTP_RESEND_LIMIT = { max: 3, windowMs: 10 * 60 * 1000 };

/** 3 registrations per hour per IP */
export const REGISTER_LIMIT = { max: 3, windowMs: 60 * 60 * 1000 };

/** 3 password reset requests per hour per email */
export const RESET_LIMIT = { max: 3, windowMs: 60 * 60 * 1000 };
