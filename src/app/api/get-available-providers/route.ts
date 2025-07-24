// app/api/get-available-providers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../client/supabaseClient'; // Assuming this is your custom client creation utility

// Validate environment variables early
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Ensure this is NOT NEXT_PUBLIC_

// Check if environment variables are set. If not, log errors.
if (!supabaseUrl) {
    console.error("Environment variable NEXT_PUBLIC_SUPABASE_URL is not set.");
}
if (!supabaseServiceRoleKey) {
    console.error("Environment variable SUPABASE_SERVICE_ROLE_KEY is not set.");
}

// Create a Supabase client with the service role key for server-side operations.
// This client bypasses Row Level Security (RLS) and is used for sensitive operations
// like fetching provider lists without RLS restrictions that might apply to regular users.
let supabaseAdmin: ReturnType<typeof createClient>;
try {
    if (!supabaseUrl || !supabaseServiceRoleKey) {
        throw new Error("Supabase URL or Service Role Key is missing. Cannot initialize supabaseAdmin client.");
    }
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            persistSession: false, // Do not persist session for server-side operations
        },
    });
} catch (error) {
    console.error("Failed to initialize supabaseAdmin client:", error);
    throw new Error("Supabase Admin client initialization failed. Please check your environment variables.");
}

/**
 * Handles POST requests to fetch available service providers based on service type.
 * This route does NOT implement any "nearest" logic; it simply returns all available providers
 * for the specified service type.
 */
export async function POST(req: NextRequest) {
    try {
        // Destructure 'serviceType' (camelCase) from the frontend payload
        const { serviceType, userLat, userLon } = await req.json(); // userLat/userLon are received but not used for filtering here

        // Basic validation for required input
        if (!serviceType) {
            console.error("Missing serviceType in request body.");
            return NextResponse.json({ message: 'Missing service type parameter.' }, { status: 400 });
        }

        console.log(`Fetching available providers for service type: ${serviceType}`);

        // Query the 'ustaz_registrations' table using the supabaseAdmin client (bypasses RLS).
        // Select only the necessary public information for the client to display.
        // Removed the filter for 'is_available' as the column does not exist.
        const { data: providers, error: fetchError } = await supabaseAdmin
            .from('ustaz_registrations')
            .select('userId, firstName, lastName, phoneNumber, phoneCountryCode, email, latitude, longitude') // Include latitude/longitude if you store them and want to display/use client-side
            .eq('service_type', serviceType); // Using 'service_type' (snake_case) as confirmed by user for the database column.

        if (fetchError) {
            console.error('Error fetching providers:', fetchError.message);
            return NextResponse.json({ message: 'Failed to fetch available providers.', error: fetchError.message }, { status: 500 });
        }

        if (!providers || providers.length === 0) {
            console.warn(`No available providers found for service type: ${serviceType}`);
            return NextResponse.json({ providers: [], message: 'No available providers found for this service type.' }, { status: 200 });
        }

        console.log(`Found ${providers.length} available providers for ${serviceType}.`);

        // Return the list of providers.
        return NextResponse.json({ providers, message: 'Available providers fetched successfully.' }, { status: 200 });

    } catch (error: any) {
        console.error('Unhandled top-level error in get-available-providers API:', error);
        return NextResponse.json({ message: 'An unexpected error occurred.', error: error.message }, { status: 500 });
    }
}
