// src/lib/supabaseClient.ts
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// This function creates and returns a Supabase client instance.
// It can be used for both client-side (with anon key) and server-side (with service role key) operations.
// The `auth` option `persistSession: false` is important for server-side clients
// to prevent session storage issues.
export function createClient(supabaseUrl: string, supabaseKey: string, options?: any) {
  if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase URL or Key is missing. Please check your environment variables.");
    throw new Error("Supabase client cannot be initialized: Missing URL or Key.");
  }
  return createSupabaseClient(supabaseUrl, supabaseKey, options);
}

// Export a default client for common client-side usage (e.g., in React components)
// This client uses the public ANON key and will persist sessions by default.
// It's recommended to use this for client-side interactions where RLS is enforced.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Note: For server-side operations where you need to bypass RLS (like sending notifications),
// you would use `createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })`
// as demonstrated in your API route.
