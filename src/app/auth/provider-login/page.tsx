'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';
import { supabase } from '../../../../client/supabaseClient';
import PhoneOtpAuth from '@/app/components/PhoneOtpAuth';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';

export default function ProviderLogin() {
  const router = useRouter();
  const { user, isLoaded } = useSupabaseUser();

  useEffect(() => {
    if (!isLoaded || !user) return;
    (async () => {
      const { data } = await supabase
        .from('ustaz_registrations')
        .select('userId')
        .eq('userId', user.id)
        .maybeSingle();
      router.replace(data ? '/dashboard' : '/become-ustaz');
    })();
  }, [isLoaded, user, router]);

  async function handleSuccess(userId: string) {
    const { data } = await supabase
      .from('ustaz_registrations')
      .select('userId')
      .eq('userId', userId)
      .maybeSingle();
    router.replace(data ? '/dashboard' : '/become-ustaz');
  }

  return (
    <>
      <Header />
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-16">
        <PhoneOtpAuth
          title="Provider sign-in"
          subtitle="Verify your phone to access your Ustaz dashboard."
          onSuccess={handleSuccess}
        />
      </main>
      <Footer />
    </>
  );
}
