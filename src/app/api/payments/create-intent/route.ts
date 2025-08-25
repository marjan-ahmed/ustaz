import { NextRequest, NextResponse } from 'next/server';
import { stripe, createPaymentIntent } from '@/lib/stripe';
import { supabase } from '../../../../../client/supabaseClient';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookingId, amount, currency = 'pkr' } = await request.json();

    if (!bookingId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: bookingId, amount' },
        { status: 400 }
      );
    }

    // Verify booking exists and user is the customer
    const { data: booking, error: bookingError } = await supabase
      .from('service_bookings')
      .select('*')
      .eq('id', bookingId)
      .eq('customer_id', userId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found or unauthorized' },
        { status: 404 }
      );
    }

    // Create payment intent
    const paymentIntent = await createPaymentIntent(
      Math.round(amount * 100), // Convert to cents
      currency,
      {
        bookingId,
        customerId: userId,
        providerId: booking.provider_id,
      }
    );

    // Update booking with payment intent ID
    await supabase
      .from('service_bookings')
      .update({ 
        payment_intent_id: paymentIntent.id,
        final_cost: amount 
      })
      .eq('id', bookingId);

    // Create payment record
    const platformFee = Math.round(amount * 0.10 * 100); // 10% in cents
    const providerAmount = Math.round(amount * 100) - platformFee;

    await supabase
      .from('payments')
      .insert({
        booking_id: bookingId,
        stripe_payment_intent_id: paymentIntent.id,
        amount: amount,
        platform_fee: platformFee / 100,
        provider_amount: providerAmount / 100,
        currency: currency.toUpperCase(),
      });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}