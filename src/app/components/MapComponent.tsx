import React, { useCallback, useEffect, useState } from 'react';
import {
  GoogleMap,
  MarkerF,
  useJsApiLoader,
} from '@react-google-maps/api';

type ProviderInfo = {
  firstName?: string;
  lastName?: string;
  // add any other fields you need
};

interface MapComponentProps {
  userLat?: number | null;
  userLng?: number | null;
  providerLat?: number | null;
  providerLng?: number | null;
  providerInfo?: ProviderInfo | null;
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
}) => {
  const [mapRef, setMapRef] = useState<google.maps.Map | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
    mapIds: ['bf1b79e73c1a147020354173'], // custom style ID
  });

  const onLoad = useCallback((map: google.maps.Map): void => {
    setMapRef(map);
  }, []);

  useEffect(() => {
    if (mapRef && userLat != null && userLng != null) {
      const bounds = new window.google.maps.LatLngBounds(
        { lat: userLat, lng: userLng },
        providerLat != null && providerLng != null
          ? { lat: providerLat, lng: providerLng }
          : undefined,
      );
      mapRef.fitBounds(bounds);
    }
  }, [mapRef, userLat, userLng, providerLat, providerLng]);

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
      {userLat != null && userLng != null && (
        <MarkerF position={{ lat: userLat, lng: userLng }} label="You" />
      )}

      {providerLat != null && providerLng != null && (
        <MarkerF
          position={{ lat: providerLat, lng: providerLng }}
          label={providerInfo?.firstName ?? 'Provider'}
        />
      )}
    </GoogleMap>
  );
};

export default MapComponent;
