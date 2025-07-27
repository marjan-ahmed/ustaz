// /app/api/verify-otp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const verifySid = process.env.TWILIO_SERVICE_SID!;
const client = twilio(accountSid, authToken);

export async function POST(req: NextRequest) {
  const { phoneNumber, phoneCountryCode, otp } = await req.json();

  if (!phoneNumber || !phoneCountryCode || !otp) {
    return NextResponse.json({ error: "Phone number, country code, and OTP are required." }, { status: 400 });
  }

  const fullPhone = `${phoneCountryCode}${phoneNumber}`;

  try {
    const verificationCheck = await client.verify.v2
      .services(verifySid)
      .verificationChecks.create({ to: fullPhone, code: otp });

    if (verificationCheck.status === 'approved') {
      return NextResponse.json({ success: true, message: 'OTP verified successfully.' });
    } else {
      return NextResponse.json({ success: false, message: 'Invalid OTP.' }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Verify OTP error:", error.message);
    return NextResponse.json({ error: "OTP verification failed." }, { status: 500 });
  }
}
