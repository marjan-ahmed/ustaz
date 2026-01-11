import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/server';

export async function POST(req: NextRequest) {
  const supabase = createClient();

  try {
    const {
      userId,
      serviceType,
      userLat,
      userLng,
      requestDetails = null,
      radiusKm = 3
    } = await req.json();

    if (!userId || !serviceType || userLat === undefined || userLng === undefined) {
      return NextResponse.json(
        { error: 'Missing required parameters: userId, serviceType, userLat, userLng' },
        { status: 400 }
      );
    }

    // Validate coordinates
    if (
      typeof userLat !== 'number' ||
      typeof userLng !== 'number' ||
      userLat < -90 || userLat > 90 ||
      userLng < -180 || userLng > 180
    ) {
      return NextResponse.json(
        { error: 'Invalid coordinates' },
        { status: 400 }
      );
    }

    // Convert radius to meters for PostGIS ST_DWithin function
    const radiusMeters = radiusKm * 1000;

    // Use the database function to create service request and notify eligible providers
    // This handles server-side filtering for online status, distance, and service type
    const { data, error: rpcError } = await supabase
      .rpc('create_service_request_with_notifications', {
        p_user_id: userId,
        p_service_type: serviceType,
        p_request_latitude: userLat,
        p_request_longitude: userLng,
        p_request_details: requestDetails,
        p_radius_meters: radiusMeters
      });

    if (rpcError) {
      console.error('Error creating service request with notifications:', rpcError);
      return NextResponse.json(
        { error: 'Failed to create service request', details: rpcError.message },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json({
        message: 'No providers found nearby',
        requestId: null,
        providersNotified: 0,
        providerIds: []
      });
    }

    const result = data[0]; // Get the first (and should be only) result
    const { request_id, notified_count, providers_notified } = result;

    if (notified_count === 0) {
      return NextResponse.json({
        message: 'No providers found nearby',
        requestId: request_id,
        providersNotified: 0,
        providerIds: []
      });
    }

    // Return success response with the request ID and number of providers notified
    return NextResponse.json({
      message: 'Service request created and notifications sent successfully',
      requestId: request_id,
      providersNotified: notified_count,
      providerIds: providers_notified
    });
  } catch (error: any) {
    console.error('Unexpected error in create-service-request API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint to check request status
export async function GET(req: NextRequest) {
  const supabase = createClient();
  const url = new URL(req.url);
  const requestId = url.searchParams.get('requestId');

  if (!requestId) {
    return NextResponse.json(
      { error: 'Request ID is required' },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabase
      .from('service_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (error) {
      console.error('Error fetching request status:', error);
      return NextResponse.json(
        { error: 'Failed to fetch request status', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ request: data });
  } catch (error: any) {
    console.error('Unexpected error in GET service request:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}