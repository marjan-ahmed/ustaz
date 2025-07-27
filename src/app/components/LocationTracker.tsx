'use client';

import { useEffect, useRef } from 'react';

type Props = {
  userId: string;
};

export default function LocationTracker({ userId }: Props) {
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!userId) return;

    const updateLocation = async (lat: number, lng: number) => {
      try {
        const res = await fetch('/api/update-location', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId, latitude: lat, longitude: lng }),
        });

        if (!res.ok) {
          const err = await res.json();
          console.error('❌ Failed to update location:', err);
        }
      } catch (error) {
        console.error('❌ Error sending location:', error);
      }
    };

    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          console.log('📍 Tracked:', latitude, longitude);

          if (intervalRef.current) clearInterval(intervalRef.current);
          intervalRef.current = setInterval(() => {
            updateLocation(latitude, longitude);
          }, 3000); // every 3 seconds
        },
        (err) => {
          console.error('❌ Geolocation error:', err);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 5000,
        }
      );
      watchIdRef.current = watchId;
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [userId]);

  return null;
}
