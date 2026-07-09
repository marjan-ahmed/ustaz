// components/LocationPickerMap.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet'; // Import L for Leaflet types

// Fix for default marker icon not appearing
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

interface LocationPickerMapProps {
  initialPosition?: [number, number];
  onLocationSelect: (lat: number, lng: number) => void;
  height?: string;
  zoom?: number;
}

const LocationPickerMap: React.FC<LocationPickerMapProps> = ({
  initialPosition = [34.0151, 71.5249], // Default to Peshawar, Pakistan
  onLocationSelect,
  height = '400px',
  zoom = 13,
}) => {
  // CORRECTED LINE: Type mapRef as L.Map (Leaflet's Map class)
  const mapRef = useRef<L.Map>(null);

  // Add state for marker position
  const [position, setPosition] = useState<[number, number] | null>(initialPosition ? initialPosition : null);

  const Markers = () => {
    useMapEvents({
      click(e) {
        setPosition([e.latlng.lat, e.latlng.lng]);
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      },
      locationfound(e) {
        setPosition([e.latlng.lat, e.latlng.lng]);
        onLocationSelect(e.latlng.lat, e.latlng.lng);
        if (mapRef.current) {
          mapRef.current.flyTo(e.latlng, zoom);
        }
      },
      // You can add more events like dragend for the marker if it's draggable
    });
    return position ? <Marker position={position} draggable={true} eventHandlers={{
        dragend: (event: any) => {
            const marker = event.target;
            const newPos = marker.getLatLng();
            setPosition([newPos.lat, newPos.lng]);
            onLocationSelect(newPos.lat, newPos.lng);
        }
    }} /> : null;
  };

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.locate(); // Attempt to get user's current location
    }
  }, []);

  return (
    <div style={{ height, width: '100%', borderRadius: '8px', overflow: 'hidden' }}>
      <MapContainer
        center={position || initialPosition as [number, number]}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Markers />
      </MapContainer>
    </div>
  );
};

export default LocationPickerMap;