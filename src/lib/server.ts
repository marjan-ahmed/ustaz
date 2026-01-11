// Server-side Supabase client for API routes and Server Components
import { createServerClient } from '@supabase/ssr';

export function createClient() {
  // For server-side usage, we create a client with minimal cookie options
  // since cookies are handled differently in API routes
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: () => '',
        set: () => {},
        remove: () => {}
      }
    }
  );
}