import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { sendPush } from '@/lib/sendPush';

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
    const { requestId, action } = await req.json();
    if (!requestId || !['accept', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Missing or invalid: requestId, action ("accept"|"reject")' },
        { status: 400 },
      );
    }

    const rpc =
      action === 'accept'
        ? 'accept_service_request_authed'
        : 'reject_service_request_authed';

    const { data, error } = await supabase.rpc(rpc, { p_request_id: requestId });
    if (error) {
      console.error(`[handle-service-request] ${rpc} failed`, {
        uid: user.id,
        requestId,
        error: error.message,
      });
      return NextResponse.json(
        { error: `Failed to ${action} request`, details: error.message },
        { status: 500 },
      );
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row || row.success === false) {
      return NextResponse.json(
        { error: row?.message ?? `Failed to ${action} request` },
        { status: 400 },
      );
    }

    // On accept, push a confirmation to the customer (closed-tab friendly).
    if (action === 'accept' && row.updated_request) {
      const updated = typeof row.updated_request === 'string'
        ? JSON.parse(row.updated_request)
        : row.updated_request;
      const customerId = updated?.user_id;
      if (customerId) {
        // Look up provider name for a friendlier body
        const { data: prov } = await supabase
          .from('ustaz_registrations')
          .select('"firstName","lastName","service_type"')
          .eq('userId', user.id)
          .maybeSingle();
        const providerName = prov
          ? `${prov.firstName ?? ''} ${prov.lastName ?? ''}`.trim() || 'Your Ustaz'
          : 'Your Ustaz';
        const serviceType = prov?.service_type ?? updated?.service_type ?? 'service';
        sendPush(
          [customerId],
          `${providerName} accepted your request`,
          `Your ${serviceType} provider is on the way`,
          { url: '/process', requestId: String(updated.id ?? requestId) },
        ).catch((err) => console.error('[sendPush] handle-service-request push failed:', err));
      }
    }

    return NextResponse.json({
      message: row.message,
      ...(action === 'accept' ? { request: row.updated_request } : {}),
    });
  } catch (e: any) {
    console.error('[handle-service-request] unexpected', e);
    return NextResponse.json(
      { error: 'Internal server error', details: e.message },
      { status: 500 },
    );
  }
}

// GET — provider's own pending notifications (auth.uid() only).
export async function GET(_req: NextRequest) {
  const supabase = await createAuthedClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  try {
    const { data: notifications, error: nErr } = await supabase
      .from('notifications')
      .select(`
        id,
        request_id,
        message,
        service_type,
        status,
        created_at,
        service_requests (
          user_id,
          service_type,
          request_latitude,
          request_longitude,
          request_details,
          status,
          created_at
        )
      `)
      .eq('recipient_user_id', user.id)
      .in('status', ['pending'])
      .order('created_at', { ascending: false });

    if (nErr) {
      return NextResponse.json(
        { error: 'Failed to fetch notifications', details: nErr.message },
        { status: 500 },
      );
    }

    const pendingRequests = (notifications ?? [])
      .filter((n: any) =>
        ['pending_notification', 'notified_multiple'].includes(n.service_requests?.status),
      )
      .map((n: any) => ({
        notificationId: n.id,
        requestId: n.request_id,
        message: n.message,
        serviceType: n.service_type,
        status: n.status,
        createdAt: n.created_at,
        requestDetails: n.service_requests,
      }));

    return NextResponse.json({ requests: pendingRequests });
  } catch (e: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: e.message },
      { status: 500 },
    );
  }
}
