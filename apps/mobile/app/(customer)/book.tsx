import { useEffect, useRef, useState } from 'react';
import { Platform, LayoutAnimation } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { ActivityIndicator, Dimensions, PanResponder, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@ustaz/shared/theme';
import { serviceCategories } from '@/content/home';
import { cancelRequest, createServiceRequest, type ServiceRequest } from '@/lib/ustaz-api';
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

type RequestStatus = 'idle' | 'finding_provider' | RequestStatusDB | 'error';
type RequestStatusDB = 'notified_multiple' | 'accepted' | 'provider_enroute' | 'arriving' | 'arrived' | 'in_progress' | 'work_in_progress' | 'completed' | 'cancelled' | 'no_ustaz_found' | 'rejected';

const ACTIVE_STATUSES = ['notified_multiple', 'accepted', 'provider_enroute', 'arriving', 'arrived', 'in_progress', 'work_in_progress'];
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

type PlacePrediction = {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
};

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

export default function BookScreen() {
  const params = useLocalSearchParams<{ service?: string }>();
  const initialService = typeof params.service === 'string' ? params.service : serviceCategories[0].name;
  const { user, loading: authLoading, isSignedIn } = useAuth();
  const router = useRouter();
  const mapRef = useRef<any>(null);
  const selectedAddressRef = useRef(false);

  const [sheetHeight, setSheetHeight] = useState(MIDDLE_HEIGHT);
  const lastSnap = useRef(MIDDLE_HEIGHT);

  function snapTo(height: number) {
    lastSnap.current = height;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSheetHeight(height);
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 8,
      onPanResponderMove: (_, g) => {
        const newHeight = lastSnap.current - g.dy;
        setSheetHeight(Math.max(COLLAPSED_HEIGHT, Math.min(EXPANDED_HEIGHT, newHeight)));
      },
      onPanResponderRelease: (_, g) => {
        const currentHeight = lastSnap.current - g.dy;
        const clamped = Math.max(COLLAPSED_HEIGHT, Math.min(EXPANDED_HEIGHT, currentHeight));

        let snapToTarget = MIDDLE_HEIGHT;
        if (currentHeight < MIDDLE_HEIGHT - SNAP_THRESHOLD) snapToTarget = COLLAPSED_HEIGHT;
        else if (currentHeight > MIDDLE_HEIGHT + SNAP_THRESHOLD) snapToTarget = EXPANDED_HEIGHT;

        snapTo(snapToTarget);
      },
    })
  ).current;

  const [serviceType, setServiceType] = useState(initialService);
  const [address, setAddress] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<PlacePrediction[]>([]);
  const [isLoadingAddressSuggestions, setIsLoadingAddressSuggestions] = useState(false);
  const [addressAutocompleteError, setAddressAutocompleteError] = useState<string | null>(null);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [markerCoords, setMarkerCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<MapCoordinate[]>([]);

  const [requestStatus, setRequestStatus] = useState<RequestStatus>('idle');
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
  const [acceptedProvider, setAcceptedProvider] = useState<any>(null);
  const [serviceStartedAt, setServiceStartedAt] = useState<string | null>(null);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const [showRating, setShowRating] = useState(false);

  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const isIdle = requestStatus === 'idle' || requestStatus === 'error';

  const { providerLocation } = useCustomerLocationSubscription(currentRequestId);

  useEffect(() => {
    const query = address.trim();
    if (!isIdle || selectedAddressRef.current || query.length < 3) {
      setAddressSuggestions([]);
      setIsLoadingAddressSuggestions(false);
      return;
    }

    if (!GOOGLE_MAPS_API_KEY) {
      setAddressAutocompleteError('Google address suggestions are not configured for mobile.');
      setAddressSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsLoadingAddressSuggestions(true);
      setAddressAutocompleteError(null);
      try {
        const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&components=country:pk&types=geocode&key=${GOOGLE_MAPS_API_KEY}`;
        const response = await fetch(url, { signal: controller.signal });
        const json = await response.json();
        if (json.status !== 'OK' && json.status !== 'ZERO_RESULTS') {
          throw new Error(json.error_message || json.status || 'Google Places request failed');
        }
        const predictions = (json.predictions ?? []).slice(0, 5).map((item: any) => ({
          placeId: item.place_id,
          description: item.description,
          mainText: item.structured_formatting?.main_text ?? item.description,
          secondaryText: item.structured_formatting?.secondary_text ?? '',
        }));
        setAddressSuggestions(predictions);
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          setAddressSuggestions([]);
          setAddressAutocompleteError('Google suggestions are unavailable. You can still use the typed address.');
        }
      } finally {
        setIsLoadingAddressSuggestions(false);
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [address, isIdle]);

  async function selectPlaceSuggestion(prediction: PlacePrediction) {
    if (!GOOGLE_MAPS_API_KEY) return;
    selectedAddressRef.current = true;
    setIsResolvingAddress(true);
    setAddressAutocompleteError(null);
    setAddressSuggestions([]);
    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(prediction.placeId)}&fields=formatted_address,geometry&key=${GOOGLE_MAPS_API_KEY}`;
      const response = await fetch(url);
      const json = await response.json();
      if (json.status !== 'OK') {
        throw new Error(json.error_message || json.status || 'Google place details failed');
      }
      const location = json.result?.geometry?.location;
      if (!location || !Number.isFinite(location.lat) || !Number.isFinite(location.lng)) {
        throw new Error('Selected address has no coordinates.');
      }

      const lat = location.lat;
      const lng = location.lng;
      const resolvedAddress = json.result?.formatted_address ?? prediction.description;
      setAddress(resolvedAddress);
      setUserLat(lat);
      setUserLng(lng);
      setMarkerCoords({ lat, lng });
      mapRef.current?.animateToRegion({ latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 300);
      setSearchMessage('Address selected. You can drag the pin to adjust.');
    } catch (err: any) {
      selectedAddressRef.current = false;
      setAddress(prediction.description);
      setSearchMessage(err?.message ?? 'Could not select that address.');
    } finally {
      setIsResolvingAddress(false);
    }
  }

  function handleAddressChange(value: string) {
    setAddress(value);
    if (isIdle) {
      setUserLat(null);
      setUserLng(null);
      setMarkerCoords(null);
    }
  }

  async function resolveManualAddress(): Promise<{ lat: number; lng: number } | null> {
    const rawAddress = address.trim();
    if (!rawAddress) {
      setSearchMessage('Enter an address or use your current location.');
      return null;
    }

    setIsResolvingAddress(true);
    setSearchMessage(null);
    try {
      const query = /pakistan/i.test(rawAddress) ? rawAddress : `${rawAddress}, Pakistan`;
      const results = await Location.geocodeAsync(query);
      const first = results[0];
      if (!first || !Number.isFinite(first.latitude) || !Number.isFinite(first.longitude)) {
        setSearchMessage('Could not find that address. Try adding area, city, and Pakistan.');
        return null;
      }

      const lat = first.latitude;
      const lng = first.longitude;
      setUserLat(lat);
      setUserLng(lng);
      setMarkerCoords({ lat, lng });
      setAddress(rawAddress);
      setAddressSuggestions([]);
      mapRef.current?.animateToRegion({ latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 300);
      setSearchMessage('Address selected. You can drag the pin to adjust.');
      return { lat, lng };
    } catch (err: any) {
      setSearchMessage(err?.message ?? 'Could not find that address.');
      return null;
    } finally {
      setIsResolvingAddress(false);
    }
  }

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('service_requests')
        .select('id, status, accepted_by_provider_id, request_latitude, request_longitude, request_details')
        .eq('user_id', user.id)
        .in('status', [...ACTIVE_STATUSES, 'completed'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setCurrentRequestId(data.id);
        setRequestStatus(data.status as RequestStatusDB);
        if (typeof data.request_latitude === 'number' && typeof data.request_longitude === 'number') {
          setUserLat(data.request_latitude);
          setUserLng(data.request_longitude);
          setMarkerCoords({ lat: data.request_latitude, lng: data.request_longitude });
          mapRef.current?.animateToRegion({ latitude: data.request_latitude, longitude: data.request_longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 300);
        }
        if (data.request_details) setAddress(data.request_details);
        if (data.accepted_by_provider_id) {
          fetchAcceptedProvider(data.id, data.accepted_by_provider_id);
        }
        if (data.status === 'completed') {
          const { data: sr } = await supabase
            .from('service_requests')
            .select('customer_rated')
            .eq('id', data.id)
            .single();
          if (sr && !sr.customer_rated) {
            setShowRating(true);
          }
        }
      }
    })();
  }, [user]);

  useEffect(() => {
    if (!user || authLoading) return;
    if (userLat && userLng) return;
    getCurrentLocation();
  }, [user, authLoading]);

  useEffect(() => {
    if (!currentRequestId) return;
    const channel = supabase
      .channel(`service_request:${currentRequestId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'service_requests', filter: `id=eq.${currentRequestId}` }, (payload) => {
        const newStatus = (payload.new as any).status;
        const acceptedBy = (payload.new as any).accepted_by_provider_id;
        const startedAt = (payload.new as any).service_started_at;
        setRequestStatus(newStatus);
        if (startedAt) setServiceStartedAt(startedAt);
        if (newStatus === 'completed') {
          setShowRating(true);
        } else if (acceptedBy) {
          fetchAcceptedProvider(currentRequestId, acceptedBy);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentRequestId]);

  async function fetchAcceptedProvider(requestId: string, providerId: string) {
    try {
      const { data } = await supabase.rpc('get_assigned_provider', { p_request_id: requestId });
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

  async function getCurrentLocation() {
    setIsGettingLocation(true);
    setSearchMessage(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setSearchMessage('Location permission denied. Please enable it in settings.');
        setIsGettingLocation(false);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setUserLat(lat);
      setUserLng(lng);
      setMarkerCoords({ lat, lng });

      try {
        const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        if (results.length > 0) {
          const r = results[0];
          const parts = [r.name, r.street, r.district, r.city, r.region].filter(Boolean);
          setAddress(parts.join(', '));
        }
      } catch {}

      mapRef.current?.animateToRegion({ latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 300);
      setSearchMessage('Location captured!');
    } catch (err: any) {
      setSearchMessage(err.message ?? 'Could not get location.');
    }
    setIsGettingLocation(false);
  }

  async function handleFindProviders() {
    if (!user || !serviceType) {
      setSearchMessage('Please select a service type.');
      return;
    }
    if (isSending || isResolvingAddress) return;

    let requestLat = userLat;
    let requestLng = userLng;
    if (requestLat === null || requestLng === null) {
      const resolved = await resolveManualAddress();
      if (!resolved) return;
      requestLat = resolved.lat;
      requestLng = resolved.lng;
    }

    setIsSending(true);
    setRequestStatus('finding_provider');
    setSearchMessage('Finding nearby providers...');

    try {
      const result = await createServiceRequest({
        serviceType,
        userLat: requestLat,
        userLng: requestLng,
        requestDetails: address.trim() || null,
        radiusKm: 3,
      });

      if (!result.requestId) {
        setRequestStatus('idle');
        setServiceStartedAt(null);
        setSearchMessage('No providers found nearby. Try again later.');
        setIsSending(false);
        return;
      }

      setCurrentRequestId(result.requestId);
      setRequestStatus('notified_multiple');
      setSearchMessage(`Request sent to ${result.providersNotified} providers. Waiting for response...`);
    } catch (err: any) {
      setRequestStatus('error');
      setSearchMessage(err.message || 'Failed to send request');
    }
    setIsSending(false);
  }

  async function cancelActive() {
    if (!currentRequestId || !user) return;
    try {
      await cancelRequest(currentRequestId, user.id, false);
      setCurrentRequestId(null);
      setRequestStatus('idle');
      setAcceptedProvider(null);
      setServiceStartedAt(null);
      setSearchMessage('Request cancelled.');
    } catch (err: any) {
      setSearchMessage(err.message);
    }
  }

  function onMarkerDragEnd(e: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setUserLat(latitude);
    setUserLng(longitude);
    setMarkerCoords({ lat: latitude, lng: longitude });
    Location.reverseGeocodeAsync({ latitude, longitude }).then((results) => {
      if (results.length > 0) {
        const r = results[0];
        setAddress([r.name, r.street, r.district, r.city, r.region].filter(Boolean).join(', '));
      }
    }).catch(() => {});
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

  const showTrackingCard = currentRequestId && acceptedProvider && ACTIVE_STATUSES.includes(requestStatus);
  const showMap = userLat !== null || (currentRequestId && ACTIVE_STATUSES.includes(requestStatus));
  const canCancel = currentRequestId && (requestStatus === 'notified_multiple' || requestStatus === 'accepted' || requestStatus === 'finding_provider');

  if (authLoading) return <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}><View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.primary} /></View></SafeAreaView>;
  if (!isSignedIn) return <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}><View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}><Text style={{ fontFamily: 'Anton', fontSize: 28, color: '#1B1B27', textAlign: 'center' }}>Sign in required</Text><Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 16, color: '#9CA3AF', textAlign: 'center', marginTop: 12 }}>Go to Profile tab to sign in first.</Text></View></SafeAreaView>;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top']}>
      <View style={{ flex: 1 }}>
        {/* Map */}
        {showMap && Platform.OS !== 'web' ? (
          <MapView ref={mapRef} style={{ flex: 1 }} provider={PROVIDER_GOOGLE} initialRegion={mapRegion}
            showsUserLocation={!userLat} showsMyLocationButton={false}>
            {routeCoordinates.length > 1 && (
              <>
                <Polyline coordinates={routeCoordinates} strokeColor="#FFFFFF" strokeWidth={9} zIndex={1} />
                <Polyline coordinates={routeCoordinates} strokeColor="#EF4444" strokeWidth={6} zIndex={2} />
              </>
            )}
            {markerCoords && <Marker coordinate={{ latitude: markerCoords.lat, longitude: markerCoords.lng }} draggable={isIdle} onDragEnd={onMarkerDragEnd} pinColor={colors.primary} />}
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
          <View style={{ paddingTop: 12, paddingBottom: 4 }} {...panResponder.panHandlers}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', alignSelf: 'center' }} />
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 8 }}>
              <Pressable onPress={() => snapTo(COLLAPSED_HEIGHT)} style={({ pressed }) => [{ width: 6, height: 6, borderRadius: 3, backgroundColor: lastSnap.current === COLLAPSED_HEIGHT ? colors.primary : '#D1D5DB', opacity: pressed ? 0.6 : 1 }]} />
              <Pressable onPress={() => snapTo(MIDDLE_HEIGHT)} style={({ pressed }) => [{ width: 6, height: 6, borderRadius: 3, backgroundColor: lastSnap.current === MIDDLE_HEIGHT ? colors.primary : '#D1D5DB', opacity: pressed ? 0.6 : 1 }]} />
              <Pressable onPress={() => snapTo(EXPANDED_HEIGHT)} style={({ pressed }) => [{ width: 6, height: 6, borderRadius: 3, backgroundColor: lastSnap.current === EXPANDED_HEIGHT ? colors.primary : '#D1D5DB', opacity: pressed ? 0.6 : 1 }]} />
            </View>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
            {/* Search Message */}
            {searchMessage && (
              <View style={{ marginBottom: 12, borderRadius: 12, backgroundColor: requestStatus === 'error' ? '#FEF2F2' : requestStatus === 'finding_provider' || requestStatus === 'notified_multiple' ? '#EFF6FF' : '#ECFDF5', padding: 12 }}>
                <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, color: requestStatus === 'error' ? '#EF4444' : requestStatus === 'finding_provider' || requestStatus === 'notified_multiple' ? '#2563EB' : '#10B981' }}>{searchMessage}</Text>
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

            {/* Service Type */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 12, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.5, marginBottom: 8 }}>SERVICE TYPE</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {serviceCategories.map((service) => (
                  <Pressable key={service.name} onPress={() => { if (isIdle) setServiceType(service.name); }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: serviceType === service.name ? colors.primary : '#F3F4F6', borderWidth: 1, borderColor: serviceType === service.name ? colors.primary : '#E5E7EB' }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: service.accent }} />
                    <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 12, fontWeight: '700', color: serviceType === service.name ? '#FFFFFF' : '#374151' }}>{service.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Location */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 12, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.5, marginBottom: 8 }}>LOCATION</Text>
              {isGettingLocation ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, backgroundColor: '#F3F4F6', paddingVertical: 12 }}>
                  <ActivityIndicator color={colors.primary} size="small" />
                  <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, fontWeight: '700', color: '#6B7280' }}>Detecting your location...</Text>
                </View>
              ) : userLat && userLng ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, backgroundColor: '#ECFDF5', paddingVertical: 12 }}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, fontWeight: '700', color: '#10B981' }}>Location detected</Text>
                </View>
              ) : (
                <Pressable onPress={getCurrentLocation} disabled={isGettingLocation}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, backgroundColor: '#FEF2F2', paddingVertical: 12 }}>
                  <Ionicons name="refresh" size={16} color="#EF4444" />
                  <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, fontWeight: '700', color: '#EF4444' }}>Tap to retry location</Text>
                </Pressable>
              )}
              {userLat && userLng && (
                <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 4 }}>
                  {userLat.toFixed(4)}, {userLng.toFixed(4)}
                </Text>
              )}
              <View style={{ marginTop: 10, gap: 8 }}>
                <TextInput value={address} onChangeText={handleAddressChange} editable={isIdle} placeholder="Search or enter address manually" placeholderTextColor="#D1D5DB"
                  returnKeyType="search" onSubmitEditing={() => { if (isIdle) resolveManualAddress(); }}
                  style={{ minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: userLat && userLng ? `${colors.primary}55` : '#E5E7EB', backgroundColor: '#F9FAFB', paddingHorizontal: 12, fontFamily: 'AtkinsonHyperlegible', fontSize: 13, color: '#1B1B27' }} />
                {isIdle && address.trim().length >= 3 && (isLoadingAddressSuggestions || addressSuggestions.length > 0 || addressAutocompleteError) && (
                  <View style={{ overflow: 'hidden', borderRadius: 14, borderWidth: 1, borderColor: '#F3F4F6', backgroundColor: '#FFFFFF' }}>
                    {isLoadingAddressSuggestions ? (
                      <View style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 }}>
                        <ActivityIndicator color={colors.primary} size="small" />
                        <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 12, color: '#6B7280' }}>Loading Google suggestions...</Text>
                      </View>
                    ) : addressSuggestions.length > 0 ? (
                      addressSuggestions.map((item, index) => (
                        <Pressable key={item.placeId} onPress={() => selectPlaceSuggestion(item)}
                          style={{ minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: index === 0 ? 0 : 1, borderTopColor: '#F3F4F6' }}>
                          <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: '#FFF7ED', alignItems: 'center', justifyContent: 'center' }}>
                            <Ionicons name="location" size={14} color={colors.primary} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text numberOfLines={1} style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, fontWeight: '700', color: '#1B1B27' }}>{item.mainText}</Text>
                            {!!item.secondaryText && <Text numberOfLines={1} style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{item.secondaryText}</Text>}
                          </View>
                        </Pressable>
                      ))
                    ) : (
                      <View style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 }}>
                        <Ionicons name="alert-circle-outline" size={16} color="#F59E0B" />
                        <Text style={{ flex: 1, fontFamily: 'AtkinsonHyperlegible', fontSize: 12, color: '#92400E' }}>{addressAutocompleteError}</Text>
                      </View>
                    )}
                  </View>
                )}
                <Pressable onPress={resolveManualAddress} disabled={!isIdle || isResolvingAddress || !address.trim()}
                  style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, backgroundColor: !isIdle || isResolvingAddress || !address.trim() ? '#E5E7EB' : '#FFF7ED', borderWidth: 1, borderColor: !isIdle || isResolvingAddress || !address.trim() ? '#E5E7EB' : `${colors.primary}33` }}>
                  {isResolvingAddress ? <ActivityIndicator color={colors.primary} size="small" /> : <Ionicons name="map" size={16} color={!isIdle || !address.trim() ? '#9CA3AF' : colors.primary} />}
                  <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, fontWeight: '700', color: !isIdle || !address.trim() ? '#9CA3AF' : colors.primary }}>
                    {isResolvingAddress ? 'Finding address...' : userLat && userLng ? 'Update map pin from address' : 'Use this address'}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={{ gap: 10 }}>
              <Pressable onPress={handleFindProviders}
                disabled={isSending || isResolvingAddress || requestStatus === 'notified_multiple' || requestStatus === 'accepted'}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, backgroundColor: (isSending || isResolvingAddress || requestStatus === 'notified_multiple' || requestStatus === 'accepted') ? '#D1D5DB' : colors.primary, paddingVertical: 14 }}>
                {isSending || isResolvingAddress || requestStatus === 'finding_provider' ? (
                  <>
                    <ActivityIndicator color="#FFF" size="small" />
                    <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>{isResolvingAddress ? 'Finding Address...' : 'Finding Providers...'}</Text>
                  </>
                ) : requestStatus === 'notified_multiple' ? (
                  <>
                    <ActivityIndicator color="#FFF" size="small" />
                    <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>Waiting for Response...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="search" size={16} color="#FFFFFF" />
                    <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>Find Available Providers</Text>
                  </>
                )}
              </Pressable>

              {canCancel && (
                <Pressable onPress={cancelActive}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', paddingVertical: 12 }}>
                  <Ionicons name="close-circle" size={16} color="#6B7280" />
                  <Text style={{ fontFamily: 'AtkinsonHyperlegible', fontSize: 13, fontWeight: '700', color: '#374151' }}>Cancel Request</Text>
                </Pressable>
              )}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Rating Modal */}
      <RatingModal visible={showRating} requestId={currentRequestId ?? ''} raterId={user?.id ?? ''} ratedUserId={acceptedProvider?.id ?? ''}
        ratedUserName={acceptedProvider ? `${acceptedProvider.firstName ?? ''} ${acceptedProvider.lastName ?? ''}`.trim() || 'Provider' : 'Provider'}
        onComplete={() => setShowRating(false)} onClose={() => setShowRating(false)} />
    </SafeAreaView>
  );
}

