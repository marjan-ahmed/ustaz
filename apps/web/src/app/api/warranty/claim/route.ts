import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient } from '@/lib/server';
import { sendPush } from '@/lib/sendPush';

// POST { requestId, description }
// Customer files a warranty claim within 3 days of job completion.
export async function POST(req: NextRequest) {
  const supabase = await createAuthedClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  let body: { requestId?: string; description?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { requestId, description } = body;
  if (!requestId) {
    return NextResponse.json({ error: 'requestId is required' }, { status: 400 });
  }

  // Verify the request is completed, owned by this customer, and within 3 days
  const { data: sr, error: srErr } = await supabase
    .from('service_requests')
    .select('id, status, user_id, accepted_by_provider_id, updated_at')
    .eq('id', requestId)
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .single();

  if (srErr || !sr) {
    return NextResponse.json({ error: 'Completed service request not found.' }, { status: 404 });
  }

  const completedAt = new Date(sr.updated_at).getTime();
  const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
  if (Date.now() - completedAt > threeDaysMs) {
    return NextResponse.json({ error: 'Warranty period has expired (3 days after completion).' }, { status: 410 });
  }

  if (!sr.accepted_by_provider_id) {
    return NextResponse.json({ error: 'No provider assigned to this request.' }, { status: 400 });
  }

  // Insert claim — RLS also validates on DB side
  const { data: claim, error: claimErr } = await supabase
    .from('warranty_claims')
    .insert({
      request_id:  requestId,
      customer_id: user.id,
      provider_id: sr.accepted_by_provider_id,
      description: description?.trim() || null,
    })
    .select()
    .single();

  if (claimErr) {
    if (claimErr.code === '23505') {
      return NextResponse.json({ error: 'A warranty claim already exists for this job.' }, { status: 409 });
    }
    console.error('[warranty/claim]', claimErr);
    return NextResponse.json({ error: 'Failed to create warranty claim.' }, { status: 500 });
  }

  // Push notification to provider
  sendPush(
    [sr.accepted_by_provider_id],
    '⚠️ Warranty Claim Filed',
    'A customer has filed a warranty claim. Please return to fix the issue within the 3-day window.',
    { url: '/dashboard', claimId: claim.id, type: 'warranty_claim' },
  ).catch(() => {});

  return NextResponse.json({ ok: true, claimId: claim.id });
}
