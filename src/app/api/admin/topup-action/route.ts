import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient } from '@/lib/server';
import { sendPush } from '@/lib/sendPush';
import { verifyAdminToken } from '@/lib/adminAuth';

export async function POST(req: NextRequest) {
  // Verify admin session cookie: HMAC signature + expiry + email, fail-closed.
  const adminCookie = req.cookies.get('admin_session')?.value;
  if (!verifyAdminToken(adminCookie)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { requestId, action, reason } = await req.json();

    if (!requestId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Missing or invalid: requestId, action ("approve"|"reject")' },
        { status: 400 },
      );
    }

    if (action === 'reject' && !reason?.trim()) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 },
      );
    }

    // Use service role client for privileged operations
    const supabase = await createAuthedClient();

    // Call the approve_topup_request RPC
    const { data, error } = await supabase.rpc('approve_topup_request', {
      p_request_id: requestId,
      p_admin_id: '00000000-0000-0000-0000-000000000000', // Placeholder admin UUID
      p_approved: action === 'approve',
      p_admin_note: action === 'approve' ? 'Approved' : reason,
    });

    if (error) {
      console.error('[admin/topup-action] RPC failed', { requestId, action, error: error.message });
      return NextResponse.json(
        { error: 'Failed to process request', details: error.message },
        { status: 500 },
      );
    }

    const result = Array.isArray(data) ? data[0] : data;
    if (!result?.success) {
      return NextResponse.json(
        { error: result?.message || 'Failed to process' },
        { status: 400 },
      );
    }

    // Fetch provider info for push notification
    const { data: topupRequest } = await supabase
      .from('topup_requests')
      .select('provider_id')
      .eq('id', requestId)
      .single();

    if (topupRequest?.provider_id) {
      const providerId = topupRequest.provider_id;

      if (action === 'approve') {
        // Notify provider their topup was approved
        sendPush(
          [providerId],
          'Top-Up Approved ✓',
          `Your top-up request has been approved! Your wallet has been credited. You can now go online.`,
          { url: '/dashboard' },
        ).catch((err) => console.error('[sendPush] approval push failed:', err));
      } else {
        // Notify provider their topup was rejected with reason
        const note = reason || 'No reason provided';
        sendPush(
          [providerId],
          'Top-Up Rejected ✗',
          `Your top-up request was rejected. Reason: ${note}. Please submit a new request with correct information.`,
          { url: '/dashboard' },
        ).catch((err) => console.error('[sendPush] rejection push failed:', err));
      }
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (e: any) {
    console.error('[admin/topup-action] unexpected', e);
    return NextResponse.json(
      { error: 'Internal server error', details: e.message },
      { status: 500 },
    );
  }
}
