import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [providersRes, jobsRes, ratingRes, usersRes] = await Promise.all([
      supabase.from("ustaz_registrations").select("userId"),
      supabase.from("service_requests").select("id").eq("status", "completed"),
      supabase.from("ustaz_registrations").select("rating_avg").gt("rating_count", 0),
      supabase.auth.admin.listUsers(),
    ]);

    const totalProviders = providersRes.data?.length ?? 0;
    const completedJobs = jobsRes.data?.length ?? 0;

    const ratings = (ratingRes.data ?? [])
      .map((r) => Number(r.rating_avg))
      .filter((r) => !isNaN(r));
    const avgRating =
      ratings.length > 0
        ? Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1))
        : 0;

    const totalUsers = usersRes.data?.users?.length ?? 0;

    return NextResponse.json({
      providers: totalProviders,
      jobs: completedJobs,
      rating: avgRating,
      users: totalUsers,
    });
  } catch (e) {
    return NextResponse.json(
      { providers: 0, jobs: 0, rating: 0, users: 0 },
      { status: 500 }
    );
  }
}
