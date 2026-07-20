import { useState, useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import { supabase } from '@/lib/supabase';

const MIN_INTERVAL_MS = 15_000;
const MIN_MOVE_M = 50;

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6_371_000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function useProviderAlwaysOnLocation(userId: string | null) {
  const [isActive, setIsActive] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const lastSentRef = useRef<{ lat: number; lng: number; t: number } | null>(null);

  const persistToDb = useCallback(async (lat: number, lng: number) => {
    if (!userId) return;
    try {
      await supabase
        .from('ustaz_registrations')
        .update({ location: `POINT(${lng} ${lat})` })
        .eq('userId', userId);
    } catch (e) {
      console.warn('[always-on-location] persist failed', e);
    }
  }, [userId]);

  const startTracking = useCallback(async () => {
    if (!userId || isActive) return;

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission is required to receive nearby service requests.');
        return;
      }

      setError(null);
      setIsActive(true);

      subscriptionRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 50, timeInterval: 15000 },
        (position) => {
          const { latitude: lat, longitude: lng } = position.coords;
          const now = Date.now();
          const last = lastSentRef.current;

          if (last) {
            if (now - last.t < MIN_INTERVAL_MS) return;
            if (haversine(last.lat, last.lng, lat, lng) < MIN_MOVE_M) return;
          }
          lastSentRef.current = { lat, lng, t: now };

          setCurrentLocation({ latitude: lat, longitude: lng });
          persistToDb(lat, lng);
        }
      );
    } catch (err) {
      setError('Location tracking failed. Please check GPS is enabled.');
      setIsActive(false);
    }
  }, [userId, isActive, persistToDb]);

  const stopTracking = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
    setIsActive(false);
  }, []);

  useEffect(() => () => stopTracking(), [stopTracking]);

  return { isActive, currentLocation, error, startTracking, stopTracking };
}
