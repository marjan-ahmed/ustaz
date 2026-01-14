import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/server';

export async function POST(req: NextRequest) {
  const supabase = createClient();

  try {
    const { providerId, requestId, latitude, longitude } = await req.json();

    if (!providerId || !requestId || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: 'Missing required parameters: providerId, requestId, latitude, longitude' },
        { status: 400 }
      );
    }

    // Validate coordinates
    if (
      typeof latitude !== 'number' ||
      typeof longitude !== 'number' ||
      latitude < -90 || latitude > 90 ||
      longitude < -180 || longitude > 180
    ) {
      return NextResponse.json(
        { error: 'Invalid coordinates' },
        { status: 400 }
      );
    }

    // Verify that this provider is assigned to this request
    const { data: serviceRequest, error: requestError } = await supabase
      .from('service_requests')
      .select('*')
      .eq('id', requestId)
      .eq('accepted_by_provider_id', providerId)
      .single();

    if (requestError || !serviceRequest) {
      return NextResponse.json(
        { error: 'Provider is not assigned to this request or request not found' },
        { status: 403 }
      );
    }

    // Verify that the request is in an active state (accepted, not completed/cancelled)
    if (!['accepted', 'in_progress'].includes(serviceRequest.status)) {
      return NextResponse.json(
        { error: 'Request is not in an active state for location tracking' },
        { status: 400 }
      );
    }

    // Create or update the live location record using upsert
    // Now that we have a unique constraint on request_id, this will work properly
    const { data: liveLocation, error: locationError } = await supabase
      .from('live_locations')
      .upsert({
        provider_id: providerId,
        request_id: requestId,
        latitude: latitude,
        longitude: longitude,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'request_id' // This means if a record with the same request_id exists, update it
      })
      .select()
      .single();

    if (locationError) {
      console.error('Error updating live location:', locationError);
      return NextResponse.json(
        { error: 'Failed to update live location', details: locationError.message },
        { status: 500 }
      );
    }

    // Log the provider location for debugging
    console.log('Provider location updated:', {
      providerId: liveLocation.provider_id,
      requestId: liveLocation.request_id,
      latitude: liveLocation.latitude,
      longitude: liveLocation.longitude,
      updatedAt: liveLocation.updated_at
    });

    return NextResponse.json({
      message: 'Live location updated successfully',
      location: {
        providerId: liveLocation.provider_id,
        requestId: liveLocation.request_id,
        latitude: liveLocation.latitude,
        longitude: liveLocation.longitude,
        updatedAt: liveLocation.updated_at
      }
    });
  } catch (error: any) {
    console.error('Unexpected error in update-provider-location API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch a provider's live location for a specific request
export async function GET(req: NextRequest) {
  const supabase = createClient();
  const url = new URL(req.url);
  const requestId = url.searchParams.get('requestId');
  const userId = url.searchParams.get('userId'); // The user requesting to track

  if (!requestId) {
    return NextResponse.json(
      { error: 'Request ID is required' },
      { status: 400 }
    );
  }

  try {
    // First, verify that the user is authorized to track this request
    // (either they made the request or are the assigned provider)
    const { data: serviceRequest, error: requestError } = await supabase
      .from('service_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (requestError || !serviceRequest) {
      return NextResponse.json(
        { error: 'Service request not found' },
        { status: 404 }
      );
    }

    // Check if the requesting user is authorized to access this location data
    if (serviceRequest.user_id !== userId && serviceRequest.accepted_by_provider_id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized to access location data for this request' },
        { status: 403 }
      );
    }

    // Get the live location for this request
    const { data: liveLocation, error: locationError } = await supabase
      .from('live_locations')
      .select('*')
      .eq('request_id', requestId)
      .single();

    if (locationError) {
      // If no live location exists yet, return a specific response
      if (locationError.code === 'PGRST116') { // No rows returned
        console.log('No live location available yet for request:', requestId);
        return NextResponse.json({
          message: 'No live location available yet',
          location: null
        });
      }

      console.error('Error fetching live location:', locationError);
      return NextResponse.json(
        { error: 'Failed to fetch live location', details: locationError.message },
        { status: 500 }
      );
    }

    // Log the provider location for debugging
    console.log('Live location fetched for request:', {
      requestId: liveLocation.request_id,
      providerId: liveLocation.provider_id,
      latitude: liveLocation.latitude,
      longitude: liveLocation.longitude,
      updatedAt: liveLocation.updated_at
    });

    return NextResponse.json({
      location: {
        providerId: liveLocation.provider_id,
        requestId: liveLocation.request_id,
        latitude: liveLocation.latitude,
        longitude: liveLocation.longitude,
        updatedAt: liveLocation.updated_at
      }
    });
  } catch (error: any) {
    console.error('Unexpected error in GET provider location:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE endpoint to stop tracking (when service is completed)
export async function DELETE(req: NextRequest) {
  const supabase = createClient();
  const url = new URL(req.url);
  const requestId = url.searchParams.get('requestId');
  const userId = url.searchParams.get('userId');

  if (!requestId || !userId) {
    return NextResponse.json(
      { error: 'Request ID and User ID are required' },
      { status: 400 }
    );
  }

  try {
    // Verify that the user is authorized to stop tracking (requester or provider)
    const { data: serviceRequest, error: requestError } = await supabase
      .from('service_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (requestError || !serviceRequest) {
      return NextResponse.json(
        { error: 'Service request not found' },
        { status: 404 }
      );
    }

    if (serviceRequest.user_id !== userId && serviceRequest.accepted_by_provider_id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized to stop tracking for this request' },
        { status: 403 }
      );
    }

    // Delete the live location record
    const { error: deleteError } = await supabase
      .from('live_locations')
      .delete()
      .eq('request_id', requestId);

    if (deleteError) {
      console.error('Error deleting live location:', deleteError);
      return NextResponse.json(
        { error: 'Failed to stop tracking', details: deleteError.message },
        { status: 500 }
      );
    }

    console.log('Live location tracking stopped for request:', requestId);

    return NextResponse.json({
      message: 'Live location tracking stopped successfully'
    });
  } catch (error: any) {
    console.error('Unexpected error in DELETE provider location:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}