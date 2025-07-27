// /app/api/find-provider/route.ts
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const body = await req.json();
  const { serviceType, userLat, userLng, radiusKm = 10 } = body;

  // PostGIS query to find nearby providers with matching service type
  const { data: providers, error } = await supabase.rpc('find_nearby_providers', {
    lat_input: userLat,
    lng_input: userLng,
    radius_km: radiusKm,
    selected_service: serviceType,
  });

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  // Now notify each provider (for now, just return matched providers)
  return NextResponse.json({ providers });
}
