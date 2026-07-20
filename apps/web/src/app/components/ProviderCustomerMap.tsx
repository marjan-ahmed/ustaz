'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  GoogleMap,
  useJsApiLoader,
  MarkerF,
  DirectionsRenderer,
} from '@react-google-maps/api';
import { Navigation, Loader2, Expand, X } from 'lucide-react';

interface Props {
  customerLat: number;
  customerLng: number;
  providerLat: number | null;
  providerLng: number | null;
  height?: number;
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

const mapContainerStyle = { width: '100%', borderRadius: '16px', overflow: 'hidden' };
const fullMapContainerStyle = { width: '100%', height: '100%' };

function MapInner({
  customerLat, customerLng, providerLat, providerLng, isLoaded, onLoad,
}: {
  customerLat: number; customerLng: number;
  providerLat: number | null; providerLng: number | null;
  isLoaded: boolean;
  onLoad?: (map: google.maps.Map) => void;
}) {
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);

  const hasProvider = providerLat != null && providerLng != null && Number.isFinite(providerLat) && Number.isFinite(providerLng);
  const hasCustomer = Number.isFinite(customerLat) && Number.isFinite(customerLng);

  const fetchRoute = useCallback(() => {
    if (!hasProvider || !hasCustomer || !isLoaded) return;
    const directionsService = new google.maps.DirectionsService();
    directionsService.route(
      {
        origin: { lat: providerLat!, lng: providerLng! },
        destination: { lat: customerLat, lng: customerLng },
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === 'OK' && result) setDirections(result);
      }
    );
  }, [providerLat, providerLng, customerLat, customerLng, hasProvider, hasCustomer, isLoaded]);

  useEffect(() => { fetchRoute(); }, [fetchRoute]);

  return (
    <GoogleMap
      mapContainerStyle={fullMapContainerStyle}
      center={{ lat: customerLat, lng: customerLng }}
      zoom={14}
      options={{
        disableDefaultUI: true,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
      }}
      onLoad={onLoad}
    >
      <MarkerF
        position={{ lat: customerLat, lng: customerLng }}
        icon={{
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#db4b0d',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 3,
        }}
        title="Customer location"
      />
      {hasProvider && (
        <MarkerF
          position={{ lat: providerLat!, lng: providerLng! }}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#3B82F6',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 3,
          }}
          title="You"
        />
      )}
      {directions && (
        <DirectionsRenderer
          directions={directions}
          options={{
            suppressMarkers: true,
            polylineOptions: { strokeColor: '#3B82F6', strokeWeight: 4, strokeOpacity: 0.8 },
          }}
        />
      )}
    </GoogleMap>
  );
}

export default function ProviderCustomerMap({ customerLat, customerLng, providerLat, providerLng, height = 200 }: Props) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  const [expanded, setExpanded] = useState(false);
  const [loadingRoute, setLoadingRoute] = useState(false);

  const hasProvider = providerLat != null && providerLng != null && Number.isFinite(providerLat) && Number.isFinite(providerLng);
  const hasCustomer = Number.isFinite(customerLat) && Number.isFinite(customerLng);
  const distance = hasProvider && hasCustomer ? haversine(providerLat!, providerLng!, customerLat, customerLng) : null;

  if (loadError) {
    return (
      <div style={{ height, borderRadius: 16, backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p className="text-sm text-gray-500">Map failed to load</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div style={{ height, borderRadius: 16, backgroundColor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <>
      {/* Mini map - clickable */}
      <div
        onClick={() => setExpanded(true)}
        style={{ height, ...mapContainerStyle, position: 'relative', cursor: 'pointer' }}
        className="hover:ring-2 hover:ring-orange-300 transition-all"
      >
        <MapInner
          customerLat={customerLat} customerLng={customerLng}
          providerLat={providerLat} providerLng={providerLng}
          isLoaded={isLoaded}
        />
        {distance != null && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-full shadow-md text-xs font-semibold text-gray-900">
            <Navigation className="w-3 h-3 text-gray-600" />
            {formatDistance(distance)}
          </div>
        )}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/50 px-2 py-1 rounded-lg text-white text-[10px] font-semibold">
          <Expand className="w-3 h-3" />
          Tap to expand
        </div>
      </div>

      {/* Full-screen overlay */}
      {expanded && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <h3 className="font-bold text-lg text-gray-900">Customer Location</h3>
            <button
              onClick={() => setExpanded(false)}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <div className="flex-1">
            <MapInner
              customerLat={customerLat} customerLng={customerLng}
              providerLat={providerLat} providerLng={providerLng}
              isLoaded={isLoaded}
            />
          </div>
        </div>
      )}
    </>
  );
}
