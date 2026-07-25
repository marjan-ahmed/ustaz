import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient } from '@/lib/server';

// Runs the CNIC OCR cross-check for the signed-in provider BEFORE the
// registration row is created. userId is always derived from the session
// (never the body); the CNIC number + photo URLs are the values being verified.
// The verify-cnic Edge Function records the verdict in cnic_verifications, which
// the ustaz_registrations insert trigger then applies.
export async function POST(req: NextRequest) {
  const supabase = await createAuthedClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  let body: {
    cnicNumber?: string; cnicFrontUrl?: string; cnicBackUrl?: string;
    firstName?: string; lastName?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const cnicNumber = (body.cnicNumber ?? '').replace(/\D/g, '');
  if (cnicNumber.length !== 13) {
    return NextResponse.json({ error: 'cnicNumber must be 13 digits' }, { status: 400 });
  }
  if (!body.cnicFrontUrl) {
    return NextResponse.json({ error: 'CNIC front photo missing' }, { status: 400 });
  }

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const secret = process.env.INTERNAL_API_SECRET;
  if (!base || !anon || !secret) {
    console.error('[verify-cnic] missing env (SUPABASE_URL / ANON_KEY / INTERNAL_API_SECRET)');
    return NextResponse.json({ error: 'Verification unavailable' }, { status: 500 });
  }

  try {
    const res = await fetch(`${base}/functions/v1/verify-cnic`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anon,
        Authorization: `Bearer ${anon}`,
        'x-internal-secret': secret,
      },
      body: JSON.stringify({
        userId: user.id,
        firstName: body.firstName ?? '',
        lastName: body.lastName ?? '',
        cnicNumber,
        cnicFrontUrl: body.cnicFrontUrl,
        cnicBackUrl: body.cnicBackUrl,
      }),
    });

    const result = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error('[verify-cnic] edge function non-200', res.status, result);
      return NextResponse.json({ error: 'Verification failed', details: result?.error }, { status: 502 });
    }
    return NextResponse.json(result);
  } catch (e: any) {
    console.error('[verify-cnic] unexpected', e);
    return NextResponse.json({ error: 'Internal server error', details: e.message }, { status: 500 });
  }
}
