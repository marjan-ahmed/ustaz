// app/api/save-push-subscription/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/server';

export async function POST(req: NextRequest) {
  try {
    const { subscription, userId } = await req.json();

    if (!subscription || !userId) {
      return NextResponse.json(
        { error: 'Subscription and userId are required' },
        { status: 400 }
      );
    }

    // Store the subscription in your database
    // For now, I'll show how you'd do this with Supabase
    // You'll need to adapt this to your specific database setup

    // Example with Supabase:
    /*
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('user_push_subscriptions') // You'd need to create this table
      .insert({
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh_key: subscription.keys.p256dh,
        auth_key: subscription.keys.auth,
        created_at: new Date().toISOString()
      })
      .select();

    if (error) {
      console.error('Error saving push subscription:', error);
      return NextResponse.json(
        { error: 'Failed to save subscription' },
        { status: 500 }
      );
    }
    */

    // For now, just return success
    return NextResponse.json({
      message: 'Subscription saved successfully',
      subscriptionId: 'temp-id' // Replace with actual ID from DB
    });
  } catch (error: any) {
    console.error('Error in save-push-subscription API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}