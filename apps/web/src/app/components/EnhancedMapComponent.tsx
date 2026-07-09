import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  GoogleMap,
  MarkerF,
  useJsApiLoader,
  PolylineF,
  StandaloneSearchBox,
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

interface EnhancedMapComponentProps {
  userLat?: number | null;
  userLng?: number | null;
  providerLat?: number | null;
  providerLng?: number | null;
  providerInfo?: ProviderInfo | null;
  liveLocations?: LiveLocation[]; // Array of historical locations for trail
  onMapLoad?: (map: google.maps.Map) => void;
  onUserLocationChange?: (lat: number, lng: number, address: string) => void; // Callback when user moves marker
  userAddress?: string; // Current address for display
  onAddressChange?: (address: string) => void; // Callback when address changes
  showDraggableUserMarker?: boolean; // Whether to show draggable user marker
}

const containerStyle: React.CSSProperties = {
  width: '100%',
  height: '500px',
};

const centerDefault = {
  lat: 24.8607, // Karachi default
  lng: 67.0011,
};

const EnhancedMapComponent: React.FC<EnhancedMapComponentProps> = ({
  userLat,
  userLng,
  providerLat,
  providerLng,
  providerInfo,
  liveLocations = [],
  onMapLoad,
  onUserLocationChange,
  userAddress,
  onAddressChange,
  showDraggableUserMarker = false,
}) => {
  const [mapRef, setMapRef] = useState<google.maps.Map | null>(null);
  const [address, setAddress] = useState<string>(userAddress || '');
  const [isDragging, setIsDragging] = useState(false);
  const providerMarkerRef = useRef<google.maps.Marker | null>(null);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const animationRef = useRef<number | null>(null);
  const searchBoxRef = useRef<google.maps.places.SearchBox | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
    mapIds: ['bf1b79e73c1a147020354173'], // custom style ID
    libraries: ['places', 'geometry'],
  });

  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<string> => {
    if (!isLoaded || !window.google) return '';

    const geocoder = new window.google.maps.Geocoder();
    const latlng = { lat, lng };

    return new Promise((resolve) => {
      geocoder.geocode({ location: latlng }, (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
        if (status === 'OK' && results && results[0]) {
          resolve(results[0].formatted_address);
        } else {
          console.error('Reverse geocoding failed:', status);
          resolve(`${lat.toFixed(6)}, ${lng.toFixed(6)}`); // Fallback to coordinates
        }
      });
    });
  }, [isLoaded]);

  const handleMarkerDragEnd = useCallback(async (e: google.maps.MapMouseEvent) => {
    if (!e.latLng || !onUserLocationChange) return;

    setIsDragging(false);

    const newLat = e.latLng.lat();
    const newLng = e.latLng.lng();

    // Perform reverse geocoding for the new location
    const newAddress = await reverseGeocode(newLat, newLng);

    // Update the address state
    setAddress(newAddress);

    // Call the parent callback with new coordinates and address
    onUserLocationChange(newLat, newLng, newAddress);

    // Update the address in parent component if provided
    if (onAddressChange) {
      onAddressChange(newAddress);
    }
  }, [onUserLocationChange, onAddressChange, reverseGeocode]);

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

  // Update address when user coordinates change
  useEffect(() => {
    if (userLat != null && userLng != null && isLoaded && !isDragging) {
      reverseGeocode(userLat, userLng).then((addr) => {
        setAddress(addr);
        if (onAddressChange) {
          onAddressChange(addr);
        }
      });
    }
  }, [userLat, userLng, isLoaded, isDragging, reverseGeocode, onAddressChange]);

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
      center={userLat != null && userLng != null ? { lat: userLat, lng: userLng } : centerDefault}
      zoom={userLat != null && userLng != null ? 15 : 13}
      onLoad={onLoad}
      options={{
        mapId: 'bf1b79e73c1a147020354173',
        disableDefaultUI: false,
        zoomControl: true,
        gestureHandling: 'auto',
      }}
    >
      {/* User marker with reverse geocoding */}
      {showDraggableUserMarker && userLat != null && userLng != null && (
        <MarkerF
          position={{ lat: userLat, lng: userLng }}
          label={{
            text: "You",
            fontWeight: "bold",
            fontSize: "14px",
            color: "#ffffff",
          }}
          icon={{
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: "#4F46E5",
            fillOpacity: 1,
            strokeColor: "#FFFFFF",
            strokeWeight: 2,
            scale: 10,
          }}
          draggable={true}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={handleMarkerDragEnd}
          onLoad={(marker) => {
            userMarkerRef.current = marker;
          }}
        />
      )}

      {/* Static user marker (when not draggable) */}
      {!showDraggableUserMarker && userLat != null && userLng != null && (
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

      {/* Display address information */}
      {address && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            backgroundColor: 'white',
            padding: '10px 15px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            maxWidth: '400px',
            textAlign: 'center',
            fontSize: '14px',
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#374151' }}>Current Address</div>
          <div style={{ color: '#6b7280', wordBreak: 'break-word' }}>{address}</div>
        </div>
      )}
    </GoogleMap>
  );
};

export default EnhancedMapComponent;