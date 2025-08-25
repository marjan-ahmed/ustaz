import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../../client/supabaseClient';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      serviceCategory,
      title,
      description,
      serviceAddress,
      serviceLatitude,
      serviceLongitude,
      estimatedCost,
      scheduledDate,
      metadata = {}
    } = await request.json();

    // Validate required fields
    if (!serviceCategory || !title || !description || !serviceAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create the booking
    const { data: booking, error: bookingError } = await supabase
      .from('service_bookings')
      .insert({
        customer_id: userId,
        service_category_id: serviceCategory,
        title,
        description,
        service_address: serviceAddress,
        service_latitude: serviceLatitude,
        service_longitude: serviceLongitude,
        estimated_cost: estimatedCost,
        scheduled_date: scheduledDate,
        metadata,
        status: 'pending'
      })
      .select()
      .single();

    if (bookingError) {
      console.error('Error creating booking:', bookingError);
      return NextResponse.json(
        { error: 'Failed to create booking' },
        { status: 500 }
      );
    }

    // Get nearby providers for this service category
    const { data: providers, error: providersError } = await supabase
      .from('service_providers')
      .select(`
        id, 
        user_id,
        service_categories,
        availability_status,
        average_rating,
        hourly_rate,
        user_profiles!inner(first_name, last_name, phone_number)
      `)
      .contains('service_categories', [serviceCategory])
      .eq('verification_status', 'approved')
      .eq('availability_status', 'online');

    if (providersError) {
      console.error('Error fetching providers:', providersError);
    }

    // Send notifications to nearby providers
    if (providers && providers.length > 0) {
      const notifications = providers.map(provider => ({
        user_id: provider.user_id,
        title: 'New Service Request',
        message: `New ${title} request in your area`,
        type: 'booking',
        related_booking_id: booking.id,
      }));

      await supabase
        .from('notifications')
        .insert(notifications);
    }

    return NextResponse.json({
      booking,
      nearbyProviders: providers?.length || 0
    });

  } catch (error) {
    console.error('Error in booking creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}