import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  GoogleMap,
  MarkerF,
  useJsApiLoader,
  PolylineF,
} from '@react-google-maps/api';

type ProviderInfo = {
  firstName?: string;
  lastName?: string;
  // add any other fields you need
};

interface LiveLocation {
  latitude: number;
  longitude: number;
  timestamp: string;
}

interface MapComponentProps {
  userLat?: number | null;
  userLng?: number | null;
  providerLat?: number | null;
  providerLng?: number | null;
  providerInfo?: ProviderInfo | null;
  liveLocations?: LiveLocation[]; // Array of historical locations for trail
  onMapLoad?: (map: google.maps.Map) => void;
}

const containerStyle: React.CSSProperties = {
  width: '100%',
  height: '500px',
};

const centerDefault = {
  lat: 24.8607, // Karachi default
  lng: 67.0011,
};

const MapComponent: React.FC<MapComponentProps> = ({
  userLat,
  userLng,
  providerLat,
  providerLng,
  providerInfo,
  liveLocations = [],
  onMapLoad,
}) => {
  const [mapRef, setMapRef] = useState<google.maps.Map | null>(null);
  const providerMarkerRef = useRef<google.maps.Marker | null>(null);
  const animationRef = useRef<number | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
    mapIds: ['bf1b79e73c1a147020354173'], // custom style ID
    libraries: ['places', 'geometry'],
  });

  const onLoad = useCallback((map: google.maps.Map): void => {
    setMapRef(map);
    if (onMapLoad) {
      onMapLoad(map);
    }
  }, [onMapLoad]);

  // Animate provider marker movement smoothly
  useEffect(() => {
    if (mapRef && providerLat != null && providerLng != null && providerMarkerRef.current) {
      const newPosition = new window.google.maps.LatLng(providerLat, providerLng);

      // Smoothly move the marker to the new position
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      const start = Date.now();
      const duration = 1000; // Animation duration in ms
      const startPosition = providerMarkerRef.current.getPosition();

      if (startPosition) {
        const startPos = { lat: startPosition.lat(), lng: startPosition.lng() };

        const animate = () => {
          const now = Date.now();
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);

          // Use easing function for smoother animation
          const easeProgress = 1 - Math.pow(1 - progress, 3);

          const currentLat = startPos.lat + (providerLat - startPos.lat) * easeProgress;
          const currentLng = startPos.lng + (providerLng - startPos.lng) * easeProgress;

          providerMarkerRef.current?.setPosition(new window.google.maps.LatLng(currentLat, currentLng));

          if (progress < 1) {
            animationRef.current = requestAnimationFrame(animate);
          }
        };

        animationRef.current = requestAnimationFrame(animate);
      } else {
        providerMarkerRef.current.setPosition(newPosition);
      }
    }
  }, [providerLat, providerLng, mapRef]);

  useEffect(() => {
    if (mapRef && userLat != null && userLng != null) {
      const bounds = new window.google.maps.LatLngBounds();

      // Add user position to bounds
      bounds.extend(new window.google.maps.LatLng(userLat, userLng));

      // Add provider position to bounds if available
      if (providerLat != null && providerLng != null) {
        bounds.extend(new window.google.maps.LatLng(providerLat, providerLng));
      }

      // Add live locations to bounds if available
      if (liveLocations && liveLocations.length > 0) {
        liveLocations.forEach(loc => {
          bounds.extend(new window.google.maps.LatLng(loc.latitude, loc.longitude));
        });
      }

      // Only fit bounds if there are positions to show
      if (bounds.getNorthEast().lat() !== bounds.getSouthWest().lat() ||
          bounds.getNorthEast().lng() !== bounds.getSouthWest().lng()) {
        mapRef.fitBounds(bounds);

        // Add padding to prevent markers from being at the edge
        setTimeout(() => {
          mapRef.fitBounds(bounds, 50); // 50px padding
        }, 100);
      }
    }
  }, [mapRef, userLat, userLng, providerLat, providerLng, liveLocations]);

  if (loadError) {
    return <div className="bg-gray-100 p-4 rounded-lg border border-gray-300">
      <p className="text-red-600 font-medium">Map loading error:</p>
      <p className="text-sm text-gray-600 mt-1">Google Maps failed to load. This may be due to API configuration issues.</p>
      <p className="text-xs text-gray-500 mt-1">Please ensure billing is enabled for your Google Maps API key.</p>
    </div>;
  }

  if (!isLoaded) return <div>Loading map…</div>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={centerDefault}
      zoom={13}
      onLoad={onLoad}
      options={{
        mapId: 'bf1b79e73c1a147020354173',
        disableDefaultUI: false,
        zoomControl: true,
      }}
    >
      {/* User marker */}
      {userLat != null && userLng != null && (
        <MarkerF
          position={{ lat: userLat, lng: userLng }}
          label="You"
          icon={{
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: "#4F46E5",
            fillOpacity: 1,
            strokeColor: "#FFFFFF",
            strokeWeight: 2,
            scale: 8,
          }}
        />
      )}

      {/* Provider path/trail */}
      {liveLocations && liveLocations.length > 1 && (
        <PolylineF
          path={liveLocations.map(loc => ({ lat: loc.latitude, lng: loc.longitude }))}
          options={{
            geodesic: true,
            strokeColor: "#3B82F6",
            strokeOpacity: 0.6,
            strokeWeight: 4,
          }}
        />
      )}

      {/* Provider marker with smooth animation */}
      {providerLat != null && providerLng != null && (
        <MarkerF
          position={{ lat: providerLat, lng: providerLng }}
          label={providerInfo?.firstName ? `${providerInfo.firstName} ${providerInfo.lastName || ''}` : 'Provider'}
          icon={{
            path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            fillColor: "#10B981",
            fillOpacity: 1,
            strokeColor: "#FFFFFF",
            strokeWeight: 2,
            scale: 8,
            rotation: 0, // This will be updated based on direction of movement
          }}
          onLoad={(marker) => {
            providerMarkerRef.current = marker;
          }}
        />
      )}
    </GoogleMap>
  );
};

export default MapComponent;
