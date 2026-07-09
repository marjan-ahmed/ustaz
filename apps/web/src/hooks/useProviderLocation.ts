'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../client/supabaseClient';

export type ProviderPing = {
  lat: number;
  lng: number;
  heading?: number | null;
  speed?: number | null;
  ts: number;
};

export function useProviderLocation(requestId: string | null) {
  const [ping, setPing] = useState<ProviderPing | null>(null);
  const [stale, setStale] = useState(false);
  const seededRef = useRef(false);

  useEffect(() => {
    if (!requestId) return;
    seededRef.current = false;

    supabase
      .from('live_locations')
      .select('latitude, longitude, updated_at')
      .eq('request_id', requestId)
      .maybeSingle()
      .then(({ data }) => {
        if (data && !seededRef.current) {
          seededRef.current = true;
          setPing({
            lat: data.latitude,
            lng: data.longitude,
            ts: new Date(data.updated_at).getTime(),
          });
        }
      });

    const channel = supabase
      .channel(`location-update:${requestId}`, { config: { broadcast: { self: false } } })
      .on('broadcast', { event: 'location-update' }, ({ payload }) => {
        seededRef.current = true;
        setPing(payload as ProviderPing);
        setStale(false);
      })
      .subscribe();

    const staleTimer = setInterval(() => {
      setPing((p) => {
        if (p && Date.now() - p.ts > 30_000) setStale(true);
        return p;
      });
    }, 5_000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(staleTimer);
    };
  }, [requestId]);

  return { ping, stale };
}
