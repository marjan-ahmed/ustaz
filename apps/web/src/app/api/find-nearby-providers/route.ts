import { NextRequest, NextResponse } from 'next/server';
import { createAuthedClient } from '@/lib/server';

export async function POST(req: NextRequest) {
  const supabase = await createAuthedClient();

  // Define type for provider with distance
  type ProviderWithDistance = {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phoneNumber: string;
    serviceType: string;
    city?: string;
    avatarUrl?: string;
    distance: number; // in meters
  };

  try {
    const { serviceType, userLat, userLng, radiusKm = 3 } = await req.json();

    if (!serviceType || userLat === undefined || userLng === undefined) {
      return NextResponse.json(
        { error: 'Missing required parameters: serviceType, userLat, userLng' },
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

    // Use find_providers_nearby_ranked (TDD-verified, composite scoring: distance + rating + reliability + fairness)
    const { data, error } = await supabase.rpc('find_providers_nearby_ranked', {
      p_user_lat: userLat,
      p_user_lng: userLng,
      p_service_type: serviceType,
      p_radius_meters: radiusMeters,
      p_limit: 5,
    });

    if (error) {
      console.error('Error querying providers with distance:', error);
      return NextResponse.json(
        { error: 'Failed to query providers', details: error.message },
        { status: 500 }
      );
    }

    // find_providers_nearby_ranked returns user_id, first_name, last_name, distance_meters, score, etc.
    const providers: ProviderWithDistance[] = (data ?? []).map((provider: any) => ({
      id: provider.user_id,
      firstName: provider.first_name,
      lastName: provider.last_name,
      phoneNumber: provider.phone_number,
      serviceType: provider.service_type,
      city: provider.city,
      avatarUrl: provider.avatar_url,
      distance: Math.round(provider.distance_meters ?? 0),
    }));

    return NextResponse.json({ providers });
  } catch (error: any) {
    console.error('Unexpected error in find-nearby-providers API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// Alternative implementation using raw SQL if the RPC doesn't exist
export async function GET(req: NextRequest) {
  // This is just a placeholder to indicate we could also support GET requests
  return NextResponse.json(
    { error: 'GET method not implemented for this endpoint' },
    { status: 405 }
  );
}