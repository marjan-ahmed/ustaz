import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { ActivityIndicator, Dimensions, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@ustaz/shared/theme';
import { cancelRequest } from '@/lib/ustaz-api';
import { useAuth } from '@/lib/useAuth';
import { supabase } from '@/lib/supabase';
import { useCustomerLocationSubscription } from '@/hooks/useCustomerLocationSubscription';
import ProviderTrackingCard from '@/components/ProviderTrackingCard';
import RatingModal from '@/components/RatingModal';
import { MapView, Marker, Polyline, PROVIDER_GOOGLE } from '@/components/MapComponents';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const COLLAPSED_HEIGHT = SCREEN_HEIGHT * 0.30;
const MIDDLE_HEIGHT = SCREEN_HEIGHT * 0.55;
const EXPANDED_HEIGHT = SCREEN_HEIGHT * 0.85;
const SNAP_THRESHOLD = 50;

type RequestStatusDB = 'notified_multiple' | 'accepted' | 'provider_enroute' | 'arriving' | 'arrived' | 'in_progress' | 'work_in_progress' | 'completed' | 'cancelled' | 'no_ustaz_found' | 'rejected';

const ACTIVE_STATUSES = ['notified_multiple', 'accepted', 'provider_enroute', 'arriving', 'arrived', 'in_progress', 'work_in_progress'];
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

type MapCoordinate = {
  latitude: number;
  longitude: number;
};

function decodeGooglePolyline(encoded: string): MapCoordinate[] {
  const points: MapCoordinate[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < encoded.length);

    lat += result & 1 ? ~(result >> 1) : result >> 1;
    result = 0;
    shift = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < encoded.length);

    lng += result & 1 ? ~(result >> 1) : result >> 1;
    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }

  return points;
}

export default function ProcessScreen() {
  const params = useLocalSearchParams<{
    requestId: string;
    serviceType?: string;
    address?: string;
    lat?: string;
    lng?: string;
  }>();
  const { user, loading: authLoading, isSignedIn } = useAuth();
  const router = useRouter();
  const mapRef = useRef<any>(null);

  const requestId = params.requestId ?? '';

  const [serviceType, setServiceType] = useState(params.serviceType ?? '');
  const [address, setAddress] = useState(params.address ?? '');
  const [userLat, setUserLat] = useState<number | null>(params.lat ? Number(params.lat) : null);
  const [userLng, setUserLng] = useState<number | null>(params.lng ? Number(params.lng) : null);
  const [markerCoords, setMarkerCoords] = useState<{ lat: number; lng: number } | null>(
    params.lat && params.lng ? { lat: Number(params.lat), lng: Number(params.lng) } : null
  );
  const [routeCoordinates, setRouteCoordinates] = useState<MapCoordinate[]>([]);

  const [requestStatus, setRequestStatus] = useState<RequestStatusDB>('notified_multiple');
  const [acceptedProvider, setAcceptedProvider] = useState<any>(null);
  const [serviceStartedAt, setServiceStartedAt] = useState<string | null>(null);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const [showRating, setShowRating] = useState(false);
  const [isLoadingRequest, setIsLoadingRequest] = useState(!params.serviceType);

  const [sheetHeight, setSheetHeight] = useState(MIDDLE_HEIGHT);
  const lastSnap = useRef(MIDDLE_HEIGHT);

  function snapTo(height: number) {
    lastSnap.current = height;
    const { LayoutAnimation } = require('react-native');
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSheetHeight(height);
  }

  const { providerLocation } = useCustomerLocationSubscription(requestId);

  useEffect(() => {
    if (!requestId) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from('service_requests')
          .select('id, status, accepted_by_provider_id, request_latitude, request_longitude, request_details, service_type, service_started_at, customer_rated')
          .eq('id', requestId)
          .single();

        if (cancelled || !data) return;

        setRequestStatus(data.status as RequestStatusDB);
        if (data.service_type && !serviceType) setServiceType(data.service_type);
        if (data.request_details && !address) setAddress(data.request_details);
        if (typeof data.request_latitude === 'number' && typeof data.request_longitude === 'number') {
          setUserLat(data.request_latitude);
          setUserLng(data.request_longitude);
          setMarkerCoords({ lat: data.request_latitude, lng: data.request_longitude });
        }
        if (data.service_started_at) setServiceStartedAt(data.service_started_at);
        if (data.accepted_by_provider_id) {
          fetchAcceptedProvider(requestId, data.accepted_by_provider_id);
        }
        if (data.status === 'completed' && !data.customer_rated) {
          setShowRating(true);
        }
      } catch {}
      setIsLoadingRequest(false);
    })();
    return () => { cancelled = true; };
  }, [requestId]);

  useEffect(() => {
    if (!requestId) return;
    const channel = supabase
      .channel(`service_request:${requestId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'service_requests', filter: `id=eq.${requestId}` }, (payload) => {
        const newStatus = (payload.new as any).status;
        const acceptedBy = (payload.new as any).accepted_by_provider_id;
        const startedAt = (payload.new as any).service_started_at;
        setRequestStatus(newStatus);
        if (startedAt) setServiceStartedAt(startedAt);
        if (newStatus === 'completed') {
          setShowRating(true);
        } else if (acceptedBy) {
          fetchAcceptedProvider(requestId, acceptedBy);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [requestId]);

  async function fetchAcceptedProvider(rId: string, providerId: string) {
    try {
      const { data } = await supabase.rpc('get_assigned_provider', { p_request_id: rId });
      const row = Array.isArray(data) ? data[0] : data;
      if (row) {
        setAcceptedProvider({
          id: row.user_id,
          firstName: row.first_name,
          lastName: row.last_name,
          phoneNumber: row.phone_number,
          rating_avg: row.rating_avg,
          rating_count: row.rating_count,
        });
      }
    } catch {}
  }

  const mapRegion = userLat && userLng
    ? { latitude: userLat, longitude: userLng, latitudeDelta: 0.01, longitudeDelta: 0.01 }
    : { latitude: 33.6844, longitude: 73.0479, latitudeDelta: 0.1, longitudeDelta: 0.1 };

  const customerCoordinate = userLat != null && userLng != null
    ? { latitude: userLat, longitude: userLng }
    : markerCoords
      ? { latitude: markerCoords.lat, longitude: markerCoords.lng }
      : null;

  const providerCoordinate = providerLocation
    ? { latitude: providerLocation.latitude, longitude: providerLocation.longitude }
    : null;

  useEffect(() => {
    if (!customerCoordinate || !providerCoordinate || !GOOGLE_MAPS_API_KEY || !ACTIVE_STATUSES.includes(requestStatus)) {
      setRouteCoordinates([]);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const origin = `${providerCoordinate.latitude},${providerCoordinate.longitude}`;
        const destination = `${customerCoordinate.latitude},${customerCoordinate.longitude}`;
        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&mode=driving&alternatives=false&key=${GOOGLE_MAPS_API_KEY}`;
        const response = await fetch(url, { signal: controller.signal });
        const json = await response.json();
        const encoded = json.routes?.[0]?.overview_polyline?.points;
        if (json.status !== 'OK' || !encoded) {
          setRouteCoordinates([]);
          return;
        }
        setRouteCoordinates(decodeGooglePolyline(encoded));
      } catch (err: any) {
        if (err?.name !== 'AbortError') setRouteCoordinates([]);
      }
    }, 700);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [customerCoordinate?.latitude, customerCoordinate?.longitude, providerCoordinate?.latitude, providerCoordinate?.longitude, requestStatus]);

  useEffect(() => {
    const coords = routeCoordinates.length > 1
      ? routeCoordinates
      : customerCoordinate && providerCoordinate
        ? [customerCoordinate, providerCoordinate]
        : [];

    if (coords.length < 2) return;
    mapRef.current?.fitToCoordinates(coords, {
      edgePadding: { top: 80, right: 60, bottom: 260, left: 60 },
      animated: true,
    });
  }, [routeCoordinates, customerCoordinate?.latitude, customerCoordinate?.longitude, providerCoordinate?.latitude, providerCoordinate?.longitude]);

  async function cancelActive() {
    if (!requestId || !user) return;
    try {
      await cancelRequest(requestId, user.id, false);
      router.replace('/(customer)/find');
    } catch (err: any) {
      setSearchMessage(err.message);
    }
  }

  function goBackToFind() {
    router.replace('/(customer)/find');
  }

  const showTrackingCard = acceptedProvider && ACTIVE_STATUSES.includes(requestStatus);
  const showMap = userLat !== null || ACTIVE_STATUSES.includes(requestStatus);
  const canCancel = requestStatus === 'notified_multiple' || requestStatus === 'accepted';

  if (authLoading || isLoadingRequest) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, color: '#9CA3AF', marginTop: 12 }}>Loading request...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isSignedIn || !requestId) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ fontFamily: 'Anton', fontSize: 28, color: '#1B1B27', textAlign: 'center' }}>No active request</Text>
          <Pressable onPress={goBackToFind} style={{ marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.primary }}>
            <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>Find a provider</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top']}>
      <View style={{ flex: 1 }}>
        {/* Map */}
        {showMap && Platform.OS !== 'web' && GOOGLE_MAPS_API_KEY ? (
          <MapView ref={mapRef} style={{ flex: 1 }} provider={PROVIDER_GOOGLE} initialRegion={mapRegion}
            showsUserLocation={!userLat} showsMyLocationButton={false}>
            {routeCoordinates.length > 1 && (
              <>
                <Polyline coordinates={routeCoordinates} strokeColor="#FFFFFF" strokeWidth={9} zIndex={1} />
                <Polyline coordinates={routeCoordinates} strokeColor="#EF4444" strokeWidth={6} zIndex={2} />
              </>
            )}
            {markerCoords && <Marker coordinate={{ latitude: markerCoords.lat, longitude: markerCoords.lng }} pinColor={colors.primary} />}
            {providerLocation && <Marker coordinate={{ latitude: providerLocation.latitude, longitude: providerLocation.longitude }} pinColor="#10B981" />}
          </MapView>
        ) : showMap ? (
          <View style={{ flex: 1, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="map" size={48} color="#9CA3AF" />
            <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, color: '#6B7280', marginTop: 8 }}>Map available on mobile</Text>
          </View>
        ) : <View style={{ flex: 1, backgroundColor: '#F3F4F6' }} />}

        {/* Bottom Sheet */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: sheetHeight,
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            shadowColor: '#000',
            shadowOpacity: 0.15,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: -6 },
            elevation: 12,
          }}
        >
          {/* Drag Handle + Snap Buttons */}
          <View style={{ paddingTop: 12, paddingBottom: 4 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', alignSelf: 'center' }} />
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 8 }}>
              <Pressable onPress={() => snapTo(COLLAPSED_HEIGHT)} style={({ pressed }) => [{ width: 6, height: 6, borderRadius: 3, backgroundColor: lastSnap.current === COLLAPSED_HEIGHT ? colors.primary : '#D1D5DB', opacity: pressed ? 0.6 : 1 }]} />
              <Pressable onPress={() => snapTo(MIDDLE_HEIGHT)} style={({ pressed }) => [{ width: 6, height: 6, borderRadius: 3, backgroundColor: lastSnap.current === MIDDLE_HEIGHT ? colors.primary : '#D1D5DB', opacity: pressed ? 0.6 : 1 }]} />
              <Pressable onPress={() => snapTo(EXPANDED_HEIGHT)} style={({ pressed }) => [{ width: 6, height: 6, borderRadius: 3, backgroundColor: lastSnap.current === EXPANDED_HEIGHT ? colors.primary : '#D1D5DB', opacity: pressed ? 0.6 : 1 }]} />
            </View>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
            {/* Status Banner */}
            {searchMessage && (
              <View style={{ marginBottom: 12, borderRadius: 12, backgroundColor: requestStatus === 'cancelled' ? '#FEF2F2' : requestStatus === 'completed' ? '#ECFDF5' : '#EFF6FF', padding: 12 }}>
                <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, color: requestStatus === 'cancelled' ? '#EF4444' : requestStatus === 'completed' ? '#10B981' : '#2563EB' }}>{searchMessage}</Text>
              </View>
            )}

            {/* Provider Tracking Card */}
            {showTrackingCard && acceptedProvider && (
              <View style={{ marginBottom: 12 }}>
                <ProviderTrackingCard status={requestStatus} provider={acceptedProvider} liveLocation={providerLocation} userLat={userLat} userLng={userLng}
                  serviceStartedAt={serviceStartedAt}
                  onChat={() => router.push(`/(customer)/chat?peer=${acceptedProvider.id}`)} />
              </View>
            )}

            {/* Waiting state */}
            {!showTrackingCard && requestStatus === 'notified_multiple' && (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <ActivityIndicator color={colors.primary} size="large" />
                <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 15, fontWeight: '700', color: '#1B1B27', marginTop: 12 }}>Waiting for a provider...</Text>
                <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>We're notifying nearby providers about your request.</Text>
              </View>
            )}

            {/* Completed state */}
            {requestStatus === 'completed' && !showRating && (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <Ionicons name="checkmark-circle" size={32} color="#10B981" />
                </View>
                <Text style={{ fontFamily: 'Anton', fontSize: 22, color: '#1B1B27', textAlign: 'center' }}>Service completed</Text>
                <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, color: '#9CA3AF', marginTop: 4, textAlign: 'center' }}>Rate your experience to help other customers.</Text>
              </View>
            )}

            {/* Action Buttons */}
            {canCancel && (
              <Pressable onPress={cancelActive}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', paddingVertical: 12 }}>
                <Ionicons name="close-circle" size={16} color="#6B7280" />
                <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, fontWeight: '700', color: '#374151' }}>Cancel Request</Text>
              </Pressable>
            )}

            {/* Back to Find (after completion or cancellation) */}
            {(requestStatus === 'completed' || requestStatus === 'cancelled' || requestStatus === 'no_ustaz_found' || requestStatus === 'rejected') && (
              <Pressable onPress={goBackToFind}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, backgroundColor: colors.primary, paddingVertical: 14, marginTop: canCancel ? 8 : 0 }}>
                <Ionicons name="search" size={16} color="#FFFFFF" />
                <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>Find another provider</Text>
              </Pressable>
            )}
          </ScrollView>
        </View>
      </View>

      {/* Rating Modal */}
      <RatingModal visible={showRating} requestId={requestId} raterId={user?.id ?? ''} ratedUserId={acceptedProvider?.id ?? ''}
        ratedUserName={acceptedProvider ? `${acceptedProvider.firstName ?? ''} ${acceptedProvider.lastName ?? ''}`.trim() || 'Provider' : 'Provider'}
        onComplete={() => setShowRating(false)} onClose={() => setShowRating(false)} />
    </SafeAreaView>
  );
}
