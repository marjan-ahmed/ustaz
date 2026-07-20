import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MapView, Marker, Polyline } from '@/components/MapComponents';
import { colors } from '@ustaz/shared/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Props {
  customerLat: number;
  customerLng: number;
  providerLat: number | null;
  providerLng: number | null;
  height?: number;
}

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

function decodePolyline(encoded: string): { latitude: number; longitude: number }[] {
  const points: { latitude: number; longitude: number }[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < encoded.length) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : result >> 1;
    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : result >> 1;
    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
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

function MapContent({
  customerLat, customerLng, providerLat, providerLng, routeCoords, loadingRoute, mapRef,
}: {
  customerLat: number; customerLng: number;
  providerLat: number | null; providerLng: number | null;
  routeCoords: { latitude: number; longitude: number }[];
  loadingRoute: boolean;
  mapRef: React.RefObject<any>;
}) {
  const hasProvider = providerLat != null && providerLng != null && Number.isFinite(providerLat) && Number.isFinite(providerLng);
  const hasCustomer = Number.isFinite(customerLat) && Number.isFinite(customerLng);
  const distance = hasProvider && hasCustomer ? haversine(providerLat!, providerLng!, customerLat, customerLng) : null;

  return (
    <>
      <MapView
        ref={mapRef}
        style={{ width: '100%', height: '100%' }}
        initialRegion={{
          latitude: customerLat,
          longitude: customerLng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={false}
        showsMyLocationButton={true}
      >
        <Marker coordinate={{ latitude: customerLat, longitude: customerLng }} title="Customer location">
          <View style={{ alignItems: 'center' }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#FFF' }}>
              <Ionicons name="home" size={18} color="#FFF" />
            </View>
          </View>
        </Marker>
        {hasProvider && (
          <Marker coordinate={{ latitude: providerLat!, longitude: providerLng! }} title="You">
            <View style={{ alignItems: 'center' }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#FFF' }}>
                <Ionicons name="navigate" size={18} color="#FFF" />
              </View>
            </View>
          </Marker>
        )}
        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor="#3B82F6"
            strokeWidth={5}
          />
        )}
      </MapView>

      {distance != null && (
        <View style={{ position: 'absolute', bottom: 16, left: 16, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: '#FFF', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 4 }}>
          <Ionicons name="resize" size={14} color="#6B7280" />
          <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, fontWeight: '700', color: '#1B1B27' }}>{formatDistance(distance)}</Text>
        </View>
      )}

      {loadingRoute && (
        <View style={{ position: 'absolute', top: 16, right: 16, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: '#FFF' }}>
          <ActivityIndicator size={12} color={colors.primary} />
        </View>
      )}
    </>
  );
}

export default function ProviderCustomerMap({ customerLat, customerLng, providerLat, providerLng, height = 200 }: Props) {
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const miniMapRef = useRef<any>(null);
  const fullMapRef = useRef<any>(null);

  const hasProvider = providerLat != null && providerLng != null && Number.isFinite(providerLat) && Number.isFinite(providerLng);
  const hasCustomer = Number.isFinite(customerLat) && Number.isFinite(customerLng);

  useEffect(() => {
    if (!hasProvider || !hasCustomer || !GOOGLE_MAPS_API_KEY) return;
    setLoadingRoute(true);
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${providerLat},${providerLng}&destination=${customerLat},${customerLng}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`;
    fetch(url)
      .then(r => r.json())
      .then(json => {
        if (json.routes?.[0]?.overview_polyline?.points) {
          setRouteCoords(decodePolyline(json.routes[0].overview_polyline.points));
        }
      })
      .catch(() => {})
      .finally(() => setLoadingRoute(false));
  }, [providerLat, providerLng, customerLat, customerLng, hasProvider, hasCustomer]);

  useEffect(() => {
    const ref = expanded ? fullMapRef : miniMapRef;
    if (!ref.current) return;
    const points = [
      { latitude: customerLat, longitude: customerLng },
      ...(hasProvider ? [{ latitude: providerLat!, longitude: providerLng! }] : []),
    ];
    if (points.length > 1) {
      ref.current.fitToCoordinates(points, {
        edgePadding: expanded ? { top: 60, right: 60, bottom: 60, left: 60 } : { top: 30, right: 30, bottom: 30, left: 30 },
        animated: true,
      });
    }
  }, [providerLat, providerLng, hasProvider, expanded]);

  return (
    <>
      <Pressable
        onPress={() => setExpanded(true)}
        style={{ height, borderRadius: 16, overflow: 'hidden', backgroundColor: '#F3F4F6' }}
      >
        <MapContent
          customerLat={customerLat} customerLng={customerLng}
          providerLat={providerLat} providerLng={providerLng}
          routeCoords={routeCoords} loadingRoute={loadingRoute} mapRef={miniMapRef}
        />
        <View style={{ position: 'absolute', top: 8, left: 8, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <Ionicons name="expand" size={12} color="#FFF" />
          <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 10, fontWeight: '700', color: '#FFF' }}>Tap to expand</Text>
        </View>
      </Pressable>

      <Modal visible={expanded} animationType="slide" onRequestClose={() => setExpanded(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }} edges={['top']}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
            <Text style={{ fontFamily: 'Anton', fontSize: 18, color: '#1B1B27' }}>Customer Location</Text>
            <Pressable onPress={() => setExpanded(false)} style={{ padding: 6, borderRadius: 8, backgroundColor: '#F3F4F6' }}>
              <Ionicons name="close" size={18} color="#6B7280" />
            </Pressable>
          </View>
          <View style={{ flex: 1 }}>
            <MapContent
              customerLat={customerLat} customerLng={customerLng}
              providerLat={providerLat} providerLng={providerLng}
              routeCoords={routeCoords} loadingRoute={loadingRoute} mapRef={fullMapRef}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}
