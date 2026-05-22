'use client';

import { useEffect, useRef } from 'react';
import { useGoogleMap } from '@react-google-maps/api';
import type { ProviderPing } from '@/hooks/useProviderLocation';

const ANIM_MS = 1_200;

export function ProviderMarker({
  ping,
  iconUrl = '/icons/ustaz-pin.svg',
}: {
  ping: ProviderPing | null;
  iconUrl?: string;
}) {
  const map = useGoogleMap();
  const markerRef = useRef<google.maps.Marker | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!map || !ping) return;

    if (!markerRef.current) {
      markerRef.current = new google.maps.Marker({
        map,
        position: { lat: ping.lat, lng: ping.lng },
        icon: {
          url: iconUrl,
          scaledSize: new google.maps.Size(44, 44),
          anchor: new google.maps.Point(22, 22),
        },
        optimized: false,
      });
      return;
    }

    const from = markerRef.current.getPosition();
    if (!from) {
      markerRef.current.setPosition({ lat: ping.lat, lng: ping.lng });
      return;
    }

    const fromLat = from.lat();
    const fromLng = from.lng();
    const toLat = ping.lat;
    const toLng = ping.lng;
    const start = performance.now();

    const step = (t: number) => {
      const k = Math.min(1, (t - start) / ANIM_MS);
      const eased = 1 - Math.pow(1 - k, 3);
      markerRef.current!.setPosition({
        lat: fromLat + (toLat - fromLat) * eased,
        lng: fromLng + (toLng - fromLng) * eased,
      });
      if (k < 1) rafRef.current = requestAnimationFrame(step);
    };

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(step);
  }, [map, ping?.lat, ping?.lng, iconUrl]);

  useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      markerRef.current?.setMap(null);
      markerRef.current = null;
    },
    [],
  );

  return null;
}
