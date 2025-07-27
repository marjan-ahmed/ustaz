// /app/api/send-otp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const verifySid = process.env.TWILIO_SERVICE_SID!;

const client = twilio(accountSid, authToken);

export async function POST(req: NextRequest) {
  try {
    const { phoneNumber, phoneCountryCode } = await req.json();

    console.log("📞 Sending OTP to:", phoneCountryCode, phoneNumber);

    if (!phoneNumber || !phoneCountryCode) {
      return NextResponse.json({ error: "Phone number and country code required." }, { status: 400 });
    }

    const fullPhone = `${phoneCountryCode}${phoneNumber}`;

    const verification = await client.verify.v2
      .services(verifySid)
      .verifications.create({
        to: fullPhone,
        channel: 'sms',
      });

    console.log("✅ Twilio response:", verification);

    return NextResponse.json({ success: true, status: verification.status });
  } catch (error: any) {
    console.error("❌ Twilio error:", error.message, error.code);
    return NextResponse.json({ error: error.message || "Failed to send OTP." }, { status: 500 });
  }
}
