// app/api/find-ustaz/route.ts
import { NextRequest, NextResponse } from 'next/server'; // Import NextRequest and NextResponse
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../../../../client/supabaseClient';


// Export a POST function to handle POST requests
export async function POST(req: NextRequest) {
  const { userLat, userLon, serviceType, radiusInMeters } = await req.json();

  // Basic input validation
  if (
    typeof userLat !== 'number' ||
    typeof userLon !== 'number' ||
    typeof serviceType !== 'string' ||
    (radiusInMeters !== undefined && typeof radiusInMeters !== 'number')
  ) {
    return NextResponse.json({ message: 'Invalid input parameters.' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase.rpc('get_nearest_ustaz', {
      p_user_lat: userLat,
      p_user_lon: userLon,
      p_service_type: serviceType,
      p_radius_meters: radiusInMeters || 10000, // Use default if not provided
    });

    if (error) {
      console.error('Error calling Supabase RPC:', error);
      return NextResponse.json({ message: 'Error finding Ustaz', error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ustaz: data }, { status: 200 });

  } catch (error: any) {
    console.error('Unhandled error:', error);
    return NextResponse.json({ message: 'An unexpected error occurred', error: error.message }, { status: 500 });
  }
}