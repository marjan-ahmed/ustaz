import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient } from '@/lib/server';

export async function POST(req: NextRequest) {
  const supabase = await createAuthedClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  try {
    const { amount_sent, transaction_id, receipt_url } = await req.json();

    if (!amount_sent || typeof amount_sent !== 'number' || amount_sent <= 0) {
      return NextResponse.json({ error: 'Missing or invalid: amount_sent (positive number)' }, { status: 400 });
    }
    if (!transaction_id || typeof transaction_id !== 'string' || !transaction_id.trim()) {
      return NextResponse.json({ error: 'Missing or invalid: transaction_id (non-empty string)' }, { status: 400 });
    }
    if (!receipt_url || typeof receipt_url !== 'string' || !receipt_url.trim()) {
      return NextResponse.json({ error: 'Missing or invalid: receipt_url (non-empty string)' }, { status: 400 });
    }

    const { data, error } = await supabase.rpc('create_topup_request', {
      p_provider_id: user.id,
      p_amount_sent: amount_sent,
      p_transaction_id: transaction_id.trim(),
      p_receipt_url: receipt_url.trim(),
    });

    if (error) {
      console.error('[topup/create] RPC error', { uid: user.id, error: error.message });
      return NextResponse.json({ error: 'Failed to create top-up request', details: error.message }, { status: 500 });
    }

    const result = Array.isArray(data) ? data[0] : data;
    if (!result?.success) {
      return NextResponse.json({ error: result?.message ?? 'Failed to create top-up request' }, { status: 400 });
    }

    return NextResponse.json({ message: result.message, requestId: result.request_id });
  } catch (e: any) {
    console.error('[topup/create] unexpected', e);
    return NextResponse.json({ error: 'Internal server error', details: e.message }, { status: 500 });
  }
}
