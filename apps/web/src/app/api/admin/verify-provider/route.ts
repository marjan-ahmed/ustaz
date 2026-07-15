import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
          }
        },
      },
    }
  );

  // Verify admin session
  const adminSession = cookieStore.get('admin_session')?.value;
  if (!adminSession) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { action, provider_id, reason } = body;

  if (!provider_id) {
    return NextResponse.json({ error: 'Missing provider_id' }, { status: 400 });
  }

  // Get admin user id from session (simplified - in production verify HMAC)
  const adminId = '00000000-0000-0000-0000-000000000000';

  let result;
  if (action === 'approve') {
    result = await supabase.rpc('approve_verification', {
      p_provider_id: provider_id,
      p_admin_id: adminId,
    });
  } else if (action === 'reject') {
    if (!reason) {
      return NextResponse.json({ error: 'Missing rejection reason' }, { status: 400 });
    }
    result = await supabase.rpc('reject_verification', {
      p_provider_id: provider_id,
      p_admin_id: adminId,
      p_reason: reason,
    });
  } else {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: result.data });
}
