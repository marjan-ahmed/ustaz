import { useEffect, useRef, useState } from 'react';
import { Platform, LayoutAnimation } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { ActivityIndicator, Dimensions, PanResponder, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { color, font, radius, space, touch } from '@/theme/tokens';
import { serviceCategories } from '@/content/home';
import { cancelRequest, createServiceRequest, sendPushNotification, type ServiceRequest } from '@/lib/ustaz-api';
import { useAuth } from '@/lib/useAuth';
import { supabase } from '@/lib/supabase';
import { useCustomerLocationSubscription } from '@/hooks/useCustomerLocationSubscription';
import { getNextProviderSearchRadius } from '@/lib/bookingMapAnimation';
import ProviderTrackingCard from '@/components/ProviderTrackingCard';
import RatingModal from '@/components/RatingModal';
import CancelReasonModal from '@/components/CancelReasonModal';
import { Circle, MapView, Marker, Polyline, PROVIDER_GOOGLE } from '@/components/MapComponents';
import { Button, Card, Chip, IconTile, PressableScale, Text, TextField } from '@/components/mobile-ui';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const COLLAPSED_HEIGHT = SCREEN_HEIGHT * 0.30;
const MIDDLE_HEIGHT = SCREEN_HEIGHT * 0.55;
const EXPANDED_HEIGHT = SCREEN_HEIGHT * 0.85;
const SNAP_THRESHOLD = 50;

type RequestStatus = 'idle' | 'finding_provider' | RequestStatusDB | 'error';
type RequestStatusDB = 'notified_multiple' | 'accepted' | 'provider_enroute' | 'arriving' | 'arrived' | 'in_progress' | 'work_in_progress' | 'completed' | 'cancelled' | 'no_ustaz_found' | 'rejected';

const ACTIVE_STATUSES = ['notified_multiple', 'accepted', 'provider_enroute', 'arriving', 'arrived', 'in_progress', 'work_in_progress'];
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
const PROVIDER_SEARCH_CIRCLE_STROKE = 'rgba(219,75,13,0.7)';
const PROVIDER_SEARCH_CIRCLE_FILL = 'rgba(219,75,13,0.25)';

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
  const params = useLocalSearchParams<{
    service?: string;
    savedAddressId?: string;
    savedAddressLabel?: string;
    savedLat?: string;
    savedLng?: string;
    favoritedProviderId?: string;
    favoritedProviderName?: string;
  }>();
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
  const [providerSearchRadius, setProviderSearchRadius] = useState(0);

  const [requestStatus, setRequestStatus] = useState<RequestStatus>('idle');
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
  const [acceptedProvider, setAcceptedProvider] = useState<any>(null);
  const [serviceStartedAt, setServiceStartedAt] = useState<string | null>(null);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const [showRating, setShowRating] = useState(false);

  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

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
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from('service_requests')
          .select('id, status, accepted_by_provider_id, request_latitude, request_longitude, request_details')
          .eq('user_id', user.id)
          .in('status', [...ACTIVE_STATUSES, 'completed'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (cancelled || !data) return;
        setCurrentRequestId(data.id);
        // Only keep tracking status for active requests; completed/cancelled â†’ idle so the service selector works again
        const activeStatuses = ['notified_multiple', 'accepted', 'provider_enroute', 'arriving', 'arrived', 'in_progress', 'work_in_progress'];
        setRequestStatus(activeStatuses.includes(data.status) ? (data.status as RequestStatusDB) : 'idle');
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
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    if (!user || authLoading) return;
    if (userLat && userLng) return;
    getCurrentLocation();
  }, [user, authLoading]);

  // Pre-fill from saved address params
  useEffect(() => {
    if (params.savedLat && params.savedLng) {
      const lat = parseFloat(params.savedLat);
      const lng = parseFloat(params.savedLng);
      if (!isNaN(lat) && !isNaN(lng)) {
        setUserLat(lat);
        setUserLng(lng);
        setMarkerCoords({ lat, lng });
        if (params.savedAddressLabel) {
          setAddress(params.savedAddressLabel);
        }
        selectedAddressRef.current = true;
      }
    }
  }, [params.savedLat, params.savedLng, params.savedAddressLabel]);

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
      const pos = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Location timeout')), 10000)),
      ]);
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setUserLat(lat);
      setUserLng(lng);
      setMarkerCoords({ lat, lng });

      try {
        const results = await Promise.race([
          Location.reverseGeocodeAsync({ latitude: lat, longitude: lng }),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('geocode timeout')), 5000)),
        ]);
        if (results.length > 0) {
          const r = results[0];
          const parts = [r.name, r.street, r.district, r.city, r.region].filter(Boolean);
          setAddress(parts.join(', '));
        }
      } catch {}

      mapRef.current?.animateToRegion({ latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 300);
    } catch (err: any) {
      setSearchMessage(err.message ?? 'Could not get location. Tap retry or enter address manually.');
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

  async function cancelWithReason(reason: string) {
    if (!currentRequestId || !user) return;
    setIsCancelling(true);
    try {
      const updated = await cancelRequest(currentRequestId, user.id, false);

      // Store cancellation reason
      if (reason && reason !== 'skip') {
        await supabase
          .from('service_requests')
          .update({ cancellation_reason: reason })
          .eq('id', currentRequestId);
      }

      // Notify the provider
      if (updated?.accepted_by_provider_id) {
        const reasonLabels: Record<string, string> = {
          'found-better': 'Found another provider',
          'changed-mind': 'Changed my mind',
          'wrong-address': 'Wrong address',
          'too-expensive': 'Too expensive',
          'no-response': 'No response',
          'duplicate': 'Duplicate request',
        };
        const label = reasonLabels[reason] || '';
        const body = label
          ? `Customer cancelled your ${updated.service_type} request. Reason: ${label}`
          : `Customer cancelled your ${updated.service_type} request.`;
        sendPushNotification([updated.accepted_by_provider_id], 'Request Cancelled', body, {
          type: 'cancellation',
          requestId: currentRequestId,
        }).catch(() => {});
      }

      setCurrentRequestId(null);
      setRequestStatus('idle');
      setAcceptedProvider(null);
      setServiceStartedAt(null);
      setSearchMessage('Request cancelled.');
      setShowCancelModal(false);
    } catch (err: any) {
      setSearchMessage(err.message);
    } finally {
      setIsCancelling(false);
    }
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
  const isSearchingProvider = requestStatus === 'finding_provider' || requestStatus === 'notified_multiple';
  const findBusy = isSending || isResolvingAddress || isSearchingProvider;

  useEffect(() => {
    if (!isSearchingProvider || !customerCoordinate) {
      setProviderSearchRadius(0);
      return;
    }

    let frame: number | null = null;
    const animateSearchCircle = () => {
      setProviderSearchRadius((radius) => getNextProviderSearchRadius(radius));
      frame = requestAnimationFrame(animateSearchCircle);
    };

    frame = requestAnimationFrame(animateSearchCircle);
    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [isSearchingProvider, customerCoordinate?.latitude, customerCoordinate?.longitude]);

  if (authLoading) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.cream }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={color.primary} />
      </View>
    </SafeAreaView>
  );
  if (!isSignedIn) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.cream }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl }}>
        <Text variant="h1" center>Sign in required</Text>
        <Text variant="bodyLg" tone="muted" center style={{ marginTop: space.md }}>Go to Profile tab to sign in first.</Text>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.cream }} edges={['top']}>
      <View style={{ flex: 1 }}>
        {/* Map */}
        {showMap && Platform.OS !== 'web' && GOOGLE_MAPS_API_KEY ? (
          <MapView ref={mapRef} style={{ flex: 1 }} provider={PROVIDER_GOOGLE} initialRegion={mapRegion}
            showsUserLocation={!userLat} showsMyLocationButton={false}>
            {routeCoordinates.length > 1 && (
              <>
                <Polyline coordinates={routeCoordinates} strokeColor={color.white} strokeWidth={9} zIndex={1} />
                <Polyline coordinates={routeCoordinates} strokeColor={color.primary} strokeWidth={5} zIndex={2} />
              </>
            )}
            {isSearchingProvider && customerCoordinate && (
              <Circle
                center={customerCoordinate}
                radius={providerSearchRadius}
                strokeColor={PROVIDER_SEARCH_CIRCLE_STROKE}
                strokeWidth={2}
                fillColor={PROVIDER_SEARCH_CIRCLE_FILL}
                zIndex={0}
              />
            )}
            {markerCoords && (
              <Marker
                coordinate={{ latitude: markerCoords.lat, longitude: markerCoords.lng }}
                draggable={isIdle}
                onDragEnd={onMarkerDragEnd}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                  <View style={{
                    width: 20, height: 20, borderRadius: 10, backgroundColor: color.primary,
                    borderWidth: 3, borderColor: color.white,
                    shadowColor: color.navy, shadowOpacity: 0.3, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 4,
                  }} />
                </View>
              </Marker>
            )}
            {providerLocation && <Marker coordinate={{ latitude: providerLocation.latitude, longitude: providerLocation.longitude }} pinColor={color.success} />}
          </MapView>
        ) : showMap ? (
          <View style={{ flex: 1, backgroundColor: color.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="map" size={48} color={color.line} />
            <Text variant="label" tone="muted" style={{ marginTop: space.sm }}>Map available on mobile</Text>
          </View>
        ) : <View style={{ flex: 1, backgroundColor: color.surfaceAlt }} />}

        {/* Bottom Sheet */}
        <View
          style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            height: sheetHeight,
            backgroundColor: color.surface,
            borderTopLeftRadius: radius['2xl'],
            borderTopRightRadius: radius['2xl'],
            shadowColor: color.navy,
            shadowOpacity: 0.14,
            shadowRadius: 28,
            shadowOffset: { width: 0, height: -8 },
            elevation: 14,
          }}
        >
          {/* Drag handle + snap dots */}
          <View style={{ paddingTop: space.md, paddingBottom: space.xs }} {...panResponder.panHandlers}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: color.line, alignSelf: 'center' }} />
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: space.sm }}>
              {[COLLAPSED_HEIGHT, MIDDLE_HEIGHT, EXPANDED_HEIGHT].map((h) => (
                <PressableScale key={h} onPress={() => snapTo(h)}
                  style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: lastSnap.current === h ? color.primary : color.line }} />
              ))}
            </View>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: space['2xl'] }} keyboardShouldPersistTaps="handled">

            {/* Status message (non-searching states) */}
            {searchMessage && !isSearchingProvider && (
              <View style={{
                marginBottom: space.md, borderRadius: radius.md, padding: space.md,
                backgroundColor: requestStatus === 'error' ? color.errorBg : color.successBg,
              }}>
                <Text variant="label" style={{ color: requestStatus === 'error' ? color.error : color.success }}>{searchMessage}</Text>
              </View>
            )}

            {/* Provider tracking card */}
            {showTrackingCard && acceptedProvider && (
              <View style={{ marginBottom: space.md }}>
                <ProviderTrackingCard
                  status={requestStatus} provider={acceptedProvider}
                  liveLocation={providerLocation} userLat={userLat} userLng={userLng}
                  serviceStartedAt={serviceStartedAt}
                  onChat={() => router.push(`/(customer)/chat?peer=${acceptedProvider.id}`)}
                />
              </View>
            )}

            {/* Service type chips */}
            <View style={{ marginBottom: space.lg }}>
              <Text variant="caption" tone="muted" style={{ textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: '700', marginBottom: space.sm }}>Service type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.sm }}>
                {serviceCategories.map((service) => {
                  const active = serviceType === service.name;
                  return (
                    <Chip
                      key={service.name}
                      label={service.name}
                      active={active}
                      onPress={() => { if (isIdle) setServiceType(service.name); }}
                      icon={<View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: active ? color.white : service.accent }} />}
                    />
                  );
                })}
              </ScrollView>
            </View>

            {/* Location */}
            <View style={{ marginBottom: space.lg }}>
              <Text variant="caption" tone="muted" style={{ textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: '700', marginBottom: space.sm }}>Location</Text>
              {isGettingLocation ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm, borderRadius: radius.md, backgroundColor: color.surfaceAlt, paddingVertical: space.md }}>
                  <ActivityIndicator color={color.primary} size="small" />
                  <Text variant="label" tone="muted" style={{ fontWeight: '700' }}>Detecting your location...</Text>
                </View>
              ) : !userLat && !userLng ? (
                <PressableScale onPress={getCurrentLocation} disabled={isGettingLocation}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm, borderRadius: radius.md, backgroundColor: color.errorBg, paddingVertical: space.md }}>
                  <Ionicons name="refresh" size={16} color={color.error} />
                  <Text variant="label" style={{ color: color.error, fontWeight: '700' }}>Tap to retry location</Text>
                </PressableScale>
              ) : null}
              {userLat && userLng && (
                <Text variant="caption" tone="muted" center style={{ marginTop: 4 }}>
                  {userLat.toFixed(4)}, {userLng.toFixed(4)}
                </Text>
              )}
              <View style={{ marginTop: space.sm, gap: space.sm }}>
                <TextField
                  value={address} onChangeText={handleAddressChange} editable={isIdle}
                  placeholder="Search or enter address manually"
                  returnKeyType="search" onSubmitEditing={() => { if (isIdle) resolveManualAddress(); }}
                  error={!!(userLat && userLng) ? false : undefined}
                />
                {isIdle && address.trim().length >= 3 && addressSuggestions.length > 0 && (
                  <Card variant="elevated" padded={false} style={{ overflow: 'hidden' }}>
                    {addressSuggestions.map((item, index) => (
                      <PressableScale key={item.placeId} onPress={() => selectPlaceSuggestion(item)}
                        style={{ minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.md, paddingVertical: space.sm, borderTopWidth: index === 0 ? 0 : 1, borderTopColor: color.line }}>
                        <IconTile size={32} bg={color.cream}>
                          <Ionicons name="location" size={14} color={color.primary} />
                        </IconTile>
                        <View style={{ flex: 1 }}>
                          <Text variant="label" numberOfLines={1} style={{ fontWeight: '700' }}>{item.mainText}</Text>
                          {!!item.secondaryText && <Text variant="caption" tone="muted" numberOfLines={1} style={{ marginTop: 2 }}>{item.secondaryText}</Text>}
                        </View>
                      </PressableScale>
                    ))}
                  </Card>
                )}
              </View>

            </View>

            {/* Action buttons */}
            <View style={{ gap: space.sm }}>
              <Button
                label={
                  isResolvingAddress ? 'Finding Address...'
                  : requestStatus === 'finding_provider' ? 'Finding Providers...'
                  : requestStatus === 'notified_multiple' ? 'Waiting for Response...'
                  : 'Find Available Providers'
                }
                onPress={handleFindProviders}
                disabled={isSending || isResolvingAddress || requestStatus === 'notified_multiple' || requestStatus === 'accepted'}
                icon={findBusy ? <ActivityIndicator color={color.white} size="small" /> : <Ionicons name="search" size={16} color={color.white} />}
              />

              {canCancel && (
                <Button
                  variant="soft"
                  label="Cancel Request"
                  icon={<Ionicons name="close-circle" size={16} color={color.primary} />}
                  onPress={() => setShowCancelModal(true)}
                />
              )}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Rating Modal */}
      <RatingModal visible={showRating} requestId={currentRequestId ?? ''} raterId={user?.id ?? ''} ratedUserId={acceptedProvider?.id ?? ''}
        ratedUserName={acceptedProvider ? `${acceptedProvider.firstName ?? ''} ${acceptedProvider.lastName ?? ''}`.trim() || 'Provider' : 'Provider'}
        onComplete={() => setShowRating(false)} onClose={() => setShowRating(false)} />

      {/* Cancel Reason Modal */}
      <CancelReasonModal
        visible={showCancelModal}
        onCancel={cancelWithReason}
        onSkip={() => cancelWithReason('skip')}
        onClose={() => setShowCancelModal(false)}
        loading={isCancelling}
      />
    </SafeAreaView>
  );
}


