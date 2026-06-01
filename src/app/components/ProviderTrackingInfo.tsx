'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Phone, MessageSquare, Clock, Navigation, MapPin, Star, Briefcase,
  Loader2, CheckCircle2, Radio, Wrench, ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '../../../client/supabaseClient';

interface ProviderInfo {
  user_id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  phoneCountryCode: string;
  email?: string;
}

interface LiveLocation {
  latitude: number;
  longitude: number;
  updated_at: string;
}

interface ProviderTrackingInfoProps {
  userLat: number | null;
  userLng: number | null;
  provider: ProviderInfo | null;
  liveLocation: LiveLocation | null;
  /** Current service request status (drives the headline badge) */
  status?: string;
  onRequestChat: () => void;
  onCallProvider: () => void;
}

type StatusMeta = {
  label: string;
  sub: string;
  bg: string;
  ring: string;
  icon: React.ComponentType<{ className?: string }>;
};

const STATUS_META: Record<string, StatusMeta> = {
  accepted:          { label: 'Accepted',        sub: 'Provider has accepted your request',  bg: 'bg-amber-500',   ring: 'ring-amber-200',  icon: CheckCircle2 },
  provider_enroute:  { label: 'On the way',      sub: 'Provider is heading to your location', bg: 'bg-blue-500',    ring: 'ring-blue-200',   icon: Navigation },
  arriving:          { label: 'Arriving soon',   sub: 'Almost there',                          bg: 'bg-indigo-500',  ring: 'ring-indigo-200', icon: Navigation },
  arrived:           { label: 'Arrived',         sub: 'Provider has reached your location',    bg: 'bg-green-600',   ring: 'ring-green-200',  icon: MapPin },
  in_progress:       { label: 'Service ongoing', sub: 'Work is in progress',                   bg: 'bg-orange-500',  ring: 'ring-orange-200', icon: Wrench },
  work_in_progress:  { label: 'Service ongoing', sub: 'Work is in progress',                   bg: 'bg-orange-500',  ring: 'ring-orange-200', icon: Wrench },
  completed:         { label: 'Completed',       sub: 'Service is complete',                   bg: 'bg-emerald-600', ring: 'ring-emerald-200', icon: CheckCircle2 },
};

// Reverse-geocoding cache (module-level survives re-renders)
const addrCache = new Map<string, string>();
const keyFor = (lat: number, lng: number) =>
  `${lat.toFixed(4)},${lng.toFixed(4)}`; // ~11 m precision

const ProviderTrackingInfo: React.FC<ProviderTrackingInfoProps> = ({
  userLat, userLng, provider, liveLocation, status, onRequestChat, onCallProvider,
}) => {
  const [distance, setDistance] = useState<number | null>(null);
  const [eta, setEta] = useState<number | null>(null);
  const [providerRating, setProviderRating] = useState<{ avg: number; count: number; jobs: number } | null>(null);
  const [ratingLoading, setRatingLoading] = useState(true);
  const [address, setAddress] = useState<string | null>(null);
  const [addrLoading, setAddrLoading] = useState(false);
  const lastGeoKey = useRef<string | null>(null);

  // Distance + ETA
  useEffect(() => {
    if (userLat == null || userLng == null || liveLocation == null) {
      setDistance(null); setEta(null); return;
    }
    if ([userLat, userLng, liveLocation.latitude, liveLocation.longitude].some(isNaN)) {
      setDistance(null); setEta(null); return;
    }
    const R = 6371;
    const dLat = (liveLocation.latitude - userLat) * Math.PI / 180;
    const dLon = (liveLocation.longitude - userLng) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(userLat * Math.PI / 180) * Math.cos(liveLocation.latitude * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
    const km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    setDistance(parseFloat(km.toFixed(2)));
    setEta(Math.max(1, Math.round((km / 30) * 60)));
  }, [userLat, userLng, liveLocation]);

  // Provider rating
  useEffect(() => {
    if (!provider?.user_id) return;
    let cancelled = false;
    setRatingLoading(true);
    (async () => {
      try {
        const { data } = await supabase.rpc('get_provider_stats', { p_provider_id: provider.user_id });
        if (cancelled) return;
        const row = Array.isArray(data) ? data[0] : data;
        if (row) {
          setProviderRating({
            avg: row.avg_rating || 0,
            count: row.total_ratings || 0,
            jobs: row.completed_jobs || 0,
          });
        }
      } finally {
        if (!cancelled) setRatingLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [provider?.user_id]);

  // Reverse-geocode lat/lng → human address (debounced + cached)
  useEffect(() => {
    if (!liveLocation) { setAddress(null); return; }
    const key = keyFor(liveLocation.latitude, liveLocation.longitude);
    if (lastGeoKey.current === key) return; // already done for these coords
    if (addrCache.has(key)) { setAddress(addrCache.get(key)!); lastGeoKey.current = key; return; }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) { setAddress(null); return; }

    let cancelled = false;
    const handle = window.setTimeout(async () => {
      try {
        setAddrLoading(true);
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${liveLocation.latitude},${liveLocation.longitude}&key=${apiKey}`,
        );
        const json = await res.json();
        const formatted = json?.results?.[0]?.formatted_address as string | undefined;
        if (cancelled) return;
        if (formatted) {
          addrCache.set(key, formatted);
          lastGeoKey.current = key;
          setAddress(formatted);
        } else {
          setAddress(null);
        }
      } catch {
        if (!cancelled) setAddress(null);
      } finally {
        if (!cancelled) setAddrLoading(false);
      }
    }, 600);

    return () => { cancelled = true; window.clearTimeout(handle); };
  }, [liveLocation]);

  if (!provider) return null;

  const meta: StatusMeta =
    (status && STATUS_META[status]) ||
    (liveLocation
      ? STATUS_META.provider_enroute
      : STATUS_META.accepted);
  const StatusIcon = meta.icon;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200 shadow-sm bg-white mb-4">
      {/* Headline strip */}
      <div className={`relative ${meta.bg} text-white px-5 py-4`}>
        <div className="absolute inset-0 bg-gradient-to-r from-black/0 via-white/10 to-black/0 pointer-events-none" />
        <div className="relative flex items-center gap-3">
          <div className={`shrink-0 w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center ring-4 ${meta.ring} ring-opacity-40`}>
            <StatusIcon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg leading-tight truncate">{meta.label}</h3>
              {liveLocation && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-white/20 backdrop-blur px-2 py-0.5 rounded-full">
                  <span className="relative flex w-1.5 h-1.5">
                    <span className="absolute inset-0 rounded-full bg-white opacity-75 animate-ping" />
                    <span className="relative rounded-full bg-white w-1.5 h-1.5" />
                  </span>
                  Live
                </span>
              )}
            </div>
            <p className="text-white/90 text-xs mt-0.5 truncate">{meta.sub}</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Provider identity */}
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 border-2 border-white shadow flex items-center justify-center">
              <span className="font-bold text-[#a93a0b] text-lg">
                {provider.firstName.charAt(0)}{provider.lastName.charAt(0)}
              </span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white shadow flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5 text-[#db4b0d]" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-lg text-gray-900 truncate">
              {provider.firstName} {provider.lastName}
            </h3>
            <p className="text-xs text-gray-500 mb-1.5">Verified Ustaz</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {ratingLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />
              ) : providerRating ? (
                <>
                  <div className="inline-flex items-center text-xs">
                    <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 mr-1" />
                    <span className="font-bold text-gray-900">{providerRating.avg.toFixed(1)}</span>
                    <span className="text-gray-400 ml-1">({providerRating.count})</span>
                  </div>
                  <div className="inline-flex items-center text-xs text-gray-600">
                    <Briefcase className="h-3.5 w-3.5 mr-1" />
                    <span className="font-medium">{providerRating.jobs}</span>
                    <span className="ml-1">job{providerRating.jobs !== 1 ? 's' : ''}</span>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>

        {/* Live stats grid */}
        {liveLocation && (
          <div className="grid grid-cols-2 gap-2.5">
            {eta !== null && (
              <div className="relative col-span-2 sm:col-span-1 rounded-xl p-3.5 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
                <div className="flex items-center text-[11px] uppercase tracking-wider font-bold text-green-700 mb-1">
                  <Clock className="w-3.5 h-3.5 mr-1.5" />
                  ETA
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-green-800 leading-none">{eta}</span>
                  <span className="text-sm font-semibold text-green-700">min</span>
                </div>
              </div>
            )}

            {distance !== null && (() => {
              const useMeters = distance < 1;
              const value = useMeters ? Math.round(distance * 1000) : distance;
              const unit = useMeters ? 'm' : 'km';
              return (
                <div className="relative col-span-2 sm:col-span-1 rounded-xl p-3.5 bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-100">
                  <div className="flex items-center text-[11px] uppercase tracking-wider font-bold text-blue-700 mb-1">
                    <Navigation className="w-3.5 h-3.5 mr-1.5" />
                    Distance
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-blue-800 leading-none">{value}</span>
                    <span className="text-sm font-semibold text-blue-700">{unit}</span>
                  </div>
                </div>
              );
            })()}

            <div className="col-span-2 rounded-xl p-3.5 bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center text-[11px] uppercase tracking-wider font-bold text-gray-600">
                  <MapPin className="w-3.5 h-3.5 mr-1.5" />
                  Current location
                </div>
                <div className="flex items-center text-[10px] text-gray-500">
                  <Radio className="w-3 h-3 mr-1 text-green-500" />
                  {new Date(liveLocation.updated_at).toLocaleTimeString([], {
                    hour: '2-digit', minute: '2-digit',
                  })}
                </div>
              </div>
              {addrLoading && !address ? (
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Locating address…
                </div>
              ) : address ? (
                <p className="text-sm font-medium text-gray-900 leading-snug">{address}</p>
              ) : (
                <p className="text-sm font-mono text-gray-700">
                  {liveLocation.latitude.toFixed(5)}, {liveLocation.longitude.toFixed(5)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2.5 pt-1">
          <Button
            className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow-sm h-11"
            onClick={onCallProvider}
          >
            <Phone className="w-4 h-4 mr-2" />
            Call
          </Button>
          <Button
            variant="outline"
            className="flex-1 h-11 border-gray-200 hover:border-[#db4b0d] hover:text-[#db4b0d]"
            onClick={onRequestChat}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Chat
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProviderTrackingInfo;
