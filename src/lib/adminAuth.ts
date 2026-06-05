// Hardened admin session helpers (Node.js runtime — API routes only).
// The admin portal is env-credential based and fully separate from the
// Supabase (customer/provider) auth context.
//
// Security properties:
//  - Fails CLOSED if INTERNAL_API_SECRET is unset (no hardcoded fallback).
//  - Session cookie is HMAC-SHA256 signed; signature is verified with a
//    timing-safe comparison before the payload is trusted.
//  - Admin credential check uses constant-time comparison (hash-then-compare
//    so unequal lengths don't leak via timing or throw).
import crypto from 'crypto';

const ADMIN_SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours (was 24)

/** Returns the signing secret or throws — never falls back to a known value. */
function adminSecret(): string {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('INTERNAL_API_SECRET is not configured (admin auth disabled)');
  }
  return secret;
}

/** Constant-time string compare that does not leak length via early return. */
function timingSafeStrEqual(a: string, b: string): boolean {
  // Hash both sides to a fixed 32-byte digest so timingSafeEqual never throws
  // on length mismatch and the raw lengths aren't compared directly.
  const ha = crypto.createHash('sha256').update(a, 'utf8').digest();
  const hb = crypto.createHash('sha256').update(b, 'utf8').digest();
  return crypto.timingSafeEqual(ha, hb);
}

export interface AdminTokenPayload {
  email: string;
  exp: number;
}

/** Create a signed admin session token: `base64url(payload).hexHmac`. */
export function signAdminToken(email: string): { token: string; ttlSeconds: number } {
  const payloadObj: AdminTokenPayload = { email, exp: Date.now() + ADMIN_SESSION_TTL_MS };
  const payload = Buffer.from(JSON.stringify(payloadObj)).toString('base64url');
  const sig = crypto.createHmac('sha256', adminSecret()).update(payload).digest('hex');
  return { token: `${payload}.${sig}`, ttlSeconds: Math.floor(ADMIN_SESSION_TTL_MS / 1000) };
}

/**
 * Verify an admin session cookie end-to-end: signature, expiry, and that the
 * embedded email still matches the configured admin. Returns the payload on
 * success, or null on any failure. Used by Node.js API routes.
 */
export function verifyAdminToken(cookieValue: string | undefined): AdminTokenPayload | null {
  if (!cookieValue) return null;
  let secret: string;
  try {
    secret = adminSecret();
  } catch {
    return null; // fail closed if secret missing
  }

  const lastDot = cookieValue.lastIndexOf('.');
  if (lastDot === -1) return null;

  const payload = cookieValue.slice(0, lastDot);
  const sig = cookieValue.slice(lastDot + 1);

  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  // Constant-time signature comparison.
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as AdminTokenPayload;
    if (!parsed.exp || parsed.exp < Date.now()) return null;
    if (!parsed.email || parsed.email !== process.env.ADMIN_EMAIL) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Constant-time validation of submitted admin credentials against env config. */
export function checkAdminCredentials(email: unknown, password: unknown): boolean {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) return false;
  if (typeof email !== 'string' || typeof password !== 'string') return false;
  // Evaluate BOTH comparisons (no short-circuit) so timing doesn't reveal
  // which field was wrong.
  const emailOk = timingSafeStrEqual(email, adminEmail);
  const passOk = timingSafeStrEqual(password, adminPassword);
  return emailOk && passOk;
}
