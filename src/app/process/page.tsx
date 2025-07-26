"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { supabase } from '../../../client/supabaseClient';
import {
  MapPin, Briefcase, Search, Loader2, LocateFixed, XCircle, CheckCircle, Phone, MessageSquare, Route, Clock, User as UserIcon, MailOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import { HomeModernIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';
import { useServiceContext } from '../context/ServiceContext';
// Removed: import { Loader } from '@googlemaps/js-api-loader'; // Loader is now in GoogleAutocomplete
import GoogleAutocomplete from '../components/GoogleAutocomplete'; // Import the new GoogleAutocomplete component

type RequestStatus = 'idle' | 'finding_provider' | 'notified' | 'notified_multiple' | 'no_ustaz_found' | 'accepted' | 'rejected' | 'cancelled' | 'completed' | 'error' | 'pending_notification';

interface ProviderInfo {
  user_id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  phoneCountryCode: string;
  email?: string;
  latitude?: number;
  longitude?: number;
}

interface LiveLocation {
  latitude: number;
  longitude: number;
  updated_at: string;
}

declare global {
  interface Window {
    L: any;
    google: any; // Ensure google is declared globally for the Loader to attach to
  }
}

const timeAgo = (dateString: string, t: ReturnType<typeof useTranslations>) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return t('justNow');

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return t('minutes', { count: minutes });

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('hours', { count: hours });

  const days = Math.floor(hours / 24);
  return t('days', { count: days });
};

function ProcessPage() {
  const t = useTranslations('process');
  const { user, isSignedIn, isLoaded } = useSupabaseUser();
  const { address, setAddress, service, setService } = useServiceContext();

  const [userLatitude, setUserLatitude] = useState<number | null>(null);
  const [userLongitude, setUserLongitude] = useState<number | null>(null);
  const [manualPostalCode, setManualPostalCode] = useState<string>('');
  const [requestStatus, setRequestStatus] = useState<RequestStatus>('idle');
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
  const [acceptedProvider, setAcceptedProvider] = useState<ProviderInfo | null>(null);
  const [providerLiveLocation, setProviderLiveLocation] = useState<LiveLocation | null>(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  // Removed: const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false); // State is now in GoogleAutocomplete

  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const userMarkerRef = useRef<any>(null);
  const providerMarkerRef = useRef<any>(null);
  const requestSubscriptionRef = useRef<any>(null);
  const liveLocationSubscriptionRef = useRef<any>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [availableProviders, setAvailableProviders] = useState<ProviderInfo[]>([]);
  const [selectedProviderIds, setSelectedProviderIds] = useState<string[]>([]);
  const [showProviderList, setShowProviderList] = useState<boolean>(false);

  const service_types = [
    "Electrician Service",
    "Plumbing",
    "Carpentry",
    "AC Maintenance",
    "Solar Technician",
  ];

  // Removed: Effect to load Google Maps API (now handled by GoogleAutocomplete component)

  // Callback for GoogleAutocomplete to update address and coordinates
  const handlePlaceSelect = useCallback((
    selectedAddress: string,
    lat: number | null,
    lng: number | null
  ) => {
    setAddress(selectedAddress);
    setUserLatitude(lat);
    setUserLongitude(lng);
    setSearchMessage(null);
    setShowProviderList(false);
    setAvailableProviders([]);
    setSelectedProviderIds([]);
    setManualPostalCode(''); // Clear manual postal code if a place is selected via autocomplete
  }, [setAddress, setUserLatitude, setUserLongitude, setSearchMessage, setShowProviderList, setAvailableProviders, setSelectedProviderIds]);

  const getCurrentLocation = useCallback(async () => {
    if (navigator.geolocation) {
      setRequestStatus('finding_provider');
      setSearchMessage(t('gettingLocation'));
      setAddress(''); // Clear context address, which will clear the GoogleAutocomplete input
      setManualPostalCode('');
      setService('');
      setUserLatitude(null);
      setUserLongitude(null);
      setShowProviderList(false);
      setAvailableProviders([]);
      setSelectedProviderIds([]);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLatitude(position.coords.latitude);
          setUserLongitude(position.coords.longitude);
          setSearchMessage(t('locationDetected'));
          setRequestStatus('idle');
        },
        (error) => {
          console.error("Error getting location:", error);
          setRequestStatus('error');
          let errorMessage = t('locationErrorGeneric');
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = t('locationPermissionDenied');
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = t('locationUnavailable');
              break;
            case error.TIMEOUT:
              errorMessage = t('locationTimeout');
              break;
            default:
              errorMessage = t('locationErrorGeneric');
              break;
          }
          setSearchMessage(errorMessage);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setRequestStatus('error');
      setSearchMessage(t('geolocationNotSupported'));
    }
  }, [t, setAddress, setService, setUserLatitude, setUserLongitude, setSearchMessage, setShowProviderList, setAvailableProviders, setSelectedProviderIds]);

  const geocodeAddress = useCallback(async (addressToGeocode: string, postalCode: string): Promise<{ lat: number; lng: number } | null> => {
    const query = `${addressToGeocode}, ${postalCode}`;
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
      );
      if (!response.ok) {
        console.error(`Nominatim HTTP error: ${response.status}`);
        return null;
      }
      const data = await response.json();
      if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      } else {
        console.warn("No geocoding results found for the given address.");
        return null;
      }
    } catch (error) {
      console.error("Error during geocoding with Nominatim:", error);
      return null;
    }
  }, []);

  const fetchAcceptedProviderDetails = useCallback(async (providerId: string) => {
    try {
      const { data, error } = await supabase
        .from('ustaz_registrations')
        .select('userId, firstName, lastName, phoneNumber, phoneCountryCode, email')
        .eq('userId', providerId)
        .single();

      if (error) throw error;
      setAcceptedProvider({
        user_id: data.userId,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        phoneCountryCode: data.phoneCountryCode,
        email: data.email,
      });
    } catch (error) {
      console.error('Error fetching accepted provider details:', error);
      setAcceptedProvider(null);
    }
  }, []);

  const subscribeToProviderLiveLocation = useCallback((requestId: string) => {
    if (liveLocationSubscriptionRef.current) {
      supabase.removeChannel(liveLocationSubscriptionRef.current);
    }

    const channel = supabase
      .channel(`live_location:${requestId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'live_locations',
          filter: `request_id=eq.${requestId}`,
        },
        (payload) => {
          const newLocation = payload.new as LiveLocation;
          console.log('Live Location Update received:', newLocation);
          setProviderLiveLocation(newLocation);
        }
      )
      .subscribe();

    liveLocationSubscriptionRef.current = channel;
  }, []);

  const cleanupRequestState = useCallback(() => {
    if (requestSubscriptionRef.current) {
      supabase.removeChannel(requestSubscriptionRef.current);
      requestSubscriptionRef.current = null;
    }
    if (liveLocationSubscriptionRef.current) {
      supabase.removeChannel(liveLocationSubscriptionRef.current);
      liveLocationSubscriptionRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    setCurrentRequestId(null);
    setAcceptedProvider(null);
    setProviderLiveLocation(null);
    setAvailableProviders([]);
    setSelectedProviderIds([]);
    setShowProviderList(false);
    if (mapRef.current && window.L) {
      if (userMarkerRef.current) {
        mapRef.current.removeLayer(userMarkerRef.current);
        userMarkerRef.current = null;
      }
      if (providerMarkerRef.current) {
        mapRef.current.removeLayer(providerMarkerRef.current);
        providerMarkerRef.current = null;
      }
    }
    setRequestStatus('idle');
  }, []);

  const cancelServiceRequest = useCallback(async () => {
    if (!currentRequestId || !user || !user.id) {
      setSearchMessage(t('noActiveRequestToCancel'));
      return;
    }

    setRequestStatus('cancelled');
    setSearchMessage(t('requestCancelled'));

    try {
      const { error } = await supabase
        .from('service_requests')
        .update({ status: 'cancelled' })
        .eq('id', currentRequestId)
        .eq('user_id', user.id);

      if (error) throw error;

      cleanupRequestState();
      setSearchMessage(t('requestCancelledSuccessfully'));

    } catch (error: any) {
      console.error('Error cancelling request:', error.message);
      setSearchMessage(`${t('errorCancellingRequest')}: ${error.message}`);
      setRequestStatus('error');
    }
  }, [currentRequestId, user, t, cleanupRequestState]);

  const subscribeToServiceRequest = useCallback((requestId: string) => {
    if (requestSubscriptionRef.current) {
      supabase.removeChannel(requestSubscriptionRef.current);
    }

    const channel = supabase
      .channel(`service_request:${requestId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'service_requests',
          filter: `id=eq.${requestId}`,
        },
        (payload) => {
          const newStatus = (payload.new as any).status;
          const acceptedByProviderId = (payload.new as any).accepted_by_provider_id;
          console.log('Service Request Update received:', payload.new);

          setRequestStatus(newStatus);

          if (newStatus === 'accepted' && acceptedByProviderId) {
            fetchAcceptedProviderDetails(acceptedByProviderId);
            subscribeToProviderLiveLocation(requestId);
            setSearchMessage(t('requestAccepted'));
          } else if (newStatus === 'rejected') {
            setSearchMessage(t('rejected'));
          } else if (newStatus === 'no_ustaz_found') {
            setSearchMessage(payload.new.message || t('noProvidersFound'));
            setShowProviderList(false);
            setAvailableProviders([]);
            setSelectedProviderIds([]);
          } else if (newStatus === 'error_finding_ustaz') {
            setSearchMessage(payload.new.message || t('errorFindingProviders'));
            setShowProviderList(false);
            setAvailableProviders([]);
            setSelectedProviderIds([]);
          } else if (newStatus === 'cancelled' || newStatus === 'completed') {
            setSearchMessage(t(newStatus));
            cleanupRequestState();
          }
        }
      )
      .subscribe();

    requestSubscriptionRef.current = channel;
  }, [t, cleanupRequestState, fetchAcceptedProviderDetails, subscribeToProviderLiveLocation]);

  const fetchAvailableProviders = useCallback(async () => {
    console.log("Attempting to fetch available providers...");
    console.log("Current user state:", { user, isSignedIn, isLoaded });
    console.log("Service from context:", service);

    if (!user || !user.id) {
      setSearchMessage(t("pleaseSignInToViewProviders"));
      setRequestStatus('error');
      console.error("Authentication failed: User or user ID is null.");
      return;
    }
    if (!service) {
      setSearchMessage(t('pleaseSelectService'));
      setRequestStatus('error');
      console.error("Service type not selected.");
      return;
    }

    let finalLatitude = userLatitude;
    let finalLongitude = userLongitude;

    if ((finalLatitude === null || finalLongitude === null) && address.trim() && manualPostalCode.trim()) {
      setSearchMessage(t('geocodingAddress'));
      const geocoded = await geocodeAddress(address, manualPostalCode);
      if (geocoded) {
        finalLatitude = geocoded.lat;
        finalLongitude = geocoded.lng;
        setUserLatitude(geocoded.lat);
        setUserLongitude(geocoded.lng);
        setSearchMessage(t('addressGeocoded'));
      } else {
        setSearchMessage(t('geocodingFailed'));
        setRequestStatus('error');
        return;
      }
    }

    if (finalLatitude === null || finalLongitude === null) {
      setSearchMessage(t('noValidLocation'));
      setRequestStatus('error');
      return;
    }

    setRequestStatus('finding_provider');
    setSearchMessage(t('fetchingProvidersList'));
    setAvailableProviders([]);
    setSelectedProviderIds([]);
    setShowProviderList(false);

    try {
      const response = await fetch('/api/get-available-providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          serviceType: service,
          userLat: finalLatitude,
          userLon: finalLongitude,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch available providers.');
      }

      setAvailableProviders(data.providers);
      setShowProviderList(true);
      setRequestStatus('idle');
      setSearchMessage(data.providers.length > 0 ? t('selectProvidersToNotify') : t('noProvidersForService'));

    } catch (error: any) {
      console.error('Error fetching available providers:', error);
      setRequestStatus('error');
      setSearchMessage(`Error: ${error.message}`);
    }
  }, [user, service, userLatitude, userLongitude, address, manualPostalCode, geocodeAddress, t, isSignedIn, isLoaded]);

  const sendRequestToSelectedProviders = useCallback(async () => {
    if (selectedProviderIds.length === 0) {
      setSearchMessage(t('pleaseSelectAtLeastOneProvider'));
      setRequestStatus('error');
      return;
    }
    if (!user || !user.id) {
      setSearchMessage(t("pleaseSignInToRequestService"));
      setRequestStatus('error');
      return;
    }

    let finalLatitude = userLatitude;
    let finalLongitude = userLongitude;

    if ((finalLatitude === null || finalLongitude === null) && address.trim() && manualPostalCode.trim()) {
      setSearchMessage(t('geocodingAddress'));
      const geocoded = await geocodeAddress(address, manualPostalCode);
      if (geocoded) {
        finalLatitude = geocoded.lat;
        finalLongitude = geocoded.lng;
        setUserLatitude(geocoded.lat);
        setUserLongitude(geocoded.lng);
        setSearchMessage(t('addressGeocoded'));
      } else {
        setSearchMessage(t('geocodingFailed'));
        setRequestStatus('error');
        return;
      }
    }

    if (finalLatitude === null || finalLongitude === null) {
      setSearchMessage(t('noValidLocation'));
      setRequestStatus('error');
      return;
    }

    setRequestStatus('finding_provider');
    setSearchMessage(t('notifyingSelectedProviders'));

    try {
      const response = await fetch('/api/request-service', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          serviceType: service,
          userLat: finalLatitude,
          userLon: finalLongitude,
          requestDetails: "User needs service at their location.",
          selectedProviderIds: selectedProviderIds,
          requestId: currentRequestId,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to initiate service request.');
      }

      setCurrentRequestId(data.requestId);
      setRequestStatus(data.status);
      setSearchMessage(data.message);

      if (data.status === 'notified_multiple' || data.status === 'notified') {
        subscribeToServiceRequest(data.requestId);
        setShowProviderList(false);
      } else if (data.status === 'no_ustaz_found' || data.status === 'error_finding_ustaz') {
        console.log("No Ustaz found or error with selected ones. User can retry manually.");
        setShowProviderList(false);
      }

    } catch (error: any) {
      console.error('Error initiating service request to selected providers:', error);
      setRequestStatus('error');
      setSearchMessage(`Error: ${error.message}`);
      setShowProviderList(false);
    }
  }, [user, service, userLatitude, userLongitude, selectedProviderIds, currentRequestId, subscribeToServiceRequest, t, address, manualPostalCode, geocodeAddress]);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) {
      return;
    }

    const currentMapContainer = mapContainerRef.current;

    import('leaflet').then((L) => {
      if (mapRef.current || !currentMapContainer) {
        return;
      }

      mapRef.current = L.map(currentMapContainer).setView([24.8607, 67.0011], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current);

      if (userLatitude === null || userLongitude === null) {
        userMarkerRef.current = window.L.marker([24.8607, 67.0011]).addTo(mapRef.current)
          .bindPopup(t('defaultMapLocation')).openPopup();
      }

      setMapInitialized(true);

    }).catch(error => console.error("Failed to load Leaflet:", error));

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        setMapInitialized(false);
      }
      cleanupRequestState();
    };
  }, [mapContainerRef.current, userLatitude, userLongitude, t, cleanupRequestState]);

  useEffect(() => {
    if (mapRef.current && window.L && mapInitialized) {
      if (userLatitude !== null && userLongitude !== null) {
        const userLatLng = [userLatitude, userLongitude];
        if (!userMarkerRef.current) {
          userMarkerRef.current = window.L.marker(userLatLng).addTo(mapRef.current)
            .bindPopup(t('yourLocation')).openPopup();
        } else {
          userMarkerRef.current.setLatLng(userLatLng);
        }
        mapRef.current.setView(userLatLng, mapRef.current.getZoom() > 10 ? mapRef.current.getZoom() : 13);
      } else if (userMarkerRef.current) {
        mapRef.current.removeLayer(userMarkerRef.current);
        userMarkerRef.current = null;
      }

      if (providerLiveLocation && acceptedProvider) {
        const providerLatLng = [providerLiveLocation.latitude, providerLiveLocation.longitude];
        if (!providerMarkerRef.current) {
          const providerIcon = window.L.divIcon({
            className: 'custom-provider-icon',
            html: `<div class="flex items-center justify-center bg-[#db4b0d] text-white rounded-full p-2 shadow-lg">
                     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucuce-truck">
                       <path d="M5 17H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-1"/><path d="M18 17h2a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-1"/><path d="M10 17H7"/><path d="M6 21v-4"/><path d="M19 21v-4"/><circle cx="6" cy="17" r="2"/><circle cx="19" cy="17" r="2"/>
                     </svg>
                   </div>`,
            iconSize: [40, 40],
            iconAnchor: [20, 40]
          });
          providerMarkerRef.current = window.L.marker(providerLatLng, { icon: providerIcon }).addTo(mapRef.current)
            .bindPopup(`<b>${acceptedProvider.firstName} ${acceptedProvider.lastName}</b><br>${t('providerLocation')}`)
            .openPopup();
        } else {
          providerMarkerRef.current.setLatLng(providerLatLng);
          providerMarkerRef.current.getPopup().setContent(`<b>${acceptedProvider.firstName} ${acceptedProvider.lastName}</b><br>${t('providerLocation')}<br>${timeAgo(providerLiveLocation.updated_at, t)}`);
        }
        if (userLatitude !== null && userLongitude !== null) {
          const group = new window.L.featureGroup([userMarkerRef.current, providerMarkerRef.current]);
          mapRef.current.fitBounds(group.getBounds().pad(0.5));
        } else {
          mapRef.current.setView(providerLatLng, mapRef.current.getZoom() > 10 ? mapRef.current.getZoom() : 13);
        }
      } else if (providerMarkerRef.current) {
        mapRef.current.removeLayer(providerMarkerRef.current);
        providerMarkerRef.current = null;
      }
    }
  }, [userLatitude, userLongitude, providerLiveLocation, acceptedProvider, t, mapInitialized]);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      setSearchMessage(t("pleaseSignInToAccessPage"));
    }
  }, [isLoaded, isSignedIn, t]);

  const canSearch = service && (
    (userLatitude !== null && userLongitude !== null) ||
    (address.trim() !== "" && manualPostalCode.trim() !== "")
  );

  const canCancel = currentRequestId && (requestStatus === 'notified_multiple' || requestStatus === 'finding_provider' || requestStatus === 'accepted' || requestStatus === 'pending_notification');

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-[#db4b0d]" />
        <span className="ml-4 text-gray-700">Loading user data...</span>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden p-8 md:p-10 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">Please sign in to access the service request page.</p>
          <Button asChild className="bg-[#db4b0d] hover:bg-[#a93a0b] text-white px-6 py-3 rounded-xl font-semibold">
            <Link href="/auth/login">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-white flex flex-col items-center py-8">
        <div className="max-w-7xl mx-auto px-6 w-full flex flex-col lg:flex-row items-start justify-center gap-x-12">
          {/* Main Content Section */}
          <div className="w-full lg:w-1/2 xl:w-2/5 p-8 md:p-10 mb-8 lg:mb-0rounded-3xl">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-gray-800 bg-clip-text bg-gradient-to-r from-gray-800 to-[#db4b0d] mb-3">
                Find Providers
              </h2>
              <p className="text-gray-600 text-lg">
                {t('selectServiceAndLocation')}
              </p>
            </div>

            <div className="space-y-6 mb-8">
              {/* Service Type Selection */}
              <div>
                <Label htmlFor="service_type" className="text-sm font-semibold text-gray-700 mb-2 block">
                  <Briefcase className="inline-block w-4 h-4 mr-2 text-[#db4b0d]" />
                  {t('serviceType')} <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={service}
                  onValueChange={(value) => {
                    setService(value);
                    setShowProviderList(false);
                    setAvailableProviders([]);
                    setSelectedProviderIds([]);
                  }}
                  disabled={requestStatus !== 'idle' && requestStatus !== 'error' && requestStatus !== 'no_ustaz_found'}
                >
                  <SelectTrigger
                    id="service_type"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm transition focus:outline-none focus:ring-0 focus:border-[#db4b0d] bg-white text-gray-800 hover:border-gray-400"
                  >
                    <SelectValue placeholder={t('selectServicePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-300 rounded-xl shadow-sm text-gray-800">
                    {service_types.map((serviceType) => (
                      <SelectItem key={serviceType} value={serviceType} className="hover:bg-gray-100 focus:bg-gray-100">
                        {serviceType}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Location Section */}
              <div className="p-4 rounded-xl border border-gray-200 shadow-sm space-y-4 bg-gray-50">
                <h3 className="flex items-center text-lg font-semibold text-[#db4b0d] mb-4">
                  <MapPin className="w-5 h-5 mr-2 text-[#db4b0d]" />
                  {t('yourLocation')}
                </h3>

                {/* Get Current Location */}
                <div className="border-b border-gray-200 pb-4 mb-4">
                  <p className="text-sm text-gray-600 mb-3">
                    {t('locationInstructions')}
                  </p>
                  <Button
                    onClick={getCurrentLocation}
                    disabled={requestStatus !== 'idle' && requestStatus !== 'error' && requestStatus !== 'no_ustaz_found'}
                    className="w-full group bg-[#db4b0d] hover:bg-[#a93a0b] text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center justify-center"
                  >
                    {(requestStatus === 'finding_provider' && searchMessage === t('gettingLocation')) ? (
                      <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                    ) : (
                      <LocateFixed className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                    )}
                    {t('getCurrentLocation')}
                  </Button>
                  {userLatitude !== null && userLongitude !== null && (
                    <p className="text-sm text-gray-600 text-center mt-2">
                      {t('coordinates')}: Lat {userLatitude.toFixed(4)}, Lng{" "}
                      {userLongitude.toFixed(4)}
                    </p>
                  )}
                </div>

                {/* Or divider */}
                <div className="relative flex justify-center text-xs uppercase my-4">
                  <span className="bg-gray-50 px-2 text-gray-500">{t('orEnterManually')}</span>
                </div>

                {/* Manual Address Input - Using GoogleAutocomplete Component */}
                <div>
                  <Label htmlFor="manual_address" className="text-sm font-semibold text-gray-700 mb-2 block">
                    <HomeModernIcon className="inline-block w-4 h-4 mr-2 text-[#db4b0d]" />
                    {t('streetAddress')}
                  </Label>
                  {/* GoogleAutocomplete now handles its own loading state */}
                  <GoogleAutocomplete
                    onPlaceSelect={handlePlaceSelect}
                    value={address}
                    disabled={requestStatus !== 'idle' && requestStatus !== 'error' && requestStatus !== 'no_ustaz_found'}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm transition focus:outline-none focus:ring-0 focus:border-[#db4b0d] bg-white text-gray-800 placeholder:text-gray-500"
                  />
                </div>
                <div className="mt-4">
                  <Label htmlFor="manual_postal_code" className="text-sm font-semibold text-gray-700 mb-2 block">
                    <MailOpen className="inline-block w-4 h-4 mr-2 text-[#db4b0d]" />
                    {t('postalCode')} (Optional)
                  </Label>
                  <Input
                    id="manual_postal_code"
                    type="text"
                    value={manualPostalCode}
                    onChange={(e) => {
                      setManualPostalCode(e.target.value);
                      setUserLatitude(null);
                      setUserLongitude(null);
                      setAddress(''); // Clear address if user starts typing manually
                      setSearchMessage(null);
                      setShowProviderList(false);
                      setAvailableProviders([]);
                      setSelectedProviderIds([]);
                    }}
                    placeholder={t('enterPostalCode')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm transition focus:outline-none focus:ring-0 focus:border-[#db4b0d] bg-white text-gray-800 placeholder:text-gray-500"
                    disabled={requestStatus !== 'idle' && requestStatus !== 'error' && requestStatus !== 'no_ustaz_found'}
                  />
                </div>

                {searchMessage && (
                  <p className={`text-sm text-center mt-4 ${requestStatus === 'error' ? "text-red-500" : "text-gray-600"}`}>
                    {searchMessage}
                  </p>
                )}
              </div>

              {/* Action Buttons - Modified to fetch providers first */}
              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <Button
                  onClick={fetchAvailableProviders}
                  disabled={!canSearch || requestStatus === 'finding_provider' || requestStatus === 'notified_multiple' || requestStatus === 'accepted'}
                  className="flex-1 group bg-[#db4b0d] hover:bg-[#a93a0b] text-white px-8 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center justify-center"
                >
                  {(requestStatus === 'finding_provider' && searchMessage === t('fetchingProvidersList')) ? (
                    <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                  ) : (
                    <Search className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                  )}
                  {/* {t('findAvailableProviders')} */}
                  Find Available Providers
                </Button>

                <Button
                  onClick={cancelServiceRequest}
                  disabled={!canCancel}
                  variant="outline"
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-[#db4b0d] px-8 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center justify-center"
                >
                  <XCircle className="w-5 h-5 mr-2" />
                  {t('cancelRequest')}
                </Button>
              </div>

              {/* NEW: Provider Selection Section */}
              {requestStatus === 'idle' && showProviderList && availableProviders.length > 0 && (
                <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="text-xl font-bold text-[#db4b0d] mb-4">{t('selectProviders')}</h3>
                  <p className="text-gray-600 mb-4">{t('chooseProvidersToNotify')}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableProviders.map((provider) => (
                      <div key={provider.user_id} className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                        <input
                          type="checkbox"
                          id={`provider-${provider.user_id}`}
                          checked={selectedProviderIds.includes(provider.user_id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProviderIds((prev) => [...prev, provider.user_id]);
                            } else {
                              setSelectedProviderIds((prev) => prev.filter((id) => id !== provider.user_id));
                            }
                          }}
                          className="form-checkbox h-5 w-5 text-[#db4b0d] rounded border-gray-300 bg-white checked:bg-[#db4b0d] checked:border-transparent focus:ring-[#db4b0d]"
                        />
                        <label htmlFor={`provider-${provider.user_id}`} className="flex-1 text-gray-800 font-medium cursor-pointer">
                          {provider.firstName} {provider.lastName} ({provider.phoneCountryCode} {provider.phoneNumber})
                        </label>
                      </div>
                    ))}
                  </div>
                  {/* <Button
                    onClick={sendRequestToSelectedProviders}
                    disabled={selectedProviderIds.length === 0 || requestStatus === 'finding_provider' || requestStatus === 'notified_multiple' || requestStatus === 'accepted'}
                    className="w-full mt-6 group bg-[#db4b0d] hover:bg-[#a93a0b] text-white px-8 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center justify-center"
                  >
                    {(requestStatus === 'finding_provider' && searchMessage === t('notifyingSelectedProviders')) ? (
                      <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                    ) : (
                      <Search className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                    )}
                    {t('sendRequestToSelected')}
                  </Button> */}
                </div>
              )}

              {/* If no providers are found for the selected service type */}
              {showProviderList && availableProviders.length === 0 && requestStatus !== 'finding_provider' && (
                <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200 shadow-sm text-center">
                  <p className="text-lg text-gray-600 font-semibold">{t('noProvidersForService')}</p>
                  <p className="text-gray-500 mt-2">{t('tryDifferentServiceOrLocation')}</p>
                </div>
              )}

              {/* Request Status Display (after initial selection and request sent) */}
              {currentRequestId && (requestStatus === 'notified_multiple' || requestStatus === 'accepted' || requestStatus === 'rejected' || requestStatus === 'cancelled' || requestStatus === 'completed' || requestStatus === 'no_ustaz_found' || requestStatus === 'error' || (requestStatus === 'finding_provider' && searchMessage === t('notifyingSelectedProviders'))) && (
                <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200 shadow-sm text-center">
                  <h3 className="text-xl font-bold text-[#db4b0d] mb-3">{t('requestStatus')}</h3>
                  <p className="text-lg font-semibold text-gray-700 flex items-center justify-center">
                    {requestStatus === 'finding_provider' && <Loader2 className="h-5 w-5 mr-2 animate-spin text-[#db4b0d]" />}
                    {requestStatus === 'notified_multiple' && <Clock className="h-5 w-5 mr-2 text-[#db4b0d]" />}
                    {requestStatus === 'accepted' && <CheckCircle className="h-5 w-5 mr-2 text-green-500" />}
                    {requestStatus === 'rejected' && <XCircle className="h-5 w-5 mr-2 text-red-500" />}
                    {requestStatus === 'cancelled' && <XCircle className="h-5 w-5 mr-2 text-red-500" />}
                    {requestStatus === 'completed' && <CheckCircle className="h-5 w-5 mr-2 text-green-500" />}
                    {(requestStatus === 'error' || requestStatus === 'no_ustaz_found') && <XCircle className="h-5 w-5 mr-2 text-red-500" />}
                    {searchMessage || t(requestStatus)}
                  </p>
                  {requestStatus === 'accepted' && acceptedProvider && (
                    <div className="mt-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                      <h4 className="text-xl font-bold text-gray-800 mb-3">{t('providerDetails')}</h4>
                      <p className="text-lg font-semibold text-gray-700 flex items-center justify-center">
                        <UserIcon className="w-5 h-5 mr-2 text-[#db4b0d]" />
                        {acceptedProvider.firstName} {acceptedProvider.lastName}
                      </p>
                      <div className="flex justify-center gap-4 mt-4">
                        <a href={`tel:${acceptedProvider.phoneCountryCode}${acceptedProvider.phoneNumber}`} className="flex items-center text-[#db4b0d] hover:text-[#a93a0b] font-medium">
                          <Phone className="w-5 h-5 mr-2" /> {t('callProvider')}
                        </a>
                        <Button variant="ghost" className="flex items-center text-gray-700 hover:text-[#db4b0d] font-medium">
                          <MessageSquare className="w-5 h-5 mr-2" /> {t('chatWithProvider')}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Map Section */}
          <div className="w-full lg:w-1/2 xl:w-3/5">
            <h3 className="text-2xl font-bold text-gray-800 text-center mb-6">
              {t('providerLocation')}
            </h3>
            <div ref={mapContainerRef} className="w-full h-[400px] rouned-xl shadow-xl">
            </div>
            {providerLiveLocation && acceptedProvider && (
              <p className="text-sm text-gray-600 text-center mt-4">
                {t('providerLocation')}: Updated {timeAgo(providerLiveLocation.updated_at, t)}
              </p>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default ProcessPage;
