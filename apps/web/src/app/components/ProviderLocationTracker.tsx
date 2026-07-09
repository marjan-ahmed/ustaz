'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../../client/supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { MapPin, Navigation, Clock, Radio, Circle } from 'lucide-react';

interface ProviderLocationTrackerProps {
  providerId: string;
  requestId: string | null;
  isActive: boolean;
  onLocationUpdate?: (location: { latitude: number; longitude: number }) => void;
}

const MIN_MOVE_M = 10;
const MIN_INTERVAL_MS = 2_500;
const DB_PERSIST_MS = 20_000;

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6_371_000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

const ProviderLocationTracker = ({
  providerId,
  requestId,
  isActive,
  onLocationUpdate,
}: ProviderLocationTrackerProps) => {
  const [isSharing, setIsSharing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const subscribedRef = useRef(false);
  const pendingRef = useRef<{ lat: number; lng: number; heading: number | null; speed: number | null; ts: number } | null>(null);
  const lastSentRef = useRef<{ lat: number; lng: number; t: number } | null>(null);
  const dbTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const persistToDb = useCallback(async (lat: number, lng: number) => {
    if (!requestId) return;
    try {
      const res = await fetch('/api/update-provider-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId, requestId, latitude: lat, longitude: lng }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg =
          res.status === 401
            ? 'You are not signed in. Open this tab in an Incognito window and sign in as the provider.'
            : res.status === 403
            ? `Cookie session belongs to ${body.session_user?.slice(0, 8) ?? 'someone else'}, but this request was accepted by ${body.accepted_by_provider_id?.slice(0, 8) ?? 'a different provider'}. Sign out, then sign in as the provider.`
            : `Persist failed (${res.status}): ${body.error ?? 'unknown'}`;
        setError(msg);
        console.error('[tracker] persist failed', res.status, body);
      } else {
        if (error) setError(null);
      }
    } catch (e) {
      console.warn('db persist network error', e);
    }
  }, [providerId, requestId, error]);

  const stopLocationTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
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
    toast.success('Location tracking stopped');
  }, []);

  const startLocationTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    if (!requestId) {
      setError('No active service request');
      toast.error('No active service request');
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
        console.log(`[provider] broadcasting on location-update:${requestId}`);
        // Flush any ping captured before the WebSocket handshake completed.
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

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude: lat, longitude: lng, heading, speed } = position.coords;
        const now = Date.now();
        const last = lastSentRef.current;

        if (last) {
          if (now - last.t < MIN_INTERVAL_MS) return;
          if (haversine(last.lat, last.lng, lat, lng) < MIN_MOVE_M) return;
        }
        lastSentRef.current = { lat, lng, t: now };

        const payload = { lat, lng, heading, speed, ts: now };

        if (subscribedRef.current) {
          channel.send({
            type: 'broadcast',
            event: 'location-update',
            payload: { ...payload, providerId, requestId },
          });
        } else {
          // Subscription handshake still in flight — queue latest ping;
          // it will be flushed when status becomes 'SUBSCRIBED'.
          pendingRef.current = payload;
        }

        // Persist immediately too, so customers joining late see a marker.
        persistToDb(lat, lng);

        setCurrentLocation({ latitude: lat, longitude: lng });
        setLastUpdateTime(new Date().toLocaleTimeString());
        onLocationUpdate?.({ latitude: lat, longitude: lng });
      },
      (err) => {
        setError(`Unable to retrieve your location: ${err.message}`);
        toast.error(`Unable to retrieve your location: ${err.message}`);
        stopLocationTracking();
      },
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 15_000 },
    );

    dbTimerRef.current = setInterval(() => {
      const last = lastSentRef.current;
      if (last) persistToDb(last.lat, last.lng);
    }, DB_PERSIST_MS);

    toast.success('Location tracking started');
  }, [requestId, providerId, onLocationUpdate, persistToDb, stopLocationTracking]);

  useEffect(() => {
    if (isActive && !isSharing) startLocationTracking();
    else if (!isActive && isSharing) stopLocationTracking();
  }, [isActive, isSharing, startLocationTracking, stopLocationTracking]);

  useEffect(() => () => stopLocationTracking(), [stopLocationTracking]);

  return (
    <Card className="shadow-sm border-gray-200">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Location Tracking</CardTitle>
          {isSharing ? (
            <Badge className="bg-green-500 flex items-center"><Radio className="w-4 h-4 mr-1" />Live</Badge>
          ) : (
            <Badge variant="outline" className="flex items-center"><Circle className="w-4 h-4 mr-1" />Inactive</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Live Location Sharing</span>
            <Button
              size="sm"
              variant={isSharing ? 'destructive' : 'default'}
              onClick={isSharing ? stopLocationTracking : startLocationTracking}
            >
              {isSharing ? 'Stop Sharing' : 'Start Sharing'}
            </Button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {currentLocation && (
            <div className="space-y-2">
              <div className="flex items-center text-sm">
                <MapPin className="w-4 h-4 mr-2 text-blue-500" />
                <span className="font-medium">Current Location:</span>
                <span className="ml-2">
                  {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                </span>
              </div>
              {lastUpdateTime && (
                <div className="flex items-center text-sm">
                  <Clock className="w-4 h-4 mr-2 text-gray-500" />
                  <span>Last broadcast: {lastUpdateTime}</span>
                </div>
              )}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center">
            <Navigation className="w-4 h-4 mr-2 text-blue-700 shrink-0" />
            <p className="text-blue-700 text-sm">
              {isSharing
                ? 'Streaming live position via broadcast (≥10 m / ≥2.5 s)'
                : 'Start sharing once you head toward the customer'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProviderLocationTracker;
