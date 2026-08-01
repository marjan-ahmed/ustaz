import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Must match the service_type values the real app writes to ustaz_registrations
// (apps/web/src/app/become-ustaz/page.tsx). NOT the marketing copy in Services.tsx.
const SERVICE_TYPES = [
  "Electrician",
  "Plumbing",
  "Carpentry",
  "AC Maintenance",
  "Solar Technician",
  "CCTV Technician",
  "Room Cooler",
  "Refrigerator Technician",
  "Home Appliances",
  "Automatic Washing Machine Repair",
];

const digits = (v: string) => v.replace(/\D/g, "");

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fullName, phoneNumber, cnic, residency, serviceTypes, source } = body;

    if (!fullName || typeof fullName !== "string" || fullName.trim().length < 2) {
      return NextResponse.json({ error: "Please enter your full name" }, { status: 400 });
    }

    // PK mobile numbers are typed as 03XXXXXXXXX — drop the trunk 0 before the +92.
    const localPhone = digits(String(phoneNumber ?? "")).replace(/^0+/, "");
    if (!/^\d{7,}$/.test(localPhone)) {
      return NextResponse.json({ error: "Please enter a valid phone number" }, { status: 400 });
    }
    const phoneE164 = `+92${localPhone}`;

    const cleanCnic = digits(String(cnic ?? ""));
    if (!/^\d{13}$/.test(cleanCnic)) {
      return NextResponse.json(
        { error: "CNIC must be exactly 13 digits" },
        { status: 400 }
      );
    }

    // Anonymous insert has no other gate, so validate the enum server-side too.
    if (!Array.isArray(serviceTypes) || serviceTypes.length === 0) {
      return NextResponse.json(
        { error: "Please select at least one service" },
        { status: 400 }
      );
    }
    if (serviceTypes.some((s: unknown) => !SERVICE_TYPES.includes(s as string))) {
      return NextResponse.json({ error: "Invalid service selected" }, { status: 400 });
    }

    // Already a real provider? Pre-registration is pointless — send them to login.
    // Most rows store the bare local number, but a few carry a leading 0.
    const { data: liveProvider } = await supabase
      .from("ustaz_registrations")
      .select("userId")
      .in("phoneNumber", [localPhone, `0${localPhone}`])
      .maybeSingle();

    if (liveProvider) {
      return NextResponse.json({
        error:
          "This number is already registered as an Ustaz provider. You can sign in with it once the app launches.",
        alreadyProvider: true,
      }, { status: 409 });
    }

    // Already a real provider by CNIC? Same gate as phone number.
    const { data: liveProviderByCnic } = await supabase
      .from("ustaz_registrations")
      .select("userId")
      .eq("cnic", cleanCnic)
      .maybeSingle();

    if (liveProviderByCnic) {
      return NextResponse.json({
        error:
          "This CNIC is already registered as an Ustaz provider. You can sign in with it once the app launches.",
        alreadyProvider: true,
      }, { status: 409 });
    }

    // Check-then-insert dedupe; the unique index below is the real backstop.
    const { data: existing } = await supabase
      .from("provider_prelaunch_registrations")
      .select("id")
      .eq("phone_e164", phoneE164)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ message: "You're already pre-registered!" });
    }

    // Check CNIC duplicate — same as phone number check.
    const { data: existingCnic } = await supabase
      .from("provider_prelaunch_registrations")
      .select("id")
      .eq("cnic", cleanCnic)
      .maybeSingle();

    if (existingCnic) {
      return NextResponse.json({ message: "You're already pre-registered!" });
    }

    const { error } = await supabase.from("provider_prelaunch_registrations").insert({
      full_name: fullName.trim(),
      cnic: cleanCnic,
      phone_country_code: "+92",
      phone_number: localPhone,
      phone_e164: phoneE164,
      residency: residency?.trim() || null,
      service_types: serviceTypes,
      source: source || "website-provider-form",
    });

    if (error) {
      // Lost the dedupe race — same outcome as an existing row.
      if (error.code === "23505") {
        return NextResponse.json({ message: "You're already pre-registered!" });
      }
      console.error("Provider pre-registration insert error:", error);
      return NextResponse.json(
        { error: "Failed to register. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Registration received!" });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
