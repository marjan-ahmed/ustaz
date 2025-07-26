// hooks/useSupabaseUser.ts
import { useState, useEffect } from 'react';
import { supabase } from '../../client/supabaseClient';
import { User } from '@supabase/supabase-js';

export function useSupabaseUser() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      setUser(data?.user || null);
      setIsLoaded(true);
    };

    fetchUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isSignedIn = !!user;

  return { user, isSignedIn, isLoaded };
}