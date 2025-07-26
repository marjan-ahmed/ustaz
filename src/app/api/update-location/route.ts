import { NextResponse } from "next/server";
import { supabase } from "../../../../client/supabaseClient";

export async function POST(req: Request) {
  const { userId, latitude, longitude } = await req.json();

  console.log("📩 Received location data:", { userId, latitude, longitude });

  // 1. Get the geography point from custom SQL function
  const { data: geoPoint, error: geoError } = await supabase.rpc("st_setpoint", {
    lng: longitude,
    lat: latitude,
  });

  if (geoError) {
    console.error("❌ Geo point creation error:", geoError.message);
    return NextResponse.json({ error: geoError.message }, { status: 500 });
  }

  console.log("🌍 Geo point from function:", geoPoint);

  // 2. Update the user's location
  const { error } = await supabase
    .from("ustaz_registrations")
    .update({
      location: geoPoint,
    })
    .eq("id", userId); // Make sure this userId matches the `id` column in your table

  if (error) {
    console.error("❌ Supabase update error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log("✅ Location updated successfully");

  return NextResponse.json({ success: true });
}
