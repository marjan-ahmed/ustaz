import { useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

async function safeGetSession() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      // Stale token — clear and return null
      await supabase.auth.signOut().catch(() => {});
      return null;
    }
    return data.session;
  } catch {
    return null;
  }
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    safeGetSession().then((s) => {
      if (!mounted) return;
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mounted) return;

      if (event === 'TOKEN_REFRESHED' && nextSession) {
        setSession(nextSession);
        setUser(nextSession.user);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
      } else {
        setSession(nextSession ?? null);
        setUser(nextSession?.user ?? null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    session,
    user,
    loading,
    isSignedIn: !!user,
    signOut: () => supabase.auth.signOut(),
  };
}
