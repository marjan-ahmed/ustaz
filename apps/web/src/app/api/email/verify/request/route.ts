import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAuthedClient } from '@/lib/server';
import { sendVerificationEmail } from '@/lib/email';

// POST { email }  — request a verification link for the caller's profile email.
// Identity is derived from the cookie session; the token is single-use and
// expires in 30 minutes. Only the SHA-256 hash of the token is stored.
export async function POST(req: NextRequest) {
  const supabase = await createAuthedClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  const { email } = await req.json().catch(() => ({}));
  if (typeof email !== 'string' || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
  }
  const normalized = email.trim().toLowerCase();

  // Generate a high-entropy raw token; store only its hash.
  const rawToken = crypto.randomBytes(32).toString('base64url');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const { data, error } = await supabase.rpc('create_email_verification', {
    p_email: normalized,
    p_token_hash: tokenHash,
    p_ttl_minutes: 30,
  });
  const result = (Array.isArray(data) ? data[0] : data) as { success?: boolean; error?: string } | null;
  if (error || !result?.success) {
    const msg = result?.error || 'Could not create verification request';
    const status = msg.includes('Too many') ? 429 : 400;
    return NextResponse.json({ error: msg }, { status });
  }

  const base = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
  const verifyUrl = `${base}/api/email/verify/confirm?token=${rawToken}`;

  const send = await sendVerificationEmail(normalized, verifyUrl);

  return NextResponse.json({
    ok: true,
    sent: send.sent,
    // devLink only present in non-production when no provider is configured.
    ...(send.devLink ? { devLink: send.devLink } : {}),
  });
}
