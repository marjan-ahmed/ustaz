import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient } from '@/lib/server';
import { sendPush } from '@/lib/sendPush';

// POST { claimId, response: 'accepted' | 'refused' }
// Provider accepts (agrees to return) or refuses (penalty applied by RPC).
export async function POST(req: NextRequest) {
  const supabase = await createAuthedClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  let body: { claimId?: string; response?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { claimId, response } = body;
  if (!claimId || !response) {
    return NextResponse.json({ error: 'claimId and response are required' }, { status: 400 });
  }
  if (!['accepted', 'refused'].includes(response)) {
    return NextResponse.json({ error: 'response must be accepted or refused' }, { status: 400 });
  }

  // RPC handles the penalty logic and wallet deduction
  const { data, error: rpcErr } = await supabase.rpc('respond_to_warranty', {
    p_claim_id: claimId,
    p_response: response,
  });

  if (rpcErr) {
    console.error('[warranty/respond]', rpcErr);
    return NextResponse.json({ error: 'Failed to process response.' }, { status: 500 });
  }

  const result = data as { success: boolean; error?: string; status?: string };
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  // Notify customer of the provider's response
  const { data: claim } = await supabase
    .from('warranty_claims')
    .select('customer_id, request_id')
    .eq('id', claimId)
    .single();

  if (claim) {
    const msg = response === 'accepted'
      ? 'Your provider accepted the warranty claim and will return to fix the issue.'
      : 'Your provider refused the warranty claim. USTAZ has penalized their account.';
    sendPush(
      [claim.customer_id],
      response === 'accepted' ? '✅ Warranty Accepted' : '❌ Warranty Refused',
      msg,
      { url: '/process', requestId: claim.request_id, type: 'warranty_response' },
    ).catch(() => {});
  }

  return NextResponse.json({ ok: true, status: response });
}
