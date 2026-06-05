import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient } from '@/lib/server';
import { signAdminToken, checkAdminCredentials } from '@/lib/adminAuth';

export async function POST(req: NextRequest) {
  try {
    // Require admin config up front — fail closed.
    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Admin login is not configured' }, { status: 500 });
    }
    if (!process.env.INTERNAL_API_SECRET) {
      // No signing secret → cannot mint a trustworthy session. Refuse.
      return NextResponse.json({ error: 'Admin auth is not configured' }, { status: 500 });
    }

    // ── Rate limit by client IP (5 attempts / 15 min) ──
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      'unknown';
    try {
      const supabase = await createAuthedClient();
      const { data: allowed, error } = await supabase.rpc('check_admin_login_rate', { p_ip: ip });
      if (error) {
        console.error('[admin/login] rate-limit check failed', error.message);
        return NextResponse.json({ error: 'Login temporarily unavailable' }, { status: 503 });
      }
      if (allowed === false) {
        return NextResponse.json(
          { error: 'Too many login attempts. Try again in 15 minutes.' },
          { status: 429 },
        );
      }
    } catch (e: any) {
      console.error('[admin/login] rate-limit error', e?.message);
      return NextResponse.json({ error: 'Login temporarily unavailable' }, { status: 503 });
    }

    const { email, password } = await req.json().catch(() => ({}));

    // Constant-time credential check (no field-specific timing leak).
    if (!checkAdminCredentials(email, password)) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const { token, ttlSeconds } = signAdminToken(process.env.ADMIN_EMAIL);

    const response = NextResponse.json({ success: true });
    response.cookies.set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', // admin portal is first-party only
      path: '/',
      maxAge: ttlSeconds,
    });
    return response;
  } catch (e: any) {
    console.error('[admin/login] unexpected', e?.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set('admin_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
  return response;
}
