import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createAuthedClient } from '@/lib/server';

// Returns the pre-launch registration a provider submitted on the marketing
// website before the app launched, so become-ustaz can prefill the wizard.
//
// The row is linked to this auth user by the claim_prelaunch_provider_registration()
// trigger (matching on phone at signup). provider_prelaunch_registrations has no
// authenticated-SELECT RLS policy by design, so the read goes through the service
// role — but the lookup is always scoped to the session's own user id, never a
// value from the request.
export async function GET() {
  const authed = await createAuthedClient();
  const { data: { user }, error: authErr } = await authed.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[prelaunch-prefill] missing SUPABASE_SERVICE_ROLE_KEY');
    return NextResponse.json({ prefill: null });
  }

  const cookieStore = await cookies();
  const admin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );

  const { data, error } = await admin
    .from('provider_prelaunch_registrations')
    .select('full_name, cnic, residency, service_types')
    .eq('claimed_user_id', user.id)
    .maybeSingle();

  // Never block registration on a prefill miss — an absent row is the normal
  // case for anyone who didn't pre-register.
  if (error) {
    console.error('[prelaunch-prefill] lookup failed', error);
    return NextResponse.json({ prefill: null });
  }
  if (!data) {
    return NextResponse.json({ prefill: null });
  }

  return NextResponse.json({
    prefill: {
      fullName: data.full_name ?? '',
      cnic: data.cnic ?? '',
      residency: data.residency ?? '',
      serviceTypes: data.service_types ?? [],
    },
  });
}
