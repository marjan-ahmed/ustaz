import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '../../../../../client/supabaseClient';
// import twilio from 'twilio'; // Uncomment when you have Twilio credentials

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { bookingId, calleeUserId } = await request.json();

    if (!bookingId || !calleeUserId) {
      return NextResponse.json(
        { error: 'Missing required fields: bookingId, calleeUserId' },
        { status: 400 }
      );
    }

    // Verify the booking exists and user is authorized
    const { data: booking, error: bookingError } = await supabase
      .from('service_bookings')
      .select('customer_id, provider_id, service_providers!inner(user_id)')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if user is authorized to make this call
    const isCustomer = booking.customer_id === userId;
    const isProvider = booking.service_providers?.user_id === userId;

    if (!isCustomer && !isProvider) {
      return NextResponse.json(
        { error: 'Unauthorized to make this call' },
        { status: 403 }
      );
    }

    // Get callee's phone number (in a real app, this would be from user profiles)
    const { data: calleeProfile, error: calleeError } = await supabase
      .from('user_profiles')
      .select('phone_number, phone_country_code')
      .eq('user_id', calleeUserId)
      .single();

    if (calleeError || !calleeProfile?.phone_number) {
      return NextResponse.json(
        { error: 'Callee phone number not found' },
        { status: 404 }
      );
    }

    // For demo purposes, return a masked number
    // In production, you would:
    // 1. Use Twilio to create a proxy number
    // 2. Set up a conference call with both parties
    // 3. Record the call ID for tracking

    /*
    // Twilio implementation (uncomment when you have credentials):
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const proxyService = await client.proxy.services(process.env.TWILIO_PROXY_SERVICE_SID);
    
    const session = await proxyService.sessions.create({
      uniqueName: `booking-${bookingId}-${Date.now()}`,
      mode: 'voice-and-message',
    });

    // Add participants
    await session.participants.create({
      identifier: `+${booking.customer_phone}`,
      friendlyName: 'Customer',
    });

    await session.participants.create({
      identifier: `+${calleeProfile.phone_country_code}${calleeProfile.phone_number}`,
      friendlyName: 'Provider',
    });
    */

    // Generate a masked number for demo
    const maskedNumber = `+92-XXX-${Math.floor(Math.random() * 9000) + 1000}`;

    // Log the call attempt
    await supabase
      .from('chat_messages')
      .insert({
        booking_id: bookingId,
        sender_id: userId,
        message_text: `${isCustomer ? 'Customer' : 'Provider'} initiated a voice call`,
        message_type: 'system',
      });

    // In production, you would return the actual Twilio proxy number
    return NextResponse.json({
      success: true,
      maskedNumber,
      message: 'Call initiated successfully',
      // sessionId: session.sid, // From Twilio
    });

  } catch (error) {
    console.error('Error initiating call:', error);
    return NextResponse.json(
      { error: 'Failed to initiate call' },
      { status: 500 }
    );
  }
}