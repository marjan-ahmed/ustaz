// app/api/send-otp/route.js
import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

// Initialize Twilio client with environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

const client = twilio(accountSid, authToken);

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, phoneCountryCode } = await request.json();
    const fullPhoneNumber = `${phoneCountryCode}${phoneNumber}`;

    if (!fullPhoneNumber) {
      return NextResponse.json({ success: false, error: 'Phone number is required.' }, { status: 400 });
    }

    const verification = await client.verify.v2.services(verifyServiceSid as string)
      .verifications
      .create({ to: fullPhoneNumber, channel: 'sms' });

    console.log(`OTP send request received for ${fullPhoneNumber}. Status: ${verification.status}`);
    return NextResponse.json({ success: true, message: 'OTP sent successfully!' }, { status: 200 });

  } catch (error: any) {
    console.error('Error sending OTP:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to send OTP.' }, { status: 500 });
  }
}

