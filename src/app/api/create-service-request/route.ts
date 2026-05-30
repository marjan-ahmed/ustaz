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
        get: (name) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    },
  );
}

export async function POST(req: NextRequest) {
  const supabase = await createAuthedClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  try {
    const {
      serviceType,
      userLat,
      userLng,
      requestDetails = null,
      radiusKm = 3,
    } = await req.json();

    if (!serviceType || userLat === undefined || userLng === undefined) {
      return NextResponse.json(
        { error: 'Missing required parameters: serviceType, userLat, userLng' },
        { status: 400 },
      );
    }

    if (
      typeof userLat !== 'number' ||
      typeof userLng !== 'number' ||
      userLat < -90 || userLat > 90 ||
      userLng < -180 || userLng > 180
    ) {
      return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
    }

    const radiusMeters = Math.max(100, Math.min(50_000, Math.round(radiusKm * 1000)));

    const { data, error: rpcError } = await supabase.rpc(
      'create_service_request_with_notifications',
      {
        p_service_type: serviceType,
        p_request_latitude: userLat,
        p_request_longitude: userLng,
        p_request_details: requestDetails,
        p_radius_meters: radiusMeters,
      },
    );

    if (rpcError) {
      console.error('create_service_request_with_notifications failed:', rpcError);
      return NextResponse.json(
        { error: 'Failed to create service request', details: rpcError.message },
        { status: 500 },
      );
    }

    const row = Array.isArray(data) ? data[0] : data;
    const requestId = row?.request_id ?? null;
    const notifiedCount = row?.notified_count ?? 0;
    const providersNotified = row?.providers_notified ?? [];

    if (!notifiedCount) {
      return NextResponse.json({
        message: 'No providers found nearby',
        requestId,
        providersNotified: 0,
        providerIds: [],
      });
    }

    // Fire-and-forget FCM push to notified providers (works even if their tab is closed).
    sendPush(
      providersNotified as string[],
      `New ${serviceType} request nearby`,
      requestDetails ?? 'A customer has requested your service',
      { url: '/dashboard', requestId: String(requestId), serviceType: String(serviceType) },
    ).catch((err) => console.error('[sendPush] create-service-request push failed:', err));

    return NextResponse.json({
      message: 'Service request created and notifications sent successfully',
      requestId,
      providersNotified: notifiedCount,
      providerIds: providersNotified,
    });
  } catch (error: any) {
    console.error('Unexpected error in create-service-request API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  const supabase = await createAuthedClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  const url = new URL(req.url);
  const requestId = url.searchParams.get('requestId');
  if (!requestId) {
    return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('service_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch request status', details: error.message },
        { status: 500 },
      );
    }
    return NextResponse.json({ request: data });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 },
    );
  }
}
