import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAuthedClient } from '@/lib/server';

// GET /api/email/verify/confirm?token=...
// Validates the token (hash match + not expired + single-use) via the
// consume_email_verification RPC, then redirects to a human-friendly page.
export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get('token');
  const base = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;

  const redirectTo = (ok: boolean, reason?: string) => {
    const url = new URL('/email-verified', base);
    url.searchParams.set('status', ok ? 'success' : 'error');
    if (reason) url.searchParams.set('reason', reason);
    return NextResponse.redirect(url);
  };

  if (!token) return redirectTo(false, 'missing-token');

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  // Anonymous client is fine — the RPC is SECURITY DEFINER and validates the
  // token itself (the link is the bearer credential).
  const supabase = await createAuthedClient();
  const { data, error } = await supabase.rpc('consume_email_verification', {
    p_token_hash: tokenHash,
  });
  const result = (Array.isArray(data) ? data[0] : data) as { success?: boolean; error?: string } | null;

  if (error || !result?.success) {
    return redirectTo(false, (result?.error || 'invalid').toLowerCase().replace(/\s+/g, '-'));
  }
  return redirectTo(true);
}
