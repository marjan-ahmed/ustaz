// /api/request-service.ts (route handler)
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { user_id, serviceType, userLat, userLon, selectedProviderIds } = await req.json();

    const { data, error } = await supabase
      .from('service_requests')
      .insert({
        user_id,
        service_type: serviceType,
        latitude: userLat,
        longitude: userLon,
        status: 'pending_notification',
        notified_provider_ids: selectedProviderIds,
      })
      .select('id');

    if (error) throw error;

    // Optionally notify each provider in your custom notifications table
    for (const providerId of selectedProviderIds) {
      await supabase.from('notifications').insert({
        recipient_user_id: providerId,
        type: 'service_request',
        message: `New ${serviceType} request near your location.`,
        metadata: {
          userLat,
          userLon,
          serviceType,
        },
      });
    }

    return NextResponse.json({
      message: 'Providers notified.',
      requestId: data[0].id,
      status: 'notified_multiple',
    });
  } catch (err: any) {
    console.error('Service Request Error:', err.message);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
