import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

const POLL_INTERVAL_MS = 5_000;

interface LiveLocation {
  latitude: number;
  longitude: number;
  updated_at: string;
}

export function useCustomerLocationSubscription(requestId: string | null) {
  const [providerLocation, setProviderLocation] = useState<LiveLocation | null>(null);
  const [isLive, setIsLive] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pollLiveLocation = useCallback(async () => {
    if (!requestId) return;
    try {
      const { data } = await supabase
        .from('live_locations')
        .select('latitude, longitude, updated_at')
        .eq('request_id', requestId)
        .maybeSingle();
      if (data && Number.isFinite(data.latitude) && Number.isFinite(data.longitude)) {
        setProviderLocation({
          latitude: data.latitude,
          longitude: data.longitude,
          updated_at: data.updated_at,
        });
        setIsLive(true);
      }
    } catch {}
  }, [requestId]);

  useEffect(() => {
    if (!requestId) return;

    const channel = supabase.channel(`location-update:${requestId}`);
    channel.on('broadcast', { event: 'location-update' }, (payload) => {
      const data = payload.payload as { lat?: number; lng?: number; latitude?: number; longitude?: number; ts?: number };
      const latitude = data.lat ?? data.latitude;
      const longitude = data.lng ?? data.longitude;
      if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        setProviderLocation({
          latitude: latitude as number,
          longitude: longitude as number,
          updated_at: new Date(data.ts ?? Date.now()).toISOString(),
        });
        setIsLive(true);
      }
    });
    channel.subscribe();
    channelRef.current = channel;

    pollLiveLocation();
    pollRef.current = setInterval(pollLiveLocation, POLL_INTERVAL_MS);

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [requestId, pollLiveLocation]);

  return { providerLocation, isLive };
}
