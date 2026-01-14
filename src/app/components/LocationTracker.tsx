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
          }, 5000); // every 5 seconds to be less frequent
        },
        (err) => {
          console.error('❌ Geolocation error:', err);
          console.log('⚠️ Attempting to request geolocation permissions again...');

          // Try to get position once more with a prompt for permissions
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const { latitude, longitude } = pos.coords;
              console.log('📍 Got location after error:', latitude, longitude);

              if (intervalRef.current) clearInterval(intervalRef.current);
              intervalRef.current = setInterval(() => {
                updateLocation(latitude, longitude);
              }, 5000); // every 5 seconds
            },
            (getError) => {
              console.error('❌ Unable to get location after retry:', getError);
              // Still try to update with last known coordinates if available elsewhere
            },
            {
              enableHighAccuracy: true,
              maximumAge: 30000, // Use cached position up to 30 seconds old
              timeout: 10000,    // Wait up to 10 seconds for a response
            }
          );
        },
        {
          enableHighAccuracy: true,
          maximumAge: 10000,  // Accept cached position up to 10 seconds old
          timeout: 10000,     // Wait up to 10 seconds for a response
        }
      );
      watchIdRef.current = watchId;
    } else {
      console.error('❌ Geolocation is not supported by this browser');
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
