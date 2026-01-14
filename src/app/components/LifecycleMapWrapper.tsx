import React, { useState, useEffect, useMemo } from 'react';
import ServiceMapComponent from './ServiceMapComponent';

interface LiveLocationFromParent {
  latitude: number;
  longitude: number;
  updated_at: string;
}

interface ProviderInfo {
  firstName?: string;
  lastName?: string;
}

interface LifecycleMapWrapperProps {
  userLat?: number | null;
  userLng?: number | null;
  providerLat?: number | null;
  providerLng?: number | null;
  providerInfo?: ProviderInfo | null;
  liveLocations?: LiveLocationFromParent[];
  userAddress?: string;
  searchPhase: 'address_selection' | 'finding_providers' | 'provider_accepted';
  onMapLoad?: (map: google.maps.Map) => void;
  onRouteCalculated?: (route: google.maps.LatLngLiteral[]) => void;
}

const LifecycleMapWrapper: React.FC<LifecycleMapWrapperProps> = React.memo(({
  userLat,
  userLng,
  providerLat,
  providerLng,
  providerInfo,
  liveLocations = [],
  userAddress,
  searchPhase,
  onMapLoad,
  onRouteCalculated,
}) => {
  // Internal state for route coordinates
  const [routeCoordinates, setRouteCoordinates] = useState<google.maps.LatLngLiteral[]>([]);

  // Handle route calculation callback
  const handleRouteCalculated = useMemo(() => (route: google.maps.LatLngLiteral[]) => {
    setRouteCoordinates(route);
    if (onRouteCalculated) {
      onRouteCalculated(route);
    }
  }, [onRouteCalculated]);

  // Determine if we should show draggable user marker based on search phase
  const showDraggableUserMarker = searchPhase === 'address_selection';

  // Convert liveLocations to the format expected by ServiceMapComponent
  const convertedLiveLocations = useMemo(() => {
    console.log('LifecycleMapWrapper received live locations:', liveLocations);
    return liveLocations?.map(loc => ({
      latitude: loc.latitude,
      longitude: loc.longitude,
      timestamp: loc.updated_at, // Map updated_at to timestamp
    })) || [];
  }, [liveLocations]);

  // Memoize the ServiceMapComponent props to prevent unnecessary re-renders
  const serviceMapProps = useMemo(() => ({
    userLat,
    userLng,
    providerLat,
    providerLng,
    providerInfo,
    liveLocations: convertedLiveLocations,
    userAddress,
    searchPhase,
    showDraggableUserMarker,
    onMapLoad,
    onRouteCalculated: handleRouteCalculated,
    routeCoordinates
  }), [
    userLat,
    userLng,
    providerLat,
    providerLng,
    providerInfo,
    convertedLiveLocations,
    userAddress,
    searchPhase,
    showDraggableUserMarker,
    onMapLoad,
    handleRouteCalculated,
    routeCoordinates
  ]);

  return (
    <ServiceMapComponent {...serviceMapProps} />
  );
});

export default LifecycleMapWrapper;