// app/api/verify-otp/route.js
import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

// Initialize Twilio client with environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

const client = twilio(accountSid, authToken);

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, phoneCountryCode, otp } = await request.json();
    const fullPhoneNumber = `${phoneCountryCode}${phoneNumber}`;

    if (!fullPhoneNumber || !otp) {
      return NextResponse.json({ success: false, error: 'Phone number and OTP are required.' }, { status: 400 });
    }

    if (!verifyServiceSid) {
      return NextResponse.json({ success: false, error: 'Twilio Verify Service SID is not configured.' }, { status: 500 });
    }
    const verificationCheck = await client.verify.v2.services(verifyServiceSid as string)
      .verificationChecks
      .create({ to: fullPhoneNumber, code: otp });

    if (verificationCheck.status === 'approved') {
      console.log(`OTP verified successfully for ${fullPhoneNumber}.`);
      return NextResponse.json({ success: true, message: 'Phone number verified successfully!' }, { status: 200 });
    } else {
      console.warn(`OTP verification failed for ${fullPhoneNumber}. Status: ${verificationCheck.status}`);
      return NextResponse.json({ success: false, error: 'Invalid OTP. Please try again.' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to verify OTP.' }, { status: 500 });
  }
}
