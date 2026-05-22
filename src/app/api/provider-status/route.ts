import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function createAuthedClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (n) => cookieStore.get(n)?.value,
        set: () => {},
        remove: () => {},
      },
    },
  );
}

export async function POST(req: NextRequest) {
  const supabase = await createAuthedClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  try {
    const { online } = await req.json();
    if (typeof online !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing or invalid parameter: online (boolean)' },
        { status: 400 },
      );
    }

    const { error } = await supabase.rpc('update_provider_online_status', {
      p_user_id: user.id,
      p_online: online,
    });

    if (error) {
      console.error('[provider-status] update failed', { uid: user.id, error: error.message });
      return NextResponse.json(
        { error: 'Failed to update provider status', details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: 'Provider status updated successfully',
      providerId: user.id,
      online,
    });
  } catch (e: any) {
    console.error('[provider-status] unexpected', e);
    return NextResponse.json(
      { error: 'Internal server error', details: e.message },
      { status: 500 },
    );
  }
}

export async function GET(_req: NextRequest) {
  const supabase = await createAuthedClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  try {
    const { data, error } = await supabase
      .from('ustaz_registrations')
      .select('online_status, provider_status, last_seen_at')
      .eq('userId', user.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch provider status', details: error.message },
        { status: 500 },
      );
    }
    if (!data) {
      return NextResponse.json({ error: 'No provider profile for this account' }, { status: 404 });
    }

    return NextResponse.json({
      online: data.online_status,
      status: data.provider_status,
      lastSeen: data.last_seen_at,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: e.message },
      { status: 500 },
    );
  }
}
