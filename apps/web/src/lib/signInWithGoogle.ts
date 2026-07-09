'use client';

import { supabase } from '../../client/supabaseClient';
import { getAuthCallbackUrl } from '@/lib/auth-redirect';

export async function signInWithGoogle(next: string = '/dashboard') {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: getAuthCallbackUrl(next),
      queryParams: { access_type: 'offline', prompt: 'consent' },
    },
  });
  if (error) throw error;
}
