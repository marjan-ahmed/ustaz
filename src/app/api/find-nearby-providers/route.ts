import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/server';

export async function POST(req: NextRequest) {
  const supabase = createClient();

  // Define type for provider with distance
  type ProviderWithDistance = {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phoneNumber: string;
    phoneCountryCode: string;
    serviceType: string;
    city?: string;
    country?: string;
    avatarUrl?: string;
    experienceYears?: number;
    experienceDetails?: string;
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

    // Use Supabase's RPC to call a custom database function that calculates distances
    // This function needs to be created in the database first
    const { data, error } = await supabase.rpc('find_providers_nearby_with_distance', {
      lat_input: userLat,
      lng_input: userLng,
      radius_input: radiusMeters,
      type_input: serviceType
    });

    if (error) {
      console.error('Error querying providers with distance:', error);

      // If the RPC function doesn't exist, we'll need to implement a fallback
      if (error.code === '42883') { // undefined function error
        // Fallback: Get providers without distance calculation and return basic info
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('ustaz_registrations')
          .select(`
            userId,
            firstName,
            lastName,
            email,
            phoneNumber,
            phoneCountryCode,
            service_type,
            city,
            country,
            avatarUrl,
            experienceYears,
            experienceDetails
          `)
          .eq('service_type', serviceType)
          .eq('online_status', true)
          .eq('provider_status', 'available')
          .not('location', 'is', null)
          .limit(5);

        if (fallbackError) {
          console.error('Error with fallback query:', fallbackError);
          return NextResponse.json(
            { error: 'Failed to query providers', details: fallbackError.message },
            { status: 500 }
          );
        }

        // For fallback data, we don't have distance, so we assign a default value
        // Since we can't calculate distance without coordinates, assign a high default value
        const providers: ProviderWithDistance[] = fallbackData.map((provider: any) => ({
          id: provider.userId,
          firstName: provider.firstName,
          lastName: provider.lastName,
          email: provider.email,
          phoneNumber: provider.phoneNumber,
          phoneCountryCode: provider.phoneCountryCode,
          serviceType: provider.service_type,
          city: provider.city,
          country: provider.country,
          avatarUrl: provider.avatarUrl,
          experienceYears: provider.experienceYears,
          experienceDetails: provider.experienceDetails,
          distance: Number.MAX_SAFE_INTEGER // Placeholder since we don't have actual distance
        }));

        // Sort by the placeholder distance (they'll all have the same value, so order doesn't matter)
        // Just slice to the first 5
        const sortedProviders = providers.slice(0, 5);

        return NextResponse.json({ providers: sortedProviders });
      } else {
        return NextResponse.json(
          { error: 'Failed to query providers', details: error.message },
          { status: 500 }
        );
      }
    }

    // Format the response data
    const providers: ProviderWithDistance[] = data.map((provider: any) => ({
      id: provider.userId,
      firstName: provider.firstName,
      lastName: provider.lastName,
      email: provider.email,
      phoneNumber: provider.phoneNumber,
      phoneCountryCode: provider.phoneCountryCode,
      serviceType: provider.service_type,
      city: provider.city,
      country: provider.country,
      avatarUrl: provider.avatarUrl,
      experienceYears: provider.experienceYears,
      experienceDetails: provider.experienceDetails,
      distance: Math.round(provider.distance) // Round distance to nearest meter
    }));

    // Return the providers sorted by distance (nearest first), limited to top 5
    const sortedProviders = providers
      .sort((a: ProviderWithDistance, b: ProviderWithDistance) => a.distance - b.distance)
      .slice(0, 5);

    return NextResponse.json({ providers: sortedProviders });
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