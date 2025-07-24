// app/api/request-service/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, CookieOptions } from '@supabase/ssr'; // For server-side Supabase client
import { createClient } from '../../../../client/supabaseClient'; // Assuming this is your custom client creation utility
import { cookies } from 'next/headers'; // NEW: Import cookies from next/headers

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
// like inserting notifications.
let supabaseAdmin: ReturnType<typeof createClient>;
try {
    // Ensure both URL and Service Role Key are available before initializing.
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
 * Geocodes an address and postal code using the OpenStreetMap Nominatim API.
 * This function is used to convert manual address input into latitude and longitude.
 * @param address The street address.
 * @param postalCode The postal code.
 * @returns An object with latitude and longitude, or null if geocoding fails.
 */
async function geocodeAddress(address: string, postalCode: string): Promise<{ lat: number; lng: number } | null> {
    const query = `${address}, ${postalCode}`;
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
        );
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Nominatim HTTP error: ${response.status}, Response: ${errorText}`);
            return null;
        }
        const data = await response.json();
        if (data && data.length > 0) {
            return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        } else {
            console.warn("No geocoding results found for the given address:", query);
            return null;
        }
    } catch (error) {
        console.error("Error during geocoding with Nominatim:", error);
        return null;
    }
}

/**
 * Handles POST requests to initiate a service request.
 * This function now finds all providers for a given service type and notifies them.
 * It no longer uses a "nearest" logic.
 */
export async function POST(req: NextRequest) {
    try {
        const cookieStore = await cookies();

        // --- DEBUGGING: Log specific Supabase cookies ---
        console.log("Server-side received sb-access-token:", cookieStore.get('sb-access-token')?.value);
        console.log("Server-side received sb-refresh-token:", cookieStore.get('sb-refresh-token')?.value);
        // --- END DEBUGGING ---

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get: (name: string) => cookieStore.get(name)?.value,
                    set: (name: string, value: string, options: CookieOptions) => {
                        cookieStore.set({ name, value, ...options });
                    },
                    remove: (name: string) => {
                        cookieStore.delete(name);
                    },
                },
            }
        );

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError) {
            console.error("Supabase Auth Error in API route:", authError);
            return NextResponse.json({ message: 'Authentication failed.', error: authError.message }, { status: 401 });
        }

        if (!user) {
            console.warn("No user found in session for API request.");
            return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
        }

        const userId = user.id;

        const { serviceType, requestDetails, userAddress, userPostalCode, userLat, userLon, requestId: existingRequestId, selectedProviderIds } = await req.json();

        let finalUserLat = userLat;
        let finalUserLon = userLon;
        let serviceRequestId = existingRequestId;

        if ((finalUserLat === null || finalUserLon === null) && userAddress && userPostalCode) {
            console.log("Attempting to geocode address:", userAddress, userPostalCode);
            const geocodedLocation = await geocodeAddress(userAddress, userPostalCode);
            if (geocodedLocation) {
                finalUserLat = geocodedLocation.lat;
                finalUserLon = geocodedLocation.lng;
                console.log("Geocoded location:", finalUserLat, finalUserLon);
            } else {
                console.error("Failed to geocode address for:", userAddress, userPostalCode);
                return NextResponse.json({ message: 'Failed to geocode address. Please try again with a more specific address or use current location.' }, { status: 400 });
            }
        }

        if (
            typeof finalUserLat !== 'number' ||
            typeof finalUserLon !== 'number' ||
            typeof serviceType !== 'string' ||
            !Array.isArray(selectedProviderIds) ||
            selectedProviderIds.length === 0
        ) {
            console.error("Missing or invalid input parameters:", { finalUserLat, finalUserLon, serviceType, selectedProviderIds });
            return NextResponse.json({ message: 'Missing or invalid input parameters (location, service type, or selected providers).' }, { status: 400 });
        }

        if (!serviceRequestId) {
            try {
                const { data: newRequest, error: requestError } = await supabaseAdmin
                    .from('service_requests')
                    .insert([
                        {
                            user_id: userId,
                            service_type: serviceType,
                            request_latitude: finalUserLat,
                            request_longitude: finalUserLon,
                            request_details: requestDetails || null,
                            status: 'pending_notification',
                            notified_providers: selectedProviderIds,
                        },
                    ])
                    .select('id')
                    .single();

                if (requestError) {
                    console.error('Error creating service request:', requestError.message);
                    return NextResponse.json({ message: 'Failed to create service request.', error: requestError.message }, { status: 500 });
                }
                serviceRequestId = newRequest.id;
                console.log("New service request created with ID:", serviceRequestId);
            } catch (error) {
                console.error("Error in creating new service request block:", error);
                return NextResponse.json({ message: 'An unexpected error occurred while creating service request.' }, { status: 500 });
            }
        } else {
            console.log(`Updating existing service request ${serviceRequestId} status to pending_notification and updating notified_providers.`);
            const { error: updateError } = await supabaseAdmin
                .from('service_requests')
                .update({
                    status: 'pending_notification',
                    notified_providers: selectedProviderIds,
                })
                .eq('id', String(serviceRequestId));

            if (updateError) {
                console.error('Error updating existing service request status:', updateError.message);
                return NextResponse.json({ message: 'Failed to update existing service request status.', error: updateError.message }, { status: 500 });
            }
        }

        await supabaseAdmin.from('service_requests')
            .update({
                status: 'notified_multiple',
                notified_providers: selectedProviderIds,
            })
            .eq('id', String(serviceRequestId));
        console.log(`Service request ${serviceRequestId} updated to 'notified_multiple'. Selected providers:`, selectedProviderIds);

        return NextResponse.json({
            message: `Service request created and ${selectedProviderIds.length} providers marked as notified.`,
            requestId: serviceRequestId,
            notifiedProviderIds: selectedProviderIds,
            status: 'notified_multiple'
        }, { status: 200 });

    } catch (error: any) {
        console.error('Unhandled top-level error during service request POST:', error);
        return NextResponse.json({ message: 'An unexpected error occurred.', error: error.message }, { status: 500 });
    }
}
