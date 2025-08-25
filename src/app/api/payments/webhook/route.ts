import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabase } from '../../../../../client/supabaseClient';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = headers().get('stripe-signature') as string;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handlePaymentSucceeded(paymentIntent: any) {
  const { id: paymentIntentId, metadata } = paymentIntent;
  const { bookingId, providerId } = metadata;

  // Update payment status
  await supabase
    .from('payments')
    .update({ 
      status: 'succeeded',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_payment_intent_id', paymentIntentId);

  // Update booking status
  await supabase
    .from('service_bookings')
    .update({ 
      payment_status: 'paid',
      updated_at: new Date().toISOString()
    })
    .eq('payment_intent_id', paymentIntentId);

  // Create notification for provider
  if (providerId && bookingId) {
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
          title: 'Payment Received',
          message: 'Payment has been confirmed for your service booking.',
          type: 'payment',
          related_booking_id: bookingId,
        });
    }
  }

  // TODO: Implement transfer to provider's Stripe account
  // This would happen after service completion
}

async function handlePaymentFailed(paymentIntent: any) {
  const { id: paymentIntentId, metadata } = paymentIntent;
  const { bookingId, customerId } = metadata;

  // Update payment status
  await supabase
    .from('payments')
    .update({ 
      status: 'failed',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_payment_intent_id', paymentIntentId);

  // Update booking status
  await supabase
    .from('service_bookings')
    .update({ 
      payment_status: 'failed',
      updated_at: new Date().toISOString()
    })
    .eq('payment_intent_id', paymentIntentId);

  // Create notification for customer
  if (customerId && bookingId) {
    await supabase
      .from('notifications')
      .insert({
        user_id: customerId,
        title: 'Payment Failed',
        message: 'Your payment could not be processed. Please try again.',
        type: 'payment',
        related_booking_id: bookingId,
      });
  }
}