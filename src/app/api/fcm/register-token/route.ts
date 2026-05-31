import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient } from '@/lib/server';

export async function POST(req: NextRequest) {
  const supabase = await createAuthedClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  try {
    const { token } = await req.json();
    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'token required' }, { status: 400 });
    }

    // SECURITY DEFINER RPC handles device-reuse (re-assigns token to current user)
    // without tripping RLS on a token previously owned by another account.
    const { error } = await supabase.rpc('upsert_fcm_token', {
      p_token: token,
      p_user_agent: req.headers.get('user-agent') ?? null,
    });

    if (error) {
      console.error('[fcm/register-token] upsert failed', error.message);
      return NextResponse.json({ error: 'Failed to register token' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: 'Internal server error', details: e.message }, { status: 500 });
  }
}