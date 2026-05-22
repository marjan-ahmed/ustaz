// Browser-side Supabase client.
// Uses @supabase/ssr's createBrowserClient so the session is stored in cookies
// (not localStorage). This is required so Next.js Route Handlers / Server
// Components can read the session via cookies() and authenticate the user.
import { createBrowserClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Supabase URL or Anon Key is missing. Check your environment variables.');
}

// Default browser client — cookie-backed session, RLS-enforced.
export const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Backwards-compatible factory (still used in a few places).
export function createClient(supabaseUrl: string, supabaseKey: string, options?: any) {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase client cannot be initialized: Missing URL or Key.');
  }
  return createSupabaseClient(supabaseUrl, supabaseKey, options);
}
