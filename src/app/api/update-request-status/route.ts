import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const PROVIDER_ACTIONS = ['arriving', 'in_progress', 'completed'] as const;
const ALL_ACTIONS = [...PROVIDER_ACTIONS, 'cancelled'] as const;
type Action = (typeof ALL_ACTIONS)[number];

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
    const { requestId, action } = (await req.json()) as { requestId?: string; action?: Action };
    if (!requestId || !action || !ALL_ACTIONS.includes(action)) {
      return NextResponse.json(
        { error: `Missing or invalid: requestId, action (${ALL_ACTIONS.join('|')})` },
        { status: 400 },
      );
    }

    const { data: sr, error: srErr } = await supabase
      .from('service_requests')
      .select('id, user_id, accepted_by_provider_id, status')
      .eq('id', requestId)
      .maybeSingle();

    if (srErr || !sr) {
      return NextResponse.json({ error: 'Service request not found' }, { status: 404 });
    }

    const isOwner = sr.user_id === user.id;
    const isProvider = sr.accepted_by_provider_id === user.id;

    const authorized =
      action === 'cancelled' ? isOwner || isProvider : isProvider;

    if (!authorized) {
      return NextResponse.json(
        { error: 'Forbidden: session user not authorized for this action' },
        { status: 403 },
      );
    }

    let resp;
    switch (action) {
      case 'arriving':
        resp = await supabase.rpc('update_request_to_arriving', {
          p_request_id: requestId,
          p_provider_id: user.id,
        });
        break;
      case 'in_progress':
        resp = await supabase.rpc('update_request_to_in_progress', {
          p_request_id: requestId,
          p_provider_id: user.id,
        });
        break;
      case 'completed':
        resp = await supabase.rpc('update_request_to_completed', {
          p_request_id: requestId,
          p_provider_id: user.id,
        });
        break;
      case 'cancelled':
        resp = await supabase.rpc('cancel_service_request', {
          p_request_id: requestId,
          p_user_id: isOwner ? user.id : null,
          p_provider_id: isProvider ? user.id : null,
        });
        break;
    }

    const { data: resultData, error: resultError } = resp!;
    if (resultError) {
      console.error(`[update-request-status] ${action} failed`, {
        uid: user.id,
        requestId,
        error: resultError.message,
      });
      return NextResponse.json(
        { error: `Failed to update request status to ${action}`, details: resultError.message },
        { status: 500 },
      );
    }

    const row = Array.isArray(resultData) ? resultData[0] : resultData;
    if (!row || row.success === false) {
      return NextResponse.json(
        { error: row?.message ?? `Failed to update request status to ${action}` },
        { status: 400 },
      );
    }

    return NextResponse.json({ message: row.message, request: row.updated_request });
  } catch (e: any) {
    console.error('[update-request-status] unexpected', e);
    return NextResponse.json(
      { error: 'Internal server error', details: e.message },
      { status: 500 },
    );
  }
}
