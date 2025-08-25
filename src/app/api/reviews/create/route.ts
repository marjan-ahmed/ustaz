import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '../../../../../client/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookingId, providerId, rating, reviewText, isAnonymous } = await request.json();

    // Validate required fields
    if (!bookingId || !providerId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Invalid data. Rating must be between 1 and 5.' },
        { status: 400 }
      );
    }

    // Verify the booking exists and user is the customer
    const { data: booking, error: bookingError } = await supabase
      .from('service_bookings')
      .select('customer_id, provider_id, status')
      .eq('id', bookingId)
      .eq('customer_id', userId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found or unauthorized' },
        { status: 404 }
      );
    }

    // Check if booking is completed
    if (booking.status !== 'completed') {
      return NextResponse.json(
        { error: 'Can only review completed services' },
        { status: 400 }
      );
    }

    // Check if review already exists
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('booking_id', bookingId)
      .eq('customer_id', userId)
      .single();

    if (existingReview) {
      return NextResponse.json(
        { error: 'Review already submitted for this booking' },
        { status: 409 }
      );
    }

    // Create the review
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .insert({
        booking_id: bookingId,
        customer_id: userId,
        provider_id: providerId,
        rating,
        review_text: reviewText || null,
        is_anonymous: isAnonymous || false,
      })
      .select()
      .single();

    if (reviewError) {
      console.error('Error creating review:', reviewError);
      return NextResponse.json(
        { error: 'Failed to submit review' },
        { status: 500 }
      );
    }

    // Create notification for provider
    const { data: provider } = await supabase
      .from('service_providers')
      .select('user_id')
      .eq('id', providerId)
      .single();

    if (provider) {
      await supabase
        .from('notifications')
        .insert({
          user_id: provider.user_id,
          title: 'New Review Received',
          message: `You received a ${rating}-star review from a customer`,
          type: 'system',
          related_booking_id: bookingId,
        });
    }

    return NextResponse.json({
      review,
      message: 'Review submitted successfully'
    });

  } catch (error) {
    console.error('Error in review creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}