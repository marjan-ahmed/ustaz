"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl'; // For multi-language support
import { supabase } from '../../../client/supabaseClient'; // Client-side Supabase instance
import {
  MapPin, Briefcase, Search, Loader2, LocateFixed, XCircle, CheckCircle, Phone, MessageSquare, Route, Clock, User as UserIcon, MailOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import { HomeModernIcon } from '@heroicons/react/24/solid'; // Assuming this is correct for Home icon
import Link from 'next/link';
import { useSupabaseUser } from '@/hooks/useSupabaseUser'; // Using your custom Supabase user hook

// Define types for service request status and provider info
// Updated RequestStatus to include 'notified_multiple' from backend
type RequestStatus = 'idle' | 'finding_provider' | 'notified' | 'notified_multiple' | 'no_ustaz_found' | 'accepted' | 'rejected' | 'cancelled' | 'completed' | 'error' | 'pending_notification';


interface ProviderInfo {
  user_id: string; // Supabase auth.uid
  firstName: string;
  lastName: string;
  phoneNumber: string;
  phoneCountryCode: string;
  email?: string;
  latitude?: number; // Added for displaying on map or filtering
  longitude?: number; // Added for displaying on map or filtering
}

interface LiveLocation {
  latitude: number;
  longitude: number;
  updated_at: string;
}

// Global declaration for Leaflet (L)
declare global {
  interface Window {
    L: any; // Declare L for Leaflet
  }
}

// Utility function to format time ago
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
  const t = useTranslations('process'); // Translations for this page
  const { user, isSignedIn, isLoaded } = useSupabaseUser(); // Using your custom Supabase user hook
  const [selectedServiceType, setSelectedServiceType] = useState<string>('');
  const [userLatitude, setUserLatitude] = useState<number | null>(null);
  const [userLongitude, setUserLongitude] = useState<number | null>(null);
  const [manualAddress, setManualAddress] = useState<string>('');
  const [manualPostalCode, setManualPostalCode] = useState<string>('');
  const [requestStatus, setRequestStatus] = useState<RequestStatus>('idle');
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
  const [acceptedProvider, setAcceptedProvider] = useState<ProviderInfo | null>(null);
  const [providerLiveLocation, setProviderLiveLocation] = useState<LiveLocation | null>(null);
  const [mapInitialized, setMapInitialized] = useState(false); // State to track map initialization
  const mapRef = useRef<any>(null); // Ref for the Leaflet map instance
  const mapContainerRef = useRef<HTMLDivElement>(null); // Ref for the map container div
  const userMarkerRef = useRef<any>(null); // Ref for user's map marker
  const providerMarkerRef = useRef<any>(null); // Ref for provider's map marker
  const requestSubscriptionRef = useRef<any>(null); // Ref for service_requests subscription
  const liveLocationSubscriptionRef = useRef<any>(null); // Ref for live_locations subscription
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Ref for retry timeout

  // New states for provider selection
  const [availableProviders, setAvailableProviders] = useState<ProviderInfo[]>([]); // Providers to display for selection
  const [selectedProviderIds, setSelectedProviderIds] = useState<string[]>([]); // User selected provider IDs
  const [showProviderList, setShowProviderList] = useState<boolean>(false); // To conditionally render provider list UI


  const service_types = [
    "Electrician Service",
    "Plumbing",
    "Carpentry",
    "AC Maintenance",
    "Solar Technician",
  ];

  // Function to get current location using browser's Geolocation API
  const getCurrentLocation = useCallback(async () => {
    if (navigator.geolocation) {
      setRequestStatus('finding_provider'); // Use a more general status for location finding
      setSearchMessage(t('gettingLocation'));
      setManualAddress('');
      setManualPostalCode('');
      setUserLatitude(null); // Clear previous GPS coords
      setUserLongitude(null);
      setShowProviderList(false); // Hide provider list when getting new location

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLatitude(position.coords.latitude);
          setUserLongitude(position.coords.longitude);
          setSearchMessage(t('locationDetected'));
          setRequestStatus('idle'); // Back to idle after getting location, ready for search
        },
        (error) => {
          console.error("Error getting location:", error);
          setRequestStatus('error'); // Set error status
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
          }
          setSearchMessage(errorMessage);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setRequestStatus('error');
      setSearchMessage(t('geolocationNotSupported'));
    }
  }, [t]);

  // Function to geocode a manual address using OpenStreetMap Nominatim API
  const geocodeAddress = useCallback(async (address: string, postalCode: string): Promise<{ lat: number; lng: number } | null> => {
    const query = `${address}, ${postalCode}`;
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

  // Fetch accepted provider's details (moved up for declaration order)
  const fetchAcceptedProviderDetails = useCallback(async (providerId: string) => {
    try {
      // Note: This fetch directly from Supabase client assumes RLS allows authenticated users
      // to read ustaz_registrations. If RLS is stricter, you might need an API route.
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

  // Supabase Realtime Subscription for Provider Live Location (moved up for declaration order)
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

  // Function to cancel the current service request (MOVED UP)
  const cancelServiceRequest = useCallback(async () => {
    if (!currentRequestId || !user || !user.id) return;

    setRequestStatus('cancelled');
    setSearchMessage(t('requestCancelled'));

    try {
      // Update the request status in Supabase directly from client (RLS must allow this)
      const { error } = await supabase
        .from('service_requests')
        .update({ status: 'cancelled' })
        .eq('id', currentRequestId)
        .eq('user_id', user.id); // Ensure only the owner can cancel

      if (error) throw error;

      // Clean up subscriptions and state
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
      setAvailableProviders([]); // Clear providers list
      setSelectedProviderIds([]); // Clear selected providers
      setShowProviderList(false); // Hide provider list
      // Reset map markers
      if (userMarkerRef.current && window.L) {
        mapRef.current.removeLayer(userMarkerRef.current);
        userMarkerRef.current = null;
      }
      if (providerMarkerRef.current && window.L) {
        mapRef.current.removeLayer(providerMarkerRef.current);
        providerMarkerRef.current = null;
      }

    } catch (error: any) {
      console.error('Error cancelling request:', error.message);
      setSearchMessage(`Error cancelling request: ${error.message}`);
      setRequestStatus('error'); // Revert status if cancellation fails
    }
  }, [currentRequestId, user, t]);


  // Supabase Realtime Subscription for Service Request Status (Moved up for declaration order)
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

          setRequestStatus(newStatus); // Update local state with new status

          if (newStatus === 'accepted' && acceptedByProviderId) {
            // Fetch provider details and start live location tracking
            fetchAcceptedProviderDetails(acceptedByProviderId);
            subscribeToProviderLiveLocation(requestId);
          } else if (newStatus === 'rejected') {
            // If one provider rejected, we don't auto-retry here as multiple were notified
            // The backend should manage if *all* notified providers reject or timeout.
            setSearchMessage(t('rejected'));
            // No auto-retry here. User will wait for another acceptance or 'no_ustaz_found' from backend.
          } else if (newStatus === 'no_ustaz_found' || newStatus === 'error_finding_ustaz') {
            setSearchMessage(payload.new.message || t('noProvidersFound'));
            // Optionally, show a retry button or allow manual retry
          } else if (newStatus === 'cancelled' || newStatus === 'completed') {
            // Request finished, clean up
            cancelServiceRequest(); // This will clear state and subscriptions
          }
        }
      )
      .subscribe();

    requestSubscriptionRef.current = channel;
  }, [t, cancelServiceRequest, fetchAcceptedProviderDetails, subscribeToProviderLiveLocation]);


  // New function to fetch available providers based on service type and location
  const fetchAvailableProviders = useCallback(async () => {
    console.log("Attempting to fetch available providers...");
    console.log("Current user state:", { user, isSignedIn, isLoaded });
    console.log("selectedServiceType state:", selectedServiceType); // Added log

    if (!user || !user.id) {
        setSearchMessage(t("pleaseSignInToViewProviders"));
        setRequestStatus('error');
        console.error("Authentication failed: User or user ID is null.");
        return;
    }
    if (!selectedServiceType) {
        setSearchMessage(t('pleaseSelectService'));
        setRequestStatus('error');
        console.error("Service type not selected.");
        return;
    }

    let finalLatitude = userLatitude;
    let finalLongitude = userLongitude;

    // Use existing geocoding logic if manual address is used
    if ((finalLatitude === null || finalLongitude === null) && manualAddress.trim() && manualPostalCode.trim()) {
        setSearchMessage(t('geocodingAddress'));
        const geocoded = await geocodeAddress(manualAddress, manualPostalCode);
        if (geocoded) {
            finalLatitude = geocoded.lat;
            finalLongitude = geocoded.lng;
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

    setRequestStatus('finding_provider'); // Temporary status
    setSearchMessage(t('fetchingProvidersList'));
    setAvailableProviders([]); // Clear previous list
    setSelectedProviderIds([]); // Clear previous selections
    setShowProviderList(false); // Hide the list until fetched

    try {
        // Call a new API route to get available providers for the selected service type
        // This API route will query ustaz_registrations based on serviceType and availability
        const response = await fetch('/api/get-available-providers', { // You need to create this new API route
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                serviceType: selectedServiceType,
                userLat: finalLatitude, // Pass user location for potential future proximity filtering in backend
                userLon: finalLongitude,
            }),
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch available providers.');
        }

        setAvailableProviders(data.providers); // Assuming data.providers is an array of ProviderInfo
        setShowProviderList(true); // Show the provider selection UI
        setRequestStatus('idle'); // Back to idle after fetching list
        setSearchMessage(data.providers.length > 0 ? t('selectProvidersToNotify') : t('noProvidersForService'));

    } catch (error: any) {
        console.error('Error fetching available providers:', error);
        setRequestStatus('error');
        setSearchMessage(`Error: ${error.message}`);
    }
  }, [user, selectedServiceType, userLatitude, userLongitude, manualAddress, manualPostalCode, geocodeAddress, t, isSignedIn, isLoaded]);


  // New function to send request to *selected* providers
  const sendRequestToSelectedProviders = useCallback(async () => {
      if (selectedProviderIds.length === 0) {
          setSearchMessage(t('pleaseSelectAtLeastOneProvider'));
          setRequestStatus('error');
          return;
      }
      if (!user || !user.id) {
          setSearchMessage("Please sign in to request a service.");
          setRequestStatus('error');
          return;
      }
      // Re-verify location or use stored ones
      const finalLatitude = userLatitude;
      const finalLongitude = userLongitude;

      if (finalLatitude === null || finalLongitude === null) {
          setSearchMessage(t('noValidLocation'));
          setRequestStatus('error');
          return;
      }

      setRequestStatus('finding_provider'); // Status for sending request
      setSearchMessage(t('notifyingSelectedProviders'));

      try {
          const response = await fetch('/api/request-service', { // This API will now accept multiple provider IDs
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                  user_id: user.id,
                  serviceType: selectedServiceType,
                  userLat: finalLatitude,
                  userLon: finalLongitude,
                  requestDetails: "User needs service at their location.",
                  // NEW: Pass the array of selected provider IDs
                  selectedProviderIds: selectedProviderIds,
                  requestId: currentRequestId, // Pass existing requestId if re-notifying
              }),
          });

          const data = await response.json();
          if (!response.ok) {
              throw new Error(data.message || 'Failed to initiate service request.');
          }

          setCurrentRequestId(data.requestId);
          setRequestStatus(data.status); // Expect 'notified_multiple' or 'no_ustaz_found'
          setSearchMessage(data.message);

          // If status is 'notified_multiple', start listening for changes to this request
          if (data.status === 'notified_multiple') {
              subscribeToServiceRequest(data.requestId);
          } else if (data.status === 'no_ustaz_found' || data.status === 'error_finding_ustaz') {
              console.log("No Ustaz found or error with selected ones. User can retry manually.");
          }

      } catch (error: any) {
          console.error('Error initiating service request to selected providers:', error);
          setRequestStatus('error');
          setSearchMessage(`Error: ${error.message}`);
      }
  }, [user, selectedServiceType, userLatitude, userLongitude, selectedProviderIds, currentRequestId, subscribeToServiceRequest, t]);


  // Initialize Map (Leaflet)
  useEffect(() => {
    // Only load Leaflet client-side and if mapContainerRef.current is available
    if (typeof window === 'undefined' || !mapContainerRef.current) {
      return; // Exit if not client-side or container not ready
    }

    // Capture the current ref value for use inside the promise callback
    const currentMapContainer = mapContainerRef.current;

    // Dynamically import Leaflet to ensure it's only loaded client-side
    import('leaflet').then((L) => {
      // Only initialize the map if it hasn't been initialized already
      // And ensure the container is still valid (in case component unmounted quickly)
      if (mapRef.current || !currentMapContainer) {
        return;
      }

      // Initialize map on the ref's current DOM element
      mapRef.current = L.map(currentMapContainer).setView([24.8607, 67.0011], 13); // Default to Karachi, Pakistan

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current);

      // Add default marker for Karachi if no user location initially
      if (userLatitude === null || userLongitude === null) {
        userMarkerRef.current = L.marker([24.8607, 67.0011]).addTo(mapRef.current)
          .bindPopup(t('defaultMapLocation')).openPopup();
      }

      setMapInitialized(true); // Set map as initialized after successful creation

    }).catch(error => console.error("Failed to load Leaflet:", error));

    // Cleanup function for map
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        setMapInitialized(false); // Reset mapInitialized on unmount
      }
      // Clean up subscriptions on unmount
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
    };
  }, [mapContainerRef.current, userLatitude, userLongitude, t]); // Removed mapInitialized from dependencies


  // Update map view and markers when user/provider location changes
  useEffect(() => {
    // Only proceed if the map is initialized and Leaflet is loaded
    if (mapRef.current && window.L && mapInitialized) { // Ensure mapInitialized is true
      // Update user marker
      if (userLatitude !== null && userLongitude !== null) {
        const userLatLng = [userLatitude, userLongitude];
        if (!userMarkerRef.current) {
          userMarkerRef.current = window.L.marker(userLatLng).addTo(mapRef.current)
            .bindPopup(t('yourLocation')).openPopup();
        } else {
          userMarkerRef.current.setLatLng(userLatLng);
        }
        // Center map on user, maintain zoom if high, otherwise set to 13
        mapRef.current.setView(userLatLng, mapRef.current.getZoom() > 10 ? mapRef.current.getZoom() : 13);
      } else if (userMarkerRef.current) {
        // Remove user marker if coordinates are cleared
        mapRef.current.removeLayer(userMarkerRef.current);
        userMarkerRef.current = null;
      }

      // Update provider marker
      if (providerLiveLocation && acceptedProvider) {
        const providerLatLng = [providerLiveLocation.latitude, providerLiveLocation.longitude];
        if (!providerMarkerRef.current) {
          providerMarkerRef.current = window.L.divIcon({
              className: 'custom-provider-icon',
              html: `<div class="flex items-center justify-center bg-blue-600 text-white rounded-full p-2 shadow-lg">
                       <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucuce-truck">
                         <path d="M5 17H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-1"/><path d="M18 17h2a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-1"/><path d="M10 17H7"/><path d="M6 21v-4"/><path d="M19 21v-4"/><circle cx="6" cy="17" r="2"/><circle cx="19" cy="17" r="2"/>
                       </svg>
                     </div>`,
              iconSize: [40, 40],
              iconAnchor: [20, 40]
            });
          providerMarkerRef.current = window.L.marker(providerLatLng, { icon: providerMarkerRef.current }).addTo(mapRef.current)
            .bindPopup(`<b>${acceptedProvider.firstName} ${acceptedProvider.lastName}</b><br>${t('providerLocation')}`)
            .openPopup();
        } else {
          providerMarkerRef.current.setLatLng(providerLatLng);
          providerMarkerRef.current.getPopup().setContent(`<b>${acceptedProvider.firstName} ${acceptedProvider.lastName}</b><br>${t('providerLocation')}<br>${timeAgo(providerLiveLocation.updated_at, t)}`);
        }
        // Adjust map bounds to include both markers if both exist
        if (userLatitude !== null && userLongitude !== null) {
          const group = new window.L.featureGroup([userMarkerRef.current, providerMarkerRef.current]);
          mapRef.current.fitBounds(group.getBounds().pad(0.5)); // pad ensures markers are not on the edge
        } else {
          mapRef.current.setView(providerLatLng, mapRef.current.getZoom() > 10 ? mapRef.current.getZoom() : 13);
        }
      } else if (providerMarkerRef.current) {
        mapRef.current.removeLayer(providerMarkerRef.current);
        providerMarkerRef.current = null;
      }
    }
  }, [userLatitude, userLongitude, providerLiveLocation, acceptedProvider, t, mapInitialized]);


  // Redirect if not signed in
  useEffect(() => {
    // Only redirect if isLoaded is true (meaning auth state has been checked)
    // and the user is not signed in.
    if (isLoaded && !isSignedIn) {
      // It's better to use useRouter for navigation in Next.js
      // import { useRouter } from 'next/navigation';
      // const router = useRouter();
      // router.push('/auth/login'); // Redirect to your Supabase login page
      setSearchMessage("Please sign in to access this page.");
    }
  }, [isLoaded, isSignedIn]);


  // Determine if the "Find Providers" button should be enabled
  const canSearch = selectedServiceType && (
    (userLatitude !== null && userLongitude !== null) ||
    (manualAddress.trim() !== "" && manualPostalCode.trim() !== "")
  );

  // Determine if the "Cancel Request" button should be enabled
  const canCancel = currentRequestId && (requestStatus === 'notified_multiple' || requestStatus === 'finding_provider' || requestStatus === 'accepted');

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
        <span className="ml-4 text-gray-600">Loading user data...</span>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden p-8 md:p-10 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">Please sign in to access the service request page.</p>
          <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold">
            <Link href="/auth/login">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }


  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-indigo-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-4xl bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden p-8 md:p-10 mb-8">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">
              {t('findServiceProviders')} {/* Updated text */}
            </h2>
            <p className="text-gray-600 text-lg">
              {t('selectServiceAndLocation')}
            </p>
          </div>

          <div className="space-y-6 mb-8">
            {/* Service Type Selection */}
            <div>
              <Label htmlFor="service_type" className="text-sm font-semibold text-gray-700 mb-2 block">
                <Briefcase className="inline-block w-4 h-4 mr-2 text-blue-500" />
                {t('serviceType')} <span className="text-red-500">*</span>
              </Label>
              <Select
                value={selectedServiceType}
                onValueChange={(value) => {
                  setSelectedServiceType(value);
                  setShowProviderList(false); // Hide list on service type change
                  setAvailableProviders([]); // Clear available providers
                  setSelectedProviderIds([]); // Clear selected providers
                }}
                disabled={requestStatus !== 'idle' && requestStatus !== 'error' && requestStatus !== 'no_ustaz_found'}
              >
                <SelectTrigger
                  id="service_type"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm transition focus:outline-none focus:ring-0 focus:border-blue-400 bg-white hover:border-gray-300"
                >
                  <SelectValue placeholder={t('selectServicePlaceholder')} />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 rounded-xl shadow-lg">
                  {service_types.map((service) => (
                    <SelectItem key={service} value={service}>
                      {service}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location Section */}
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 shadow-sm space-y-4">
              <h3 className="flex items-center text-lg font-semibold text-blue-800 mb-4">
                <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                {t('yourLocation')}
              </h3>

              {/* Get Current Location */}
              <div className="border-b border-blue-200 pb-4 mb-4">
                <p className="text-sm text-gray-600 mb-3">
                  {t('locationInstructions')}
                </p>
                <Button
                  onClick={getCurrentLocation}
                  disabled={requestStatus !== 'idle' && requestStatus !== 'error' && requestStatus !== 'no_ustaz_found'}
                  className="w-full group bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center justify-center"
                >
                  {(requestStatus === 'finding_provider' && searchMessage === t('gettingLocation')) ? (
                    <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                  ) : (
                    <LocateFixed className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                  )}
                  {t('getCurrentLocation')}
                </Button>
                {userLatitude !== null && userLongitude !== null && (
                  <p className="text-sm text-gray-700 text-center mt-2">
                    {t('coordinates')}: Lat {userLatitude.toFixed(4)}, Lng{" "}
                    {userLongitude.toFixed(4)}
                  </p>
                )}
              </div>

              {/* Or divider */}
              <div className="relative flex justify-center text-xs uppercase my-4">
                <span className="bg-blue-50 px-2 text-gray-500">{t('orEnterManually')}</span>
              </div>

              {/* Manual Address Input */}
              <div>
                <Label htmlFor="manual_address" className="text-sm font-semibold text-gray-700 mb-2 block">
                  <HomeModernIcon className="inline-block w-4 h-4 mr-2 text-blue-500" />
                  {t('streetAddress')}
                </Label>
                <Input
                  id="manual_address"
                  type="text"
                  value={manualAddress}
                  onChange={(e) => {
                    setManualAddress(e.target.value);
                    setUserLatitude(null); // Clear GPS coords if user starts typing manually
                    setUserLongitude(null);
                    setSearchMessage(null); // Clear location status message
                    setShowProviderList(false); // Hide provider list on manual input
                    setAvailableProviders([]); // Clear available providers
                    setSelectedProviderIds([]); // Clear selected providers
                  }}
                  placeholder={t('enterStreetAddress')}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm transition focus:outline-none focus:ring-0 focus:border-blue-400 bg-white"
                  disabled={requestStatus !== 'idle' && requestStatus !== 'error' && requestStatus !== 'no_ustaz_found'}
                />
              </div>
              <div className="mt-4">
                <Label htmlFor="manual_postal_code" className="text-sm font-semibold text-gray-700 mb-2 block">
                  <MailOpen className="inline-block w-4 h-4 mr-2 text-blue-500" />
                  {t('postalCode')}
                </Label>
                <Input
                  id="manual_postal_code"
                  type="text"
                  value={manualPostalCode}
                  onChange={(e) => {
                    setManualPostalCode(e.target.value);
                    setUserLatitude(null); // Clear GPS coords if user starts typing manually
                    setUserLongitude(null);
                    setSearchMessage(null); // Clear location status message
                    setShowProviderList(false); // Hide provider list on manual input
                    setAvailableProviders([]); // Clear available providers
                    setSelectedProviderIds([]); // Clear selected providers
                  }}
                  placeholder={t('enterPostalCode')}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm transition focus:outline-none focus:ring-0 focus:border-blue-400 bg-white"
                  disabled={requestStatus !== 'idle' && requestStatus !== 'error' && requestStatus !== 'no_ustaz_found'}
                />
              </div>

              {searchMessage && (
                <p className={`text-sm text-center mt-4 ${requestStatus === 'error' ? "text-red-600" : "text-gray-700"}`}>
                  {searchMessage}
                </p>
              )}
            </div>

            {/* Action Buttons - Modified to fetch providers first */}
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <Button
                onClick={fetchAvailableProviders} // Now calls to fetch providers
                disabled={!canSearch || requestStatus === 'finding_provider' || requestStatus === 'notified_multiple' || requestStatus === 'accepted'}
                className="flex-1 group bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center"
              >
                {(requestStatus === 'finding_provider' && searchMessage === t('fetchingProvidersList')) ? (
                  <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                ) : (
                  <Search className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                )}
                {t('findAvailableProviders')} {/* New text */}
              </Button>

              <Button
                onClick={cancelServiceRequest}
                disabled={!canCancel}
                variant="outline"
                className="flex-1 border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600 px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center"
              >
                <XCircle className="w-5 h-5 mr-2" />
                {t('cancelRequest')}
              </Button>
            </div>

            {/* NEW: Provider Selection Section */}
            {showProviderList && availableProviders.length > 0 && (
                <div className="mt-8 p-6 bg-green-50 rounded-xl border border-green-200 shadow-inner">
                    <h3 className="text-xl font-bold text-green-800 mb-4">{t('selectProviders')}</h3>
                    <p className="text-gray-700 mb-4">{t('chooseProvidersToNotify')}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {availableProviders.map((provider) => (
                            <div key={provider.user_id} className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
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
                                    className="form-checkbox h-5 w-5 text-blue-600 rounded"
                                />
                                <label htmlFor={`provider-${provider.user_id}`} className="flex-1 text-gray-800 font-medium cursor-pointer">
                                    {provider.firstName} {provider.lastName} ({provider.phoneCountryCode} {provider.phoneNumber})
                                </label>
                            </div>
                        ))}
                    </div>
                    <Button
                        onClick={sendRequestToSelectedProviders}
                        disabled={selectedProviderIds.length === 0 || requestStatus === 'finding_provider' || requestStatus === 'notified_multiple' || requestStatus === 'accepted'}
                        className="w-full mt-6 group bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center"
                    >
                        {(requestStatus === 'finding_provider' && searchMessage === t('notifyingSelectedProviders')) ? (
                            <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                        ) : (
                            <Search className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                        )}
                        {t('sendRequestToSelected')}
                    </Button>
                </div>
            )}

            {/* If no providers are found for the selected service type */}
            {showProviderList && availableProviders.length === 0 && requestStatus !== 'finding_provider' && (
                <div className="mt-8 p-6 bg-orange-50 rounded-xl border border-orange-200 shadow-inner text-center">
                    <p className="text-lg text-orange-800 font-semibold">{t('noProvidersForService')}</p>
                    <p className="text-gray-600 mt-2">{t('tryDifferentServiceOrLocation')}</p>
                </div>
            )}

            {/* Request Status Display */}
            {(currentRequestId && requestStatus !== 'idle' && requestStatus !== 'pending_notification' && requestStatus !== 'notified_multiple') && (
              <div className="mt-8 p-6 bg-blue-100 rounded-xl border border-blue-300 shadow-inner text-center">
                <h3 className="text-xl font-bold text-blue-800 mb-3">{t('requestStatus')}</h3>
                <p className="text-lg font-semibold text-blue-700 flex items-center justify-center">
                  {requestStatus === 'finding_provider' && <Loader2 className="h-5 w-5 mr-2 animate-spin text-blue-600" />}
                  {requestStatus === 'notified' && <Clock className="h-5 w-5 mr-2 text-blue-600" />}
                  {requestStatus === 'accepted' && <CheckCircle className="h-5 w-5 mr-2 text-green-600" />}
                  {requestStatus === 'rejected' && <XCircle className="h-5 w-5 mr-2 text-red-600" />}
                  {requestStatus === 'cancelled' && <XCircle className="h-5 w-5 mr-2 text-red-600" />}
                  {requestStatus === 'completed' && <CheckCircle className="h-5 w-5 mr-2 text-green-600" />}
                  {requestStatus === 'error' && <XCircle className="h-5 w-5 mr-2 text-red-600" />}
                  {t(requestStatus)}
                </p>
                {requestStatus === 'accepted' && acceptedProvider && (
                  <div className="mt-6 p-4 bg-white rounded-lg shadow-md border border-blue-200">
                    <h4 className="text-xl font-bold text-gray-800 mb-3">{t('providerDetails')}</h4>
                    <p className="text-lg font-semibold text-blue-700 flex items-center justify-center">
                      <UserIcon className="w-5 h-5 mr-2" />
                      {acceptedProvider.firstName} {acceptedProvider.lastName}
                    </p>
                    <div className="flex justify-center gap-4 mt-4">
                      <a href={`tel:${acceptedProvider.phoneCountryCode}${acceptedProvider.phoneNumber}`} className="flex items-center text-green-600 hover:text-green-800 font-medium">
                        <Phone className="w-5 h-5 mr-2" /> {t('callProvider')}
                      </a>
                      <Button variant="ghost" className="flex items-center text-blue-600 hover:text-blue-800 font-medium">
                        <MessageSquare className="w-5 h-5 mr-2" /> {t('chatWithProvider')}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* Display message when providers are being listed for selection */}
            {requestStatus === 'idle' && showProviderList && availableProviders.length > 0 && (
                <div className="mt-8 p-6 bg-blue-100 rounded-xl border border-blue-300 shadow-inner text-center">
                    <h3 className="text-xl font-bold text-blue-800 mb-3">{t('selectProvidersToNotify')}</h3>
                    <p className="text-gray-700">{searchMessage}</p>
                </div>
            )}
          </div>
        </div>

        {/* Map Section */}
        <div className="w-full max-w-4xl bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden p-8 md:p-10">
          <h3 className="text-2xl font-bold text-gray-800 text-center mb-6">
            {t('providerLocation')}
          </h3>
          {/* Use ref={mapContainerRef} for Leaflet to attach to */}
          <div ref={mapContainerRef} className="w-full h-[400px] rounded-xl shadow-inner border border-gray-200">
            {/* Map will be rendered here by Leaflet */}
          </div>
          {providerLiveLocation && acceptedProvider && (
            <p className="text-sm text-gray-700 text-center mt-4">
              {t('providerLocation')}: Updated {timeAgo(providerLiveLocation.updated_at, t)}
            </p>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

export default ProcessPage;
