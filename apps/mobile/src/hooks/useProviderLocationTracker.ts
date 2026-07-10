import { useState, useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import { supabase } from '@/lib/supabase';
import { autoMarkArrivedIfNearby } from '@/lib/ustaz-api';
import type { RealtimeChannel } from '@supabase/supabase-js';

const MIN_MOVE_M = 10;
const MIN_INTERVAL_MS = 2_500;
const DB_PERSIST_MS = 20_000;

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6_371_000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

interface UseProviderLocationTrackerOptions {
  providerId: string;
  requestId: string | null;
  isActive: boolean;
  onLocationUpdate?: (location: { latitude: number; longitude: number }) => void;
  onAutoArrived?: () => void;
}

export function useProviderLocationTracker({
  providerId,
  requestId,
  isActive,
  onLocationUpdate,
  onAutoArrived,
}: UseProviderLocationTrackerOptions) {
  const [isSharing, setIsSharing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const subscribedRef = useRef(false);
  const pendingRef = useRef<{ lat: number; lng: number; ts: number } | null>(null);
  const lastSentRef = useRef<{ lat: number; lng: number; t: number } | null>(null);
  const dbTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const persistToDb = useCallback(async (lat: number, lng: number) => {
    if (!requestId) return;
    try {
      const { error } = await supabase
        .from('live_locations')
        .upsert(
          {
            provider_id: providerId,
            request_id: requestId,
            latitude: lat,
            longitude: lng,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'request_id' },
        );
      if (error) console.warn('[tracker] persist failed', error.message);
      else {
        const arrival = await autoMarkArrivedIfNearby(requestId, providerId, lat, lng);
        if (arrival.arrived) onAutoArrived?.();
      }
    } catch (e) {
      console.warn('[tracker] persist error', e);
    }
  }, [providerId, requestId, onAutoArrived]);

  const stopLocationTracking = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
    if (dbTimerRef.current) {
      clearInterval(dbTimerRef.current);
      dbTimerRef.current = null;
    }
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    subscribedRef.current = false;
    pendingRef.current = null;
    setIsSharing(false);
  }, []);

  const startLocationTracking = useCallback(async () => {
    if (!requestId) {
      setError('No active service request');
      return;
    }

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission is required to share your position.');
        return;
      }

      setError(null);
      setIsSharing(true);

      const channel = supabase.channel(`location-update:${requestId}`, {
        config: { broadcast: { self: false, ack: false } },
      });
      channel.subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          subscribedRef.current = true;
          const queued = pendingRef.current;
          if (queued) {
            pendingRef.current = null;
            channel.send({
              type: 'broadcast',
              event: 'location-update',
              payload: { ...queued, providerId, requestId },
            });
          }
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          subscribedRef.current = false;
        }
      });
      channelRef.current = channel;

      subscriptionRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 10, timeInterval: 2500 },
        (position) => {
          const { latitude: lat, longitude: lng } = position.coords;
          const now = Date.now();
          const last = lastSentRef.current;

          if (last) {
            if (now - last.t < MIN_INTERVAL_MS) return;
            if (haversine(last.lat, last.lng, lat, lng) < MIN_MOVE_M) return;
          }
          lastSentRef.current = { lat, lng, t: now };

          const payload = { lat, lng, ts: now };

          if (subscribedRef.current) {
            channel.send({
              type: 'broadcast',
              event: 'location-update',
              payload: { ...payload, providerId, requestId },
            });
          } else {
            pendingRef.current = payload;
          }

          persistToDb(lat, lng);
          setCurrentLocation({ latitude: lat, longitude: lng });
          setLastUpdateTime(new Date().toLocaleTimeString());
          onLocationUpdate?.({ latitude: lat, longitude: lng });
        }
      );

      dbTimerRef.current = setInterval(() => {
        const last = lastSentRef.current;
        if (last) persistToDb(last.lat, last.lng);
      }, DB_PERSIST_MS);
    } catch (err: any) {
      setError('Location tracking failed. Please check GPS is enabled.');
      setIsSharing(false);
    }
  }, [requestId, providerId, onLocationUpdate, persistToDb, stopLocationTracking]);

  useEffect(() => {
    if (isActive && !isSharing) startLocationTracking();
    else if (!isActive && isSharing) stopLocationTracking();
  }, [isActive]);

  useEffect(() => () => stopLocationTracking(), [stopLocationTracking]);

  return { isSharing, currentLocation, lastUpdateTime, error, startLocationTracking, stopLocationTracking };
}


