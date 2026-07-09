import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient } from '@/lib/server';

const ACTIVE_STATUSES = [
  'accepted',
  'provider_enroute',
  'arriving',
  'arrived',
  'in_progress',
  'work_in_progress',
];

const AUTO_ARRIVAL_STATUSES = ['accepted', 'provider_enroute', 'arriving'];
const ARRIVAL_RADIUS_M = 80;

function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6_371_000;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export async function POST(req: NextRequest) {
  const supabase = await createAuthedClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  try {
    const { requestId, latitude, longitude } = await req.json();

    if (!requestId || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: 'Missing required parameters: requestId, latitude, longitude' },
        { status: 400 },
      );
    }
    if (
      typeof latitude !== 'number' ||
      typeof longitude !== 'number' ||
      latitude < -90 || latitude > 90 ||
      longitude < -180 || longitude > 180
    ) {
      return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
    }

    const { data: serviceRequest, error: requestError } = await supabase
      .from('service_requests')
      .select('id, status, accepted_by_provider_id, request_latitude, request_longitude')
      .eq('id', requestId)
      .maybeSingle();

    if (requestError || !serviceRequest) {
      return NextResponse.json(
        { error: 'Service request not found' },
        { status: 404 },
      );
    }
    if (serviceRequest.accepted_by_provider_id !== user.id) {
      console.warn('[update-provider-location] session/provider mismatch', {
        session_user: user.id,
        accepted_by_provider_id: serviceRequest.accepted_by_provider_id,
        requestId,
      });
      return NextResponse.json(
        {
          error: 'Session user is not the assigned provider',
          session_user: user.id,
          accepted_by_provider_id: serviceRequest.accepted_by_provider_id,
        },
        { status: 403 },
      );
    }
    if (!ACTIVE_STATUSES.includes(serviceRequest.status)) {
      return NextResponse.json(
        { error: 'Request is not in an active state for location tracking' },
        { status: 400 },
      );
    }

    const { data: liveLocation, error: locationError } = await supabase
      .from('live_locations')
      .upsert(
        {
          provider_id: user.id,
          request_id: requestId,
          latitude,
          longitude,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'request_id' },
      )
      .select()
      .single();

    if (locationError) {
      console.error('Error updating live location:', locationError);
      return NextResponse.json(
        { error: 'Failed to update live location', details: locationError.message },
        { status: 500 },
      );
    }

    let autoArrival: { arrived: boolean; distanceMeters?: number } = { arrived: false };

    if (
      AUTO_ARRIVAL_STATUSES.includes(serviceRequest.status) &&
      typeof serviceRequest.request_latitude === 'number' &&
      typeof serviceRequest.request_longitude === 'number'
    ) {
      const distance = distanceMeters(latitude, longitude, serviceRequest.request_latitude, serviceRequest.request_longitude);
      if (distance <= ARRIVAL_RADIUS_M) {
        let arrivedResp = await supabase.rpc('update_request_to_arrived', {
          p_request_id: requestId,
          p_provider_id: user.id,
        });

        if (arrivedResp.error && serviceRequest.status === 'accepted') {
          await supabase.rpc('update_request_to_arriving', {
            p_request_id: requestId,
            p_provider_id: user.id,
          });
          arrivedResp = await supabase.rpc('update_request_to_arrived', {
            p_request_id: requestId,
            p_provider_id: user.id,
          });
        }

        if (arrivedResp.error) {
          console.warn('[update-provider-location] auto-arrival failed', arrivedResp.error.message);
        } else {
          autoArrival = { arrived: true, distanceMeters: Math.round(distance) };
        }
      }
    }

    return NextResponse.json({
      message: autoArrival.arrived ? 'Live location updated and arrival auto-confirmed' : 'Live location updated successfully',
      autoArrival,
      location: {
        providerId: liveLocation.provider_id,
        requestId: liveLocation.request_id,
        latitude: liveLocation.latitude,
        longitude: liveLocation.longitude,
        updatedAt: liveLocation.updated_at,
      },
    });
  } catch (error: any) {
    console.error('Unexpected error in update-provider-location API:', error);
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
    const { data: serviceRequest, error: requestError } = await supabase
      .from('service_requests')
      .select('id, user_id, accepted_by_provider_id')
      .eq('id', requestId)
      .single();

    if (requestError || !serviceRequest) {
      return NextResponse.json({ error: 'Service request not found' }, { status: 404 });
    }
    if (
      serviceRequest.user_id !== user.id &&
      serviceRequest.accepted_by_provider_id !== user.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: liveLocation, error: locationError } = await supabase
      .from('live_locations')
      .select('*')
      .eq('request_id', requestId)
      .maybeSingle();

    if (locationError) {
      return NextResponse.json(
        { error: 'Failed to fetch live location', details: locationError.message },
        { status: 500 },
      );
    }
    if (!liveLocation) {
      return NextResponse.json({ message: 'No live location available yet', location: null });
    }

    return NextResponse.json({
      location: {
        providerId: liveLocation.provider_id,
        requestId: liveLocation.request_id,
        latitude: liveLocation.latitude,
        longitude: liveLocation.longitude,
        updatedAt: liveLocation.updated_at,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
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
    const { data: serviceRequest, error: requestError } = await supabase
      .from('service_requests')
      .select('id, user_id, accepted_by_provider_id')
      .eq('id', requestId)
      .single();

    if (requestError || !serviceRequest) {
      return NextResponse.json({ error: 'Service request not found' }, { status: 404 });
    }
    if (
      serviceRequest.user_id !== user.id &&
      serviceRequest.accepted_by_provider_id !== user.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error: deleteError } = await supabase
      .from('live_locations')
      .delete()
      .eq('request_id', requestId);

    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to stop tracking', details: deleteError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ message: 'Live location tracking stopped successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 },
    );
  }
}


