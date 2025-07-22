// app/api/create-service-request/route.ts
import { NextRequest, NextResponse } from 'next/server'; // Import NextRequest and NextResponse
import { createClient } from '@supabase/supabase-js';

// IMPORTANT: This key MUST NOT start with NEXT_PUBLIC_ for security reasons
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Initialize Supabase client with service role key for server-side operations
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false, // Important for server-side, prevents session storage
  },
});

// Export a POST function to handle POST requests
// Using the signature provided by you: (res: NextResponse, req: NextRequest)
export async function POST(req: NextRequest) { // Only req is needed as NextResponse is used directly
  // Parse the request body as JSON
  const { user_id, userLat, userLon, serviceType, requestDetails } = await req.json();

  // Basic input validation
  if (
    !user_id ||
    typeof userLat !== 'number' ||
    typeof userLon !== 'number' ||
    typeof serviceType !== 'string'
  ) {
    return NextResponse.json({ message: 'Missing or invalid input parameters.' }, { status: 400 });
  }

  try {
    // 1. Find nearest Ustaz first using Supabase RPC
    const { data: ustaz, error: ustazError } = await supabase.rpc('get_nearest_ustaz', {
      p_user_lat: userLat,
      p_user_lon: userLon,
      p_service_type: serviceType,
      p_radius_meters: 10000, // Search within 10km
    });

    if (ustazError) {
      console.error('Error finding Ustaz:', ustazError);
      return NextResponse.json({ message: 'Error finding Ustaz.', error: ustazError.message }, { status: 500 });
    }

    if (!ustaz || ustaz.length === 0) {
      return NextResponse.json({ message: 'No Ustaz found for this service type in your area.' }, { status: 404 });
    }

    // 2. Create the service request in the database
    const { data: newRequest, error: requestError } = await supabase
      .from('service_requests')
      .insert([
        {
          user_id: user_id,
          service_type: serviceType,
          request_latitude: userLat,
          request_longitude: userLon,
          request_details: requestDetails || null,
          status: 'pending',
        },
      ])
      .select()
      .single();

    if (requestError) {
      console.error('Error creating service request:', requestError);
      return NextResponse.json({ message: 'Failed to create service request.', error: requestError.message }, { status: 500 });
    }

    // Define types for clarity in the response mapping
    interface UstazResult {
      ustaz_id: string;
      firstName: string;
      lastName: string;
      distance_meters: number;
    }

    return NextResponse.json({
      message: 'Service request created. Notifying nearest Ustaz.',
      requestId: newRequest.id,
      potentialUstaz: (ustaz as UstazResult[]).map((u) => ({
        id: u.ustaz_id,
        name: `${u.firstName} ${u.lastName}`,
        distance: u.distance_meters,
      }))
    }, { status: 200 });

  } catch (error: any) {
    console.error('Unhandled error during service request:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.', error: error.message }, { status: 500 });
  }
}