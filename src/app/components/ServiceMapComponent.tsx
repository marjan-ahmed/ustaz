import React, { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import {
  GoogleMap,
  MarkerF,
  useJsApiLoader,
  PolylineF,
  CircleF,
} from '@react-google-maps/api';

type ProviderInfo = {
  firstName?: string;
  lastName?: string;
};

interface LiveLocation {
  latitude: number;
  longitude: number;
  timestamp?: string;
  updated_at?: string;
}

interface ServiceMapComponentProps {
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
  searchPhase?: 'address_selection' | 'finding_providers' | 'provider_accepted'; // Current search phase
  onRouteCalculated?: (route: google.maps.LatLngLiteral[]) => void; // Callback when route is calculated
}

const containerStyle: React.CSSProperties = {
  width: '100%',
  height: '500px',
};

const centerDefault = {
  lat: 24.8607, // Karachi default
  lng: 67.0011,
};

const ServiceMapComponent: React.FC<ServiceMapComponentProps> = React.memo(({
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
  searchPhase = 'address_selection',
  onRouteCalculated,
}) => {
  const [mapRef, setMapRef] = useState<google.maps.Map | null>(null);
  const [address, setAddress] = useState<string>(userAddress || '');
  const [isDragging, setIsDragging] = useState(false);
  const providerMarkerRef = useRef<google.maps.Marker | null>(null);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const animationRef = useRef<number | null>(null);
  const circleAnimationRef = useRef<number | null>(null);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<google.maps.LatLngLiteral[]>([]);
  const [circleRadius, setCircleRadius] = useState<number>(0);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
    mapIds: ['bf1b79e73c1a147020354173'], // custom style ID
    libraries: ['places', 'geometry', 'routes'],
  });

  // Initialize directions service when map loads
  useEffect(() => {
    if (isLoaded && window.google) {
      directionsServiceRef.current = new window.google.maps.DirectionsService();
    }
  }, [isLoaded]);

  // Calculate route when provider location changes and we're in the accepted phase
  useEffect(() => {
    if (
      isLoaded &&
      mapRef &&
      directionsServiceRef.current &&
      searchPhase === 'provider_accepted' &&
      userLat != null &&
      userLng != null &&
      providerLat != null &&
      providerLng != null
    ) {
      const request: google.maps.DirectionsRequest = {
        origin: { lat: providerLat, lng: providerLng },
        destination: { lat: userLat, lng: userLng },
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: false,
      };

      directionsServiceRef.current.route(request, (result, status) => {
        if (status === 'OK' && result && result.routes[0]) {
          const route = result.routes[0].overview_path.map(point => ({
            lat: point.lat(),
            lng: point.lng()
          }));

          setRouteCoordinates(route);
          if (onRouteCalculated) {
            onRouteCalculated(route);
          }
        } else {
          console.error('Directions request failed due to ' + status);
          setRouteCoordinates([]);
        }
      });
    }
  }, [isLoaded, mapRef, providerLat, providerLng, userLat, userLng, searchPhase, onRouteCalculated]);

  // Animate pulsing circle during finding providers phase (until provider accepts)
  useEffect(() => {
    if (searchPhase === 'finding_providers' && userLat != null && userLng != null) {
      const animateCircle = () => {
        let currentRadius = circleRadius;
        const maxRadius = 200; // meters - much smaller radius
        const increment = 2; // meters per frame - smoother animation

        currentRadius += increment;
        if (currentRadius > maxRadius) {
          currentRadius = 50; // Start from a small radius instead of 0 for continuous pulse
        }

        setCircleRadius(currentRadius);
        circleAnimationRef.current = requestAnimationFrame(animateCircle);
      };

      circleAnimationRef.current = requestAnimationFrame(animateCircle);
    } else {
      // Stop animation when not in finding phase
      if (circleAnimationRef.current) {
        cancelAnimationFrame(circleAnimationRef.current);
        setCircleRadius(0);
      }
    }

    return () => {
      if (circleAnimationRef.current) {
        cancelAnimationFrame(circleAnimationRef.current);
      }
    };
  }, [searchPhase, userLat, userLng, circleRadius]);

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

  // Calculate bearing between two points
  const calculateBearing = useCallback((startLat: number, startLng: number, endLat: number, endLng: number): number => {
    const rad = Math.PI / 180;
    const lat1 = startLat * rad;
    const lat2 = endLat * rad;
    const dLon = (endLng - startLng) * rad;

    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    let brng = Math.atan2(y, x) / rad;

    return (brng + 360) % 360; // Normalize to 0-360
  }, []);

  // Track previous provider location to calculate direction
  const prevProviderLocationRef = useRef<{ lat: number; lng: number } | null>(null);

  // Animate provider marker movement smoothly with direction-based rotation
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

          // Calculate and update rotation based on movement direction
          if (prevProviderLocationRef.current) {
            const bearing = calculateBearing(
              prevProviderLocationRef.current.lat,
              prevProviderLocationRef.current.lng,
              currentLat,
              currentLng
            );

            // Update the marker's rotation
            if (providerMarkerRef.current && providerMarkerRef.current.setIcon) {
              const currentIcon = providerMarkerRef.current.getIcon() as google.maps.Symbol;
              if (currentIcon) {
                providerMarkerRef.current.setIcon({
                  ...currentIcon,
                  rotation: bearing
                });
              }
            }
          }

          if (progress < 1) {
            animationRef.current = requestAnimationFrame(animate);
          } else {
            // Update the previous location after animation completes
            prevProviderLocationRef.current = { lat: providerLat, lng: providerLng };
          }
        };

        animationRef.current = requestAnimationFrame(animate);
      } else {
        providerMarkerRef.current.setPosition(newPosition);
        prevProviderLocationRef.current = { lat: providerLat, lng: providerLng };
      }
    } else if (providerLat != null && providerLng != null) {
      // Update the previous location when map is not loaded yet
      prevProviderLocationRef.current = { lat: providerLat, lng: providerLng };
    }
  }, [providerLat, providerLng, mapRef, calculateBearing]);

  // Auto-fit map to show both user and provider when both are available
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
        // Add padding to prevent markers from being at the edge
        mapRef.fitBounds(bounds, 50); // 50px padding
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
      {/* Pulsing circle animation during finding providers phase */}
      {searchPhase === 'finding_providers' && userLat != null && userLng != null && (
        <CircleF
          center={{ lat: userLat, lng: userLng }}
          radius={circleRadius}
          options={{
            strokeColor: '#db4b0d', // Mustard color
            strokeOpacity: 0.7,
            strokeWeight: 2,
            fillColor: '#db4b0d', // Mustard color
            fillOpacity: 0.25,
            clickable: false,
          }}
        />
      )}

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

      {/* Route visualization between provider and user */}
      {searchPhase === 'provider_accepted' && routeCoordinates.length > 1 && (
        <PolylineF
          path={routeCoordinates}
          options={{
            geodesic: true,
            strokeColor: "#EF4444",
            strokeOpacity: 0.7,
            strokeWeight: 6,
          }}
        />
      )}

      {/* Provider marker with smooth animation and direction-based rotation */}
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
            rotation: prevProviderLocationRef.current ?
              calculateBearing(
                prevProviderLocationRef.current.lat,
                prevProviderLocationRef.current.lng,
                providerLat,
                providerLng
              ) : 0,
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
});

export default ServiceMapComponent;