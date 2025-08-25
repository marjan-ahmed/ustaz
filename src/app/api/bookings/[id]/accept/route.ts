import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../../../client/supabaseClient';
import { auth } from '@clerk/nextjs/server';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const bookingId = params.id;
    const { finalCost } = await request.json();

    // Verify provider exists and is verified
    const { data: provider, error: providerError } = await supabase
      .from('service_providers')
      .select('id, verification_status')
      .eq('user_id', userId)
      .eq('verification_status', 'approved')
      .single();

    if (providerError || !provider) {
      return NextResponse.json(
        { error: 'Provider not found or not verified' },
        { status: 403 }
      );
    }

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('service_bookings')
      .select('*')
      .eq('id', bookingId)
      .eq('status', 'pending')
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found or already accepted' },
        { status: 404 }
      );
    }

    // Update booking with provider and new status
    const { data: updatedBooking, error: updateError } = await supabase
      .from('service_bookings')
      .update({
        provider_id: provider.id,
        status: 'accepted',
        final_cost: finalCost || booking.estimated_cost,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to accept booking' },
        { status: 500 }
      );
    }

    // Notify customer
    await supabase
      .from('notifications')
      .insert({
        user_id: booking.customer_id,
        title: 'Booking Accepted',
        message: 'A service provider has accepted your booking request',
        type: 'booking',
        related_booking_id: bookingId,
      });

    // Update provider status to busy
    await supabase
      .from('service_providers')
      .update({ availability_status: 'busy' })
      .eq('id', provider.id);

    return NextResponse.json({
      booking: updatedBooking,
      message: 'Booking accepted successfully'
    });

  } catch (error) {
    console.error('Error accepting booking:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}