'use client';

import { useEffect, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function LocationTracker() {
  const supabase = createClientComponentClient();
  const watchIdRef = useRef<number | null>(null);

  const updateLocation = async (lat: number, lng: number) => {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const res = await fetch('/api/update-location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          latitude: lat,
          longitude: lng,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error('Failed to update location:', err);
      }
    }
  };

  useEffect(() => {
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          console.log('📍 Live location:', { latitude, longitude });
          updateLocation(latitude, longitude);
        },
        (err) => {
          console.error('❌ Error getting position:', err);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 10000,
          timeout: 5000,
        }
      );
      watchIdRef.current = watchId;
    } else {
      console.warn('⚠️ Geolocation is not supported by this browser.');
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return null; // no UI
}
