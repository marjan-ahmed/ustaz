import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient } from '@/lib/server';
import { sendPush } from '@/lib/sendPush';

const CANCELLATION_REASONS: Record<string, string> = {
  'found-better': 'Found a better option',
  'changed-mind': 'Changed my mind',
  'wrong-address': 'Wrong address / location',
  'too-expensive': 'Too expensive',
  'no-response': 'Provider too slow to respond',
  'duplicate': 'Duplicate request',
  'other': 'Other reason',
};

export async function POST(req: NextRequest) {
  const supabase = await createAuthedClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  try {
    const { requestId, reason } = (await req.json()) as {
      requestId?: string;
      reason?: string;
    };

    if (!requestId) {
      return NextResponse.json({ error: 'Missing requestId' }, { status: 400 });
    }

    // Fetch the request
    const { data: sr, error: srErr } = await supabase
      .from('service_requests')
      .select('id, user_id, accepted_by_provider_id, status, service_type')
      .eq('id', requestId)
      .maybeSingle();

    if (srErr || !sr) {
      return NextResponse.json({ error: 'Service request not found' }, { status: 404 });
    }

    const isOwner = sr.user_id === user.id;
    const isProvider = sr.accepted_by_provider_id === user.id;

    if (!isOwner && !isProvider) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Store cancellation reason if provided
    if (reason && reason !== 'skip') {
      await supabase
        .from('service_requests')
        .update({ cancellation_reason: reason })
        .eq('id', requestId);
    }

    // Call the cancel RPC
    const { data: rpcData, error: rpcErr } = await supabase.rpc('cancel_service_request', {
      p_request_id: requestId,
      p_user_id: isOwner ? user.id : null,
      p_provider_id: isProvider ? user.id : null,
    });

    if (rpcErr) {
      console.error('[cancel-request] RPC failed', rpcErr);
      return NextResponse.json({ error: 'Failed to cancel request' }, { status: 500 });
    }

    const row = Array.isArray(rpcData) ? rpcData[0] : rpcData;
    if (!row || row.success === false) {
      return NextResponse.json({ error: row?.message ?? 'Cancel failed' }, { status: 400 });
    }

    // Get the caller's display name
    let cancellerName = 'Someone';
    if (isOwner) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, name')
        .eq('id', user.id)
        .maybeSingle();
      cancellerName = profile?.full_name || profile?.name || 'A customer';
    } else {
      const { data: reg } = await supabase
        .from('ustaz_registrations')
        .select('first_name, last_name')
        .eq('user_id', user.id)
        .maybeSingle();
      cancellerName = reg
        ? `${reg.first_name} ${reg.last_name}`.trim()
        : 'Your provider';
    }

    // Determine who to notify (the other party)
    const notifyUserId = isOwner ? sr.accepted_by_provider_id : sr.user_id;
    if (notifyUserId) {
      const reasonLabel = reason && reason !== 'skip'
        ? CANCELLATION_REASONS[reason] || reason
        : '';

      const pushBody = reasonLabel
        ? `${cancellerName} cancelled your ${sr.service_type} request. Reason: ${reasonLabel}`
        : `${cancellerName} cancelled your ${sr.service_type} request.`;

      // Fire-and-forget push notification
      sendPush([notifyUserId], 'Request Cancelled', pushBody, {
        type: 'cancellation',
        requestId,
      }).catch(() => {});
    }

    return NextResponse.json({ message: row.message, request: row.updated_request });
  } catch (e: any) {
    console.error('[cancel-request] unexpected', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
