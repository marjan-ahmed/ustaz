// pages/api/get-available-providers.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for API routes
// Ensure these environment variables are correctly set in your .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Use service role key for backend operations

// Using service role key for RPC calls to bypass RLS for this specific function
// This is generally safe for RPCs that are designed to be called by backend logic
// and have their own internal security/logic.
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { user_id, serviceType, userLat, userLon } = req.body;

  // Basic validation
  if (!user_id || !serviceType || userLat === undefined || userLon === undefined) {
    return res.status(400).json({ message: 'Missing required parameters.' });
  }

  try {
    // Call the Supabase RPC function to find nearby providers
    // The `radius_m` parameter should be adjusted as per your desired search radius.
    // For example, 5000 meters = 5 km.
    const { data: nearbyProviders, error: rpcError } = await supabaseAdmin.rpc('find_providers_nearby', {
      lat_input: userLat,
      lng_input: userLon,
      radius_m: 5000, // Search radius in meters (e.g., 5km)
      type_input: serviceType,
    });

    if (rpcError) {
      console.error('Supabase RPC error:', rpcError);
      return res.status(500).json({ message: 'Error finding providers.', error: rpcError.message });
    }

    // Filter out providers that are the current user, if the user could also be a provider
    const filteredProviders = nearbyProviders.filter((provider: any) => provider.user_id !== user_id);

    return res.status(200).json({ providers: filteredProviders });

  } catch (error: any) {
    console.error('API error in get-available-providers:', error);
    return res.status(500).json({ message: 'Internal server error.', error: error.message });
  }
}
