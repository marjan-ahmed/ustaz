// Server-side Supabase client for API routes and Server Components.
// Uses @supabase/ssr's getAll/setAll pattern so token refresh works correctly.
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createAuthedClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            try {
              cookieStore.set(name, value, options);
            } catch {
              // `cookieStore.set` may throw in certain contexts (e.g., build-time static generation).
            }
          });
        },
      },
    },
  );
}