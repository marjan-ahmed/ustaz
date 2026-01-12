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
import { useServiceContext } from '../context/ServiceContext';
import GoogleAutocomplete from '../components/GoogleAutocomplete';
import { toast } from 'sonner';
import MapComponent from '../components/MapComponent';
import EnhancedMapComponent from '../components/EnhancedMapComponent';
import UserRequestTracker from '../components/UserRequestTracker';
import ProviderTrackingInfo from '../components/ProviderTrackingInfo';
import ChatComponent from '../components/ChatComponent';
import LifecycleMapWrapper from '../components/LifecycleMapWrapper';
// Removed Loader import as Google Maps API is no longer directly integrated here


// Define types for service request status and provider info
// Updated RequestStatus to include 'notified_multiple' from backend
type RequestStatus = 'idle' | 'finding_provider' | 'notified' | 'notified_multiple' | 'no_ustaz_found' | 'accepted' | 'rejected' | 'cancelled' | 'completed' | 'error' | 'pending_notification' | 'arriving' | 'in_progress';


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
    // Removed google declaration as it's not used for direct API calls in this component anymore
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
  // Destructure address and service from context, and their setters
  const { address, setAddress, service, setService} = useServiceContext();



  const [userLatitude, setUserLatitude] = useState<number | null>(null);

  const [userLongitude, setUserLongitude] = useState<number | null>(null);
  // Removed local state manualAddress and selectedServiceType as they are now managed by context
  const [manualPostalCode, setManualPostalCode] = useState<string>(''); // manualPostalCode remains local
  const [requestStatus, setRequestStatus] = useState<RequestStatus>('idle');
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
  const [acceptedProvider, setAcceptedProvider] = useState<ProviderInfo | null>(null);
  const [providerLiveLocation, setProviderLiveLocation] = useState<LiveLocation | null>(null);
  // State for chat functionality
  const [showChat, setShowChat] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false); // State to track map initialization
  const mapRef = useRef<any>(null); // Ref for the Leaflet map instance
  const mapContainerRef = useRef<HTMLDivElement>(null); // Ref for the map container div
  const userMarkerRef = useRef<any>(null); // Ref for user's map marker
  const providerMarkerRef = useRef<any>(null); // Ref for provider's map marker
  const requestSubscriptionRef = useRef<any>(null); // Ref for service_requests subscription
  const liveLocationSubscriptionRef = useRef<any>(null); // Ref for live_locations subscription
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Ref for retry timeout
  const [noProvider, setNoProvider] = useState(false); // 👈 NEW state


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


//   const handleFindProviders = async () => {
//   if (!user || !isLoaded) {
//     toast.error("User not authenticated");
//     return;
//   }

//   if (!userLatitude || !userLongitude || !service || !address) {
//     toast.error("Please complete your location and service selection.");
//     return;
//   }

//   try {
//     const { data: nearbyProviders, error } = await supabase.rpc('find_providers_nearby', {
//       lat_input: userLatitude,
//       lng_input: userLongitude,
//       radius_mm: 5000,
//       type_input: service
//     });

//     if (error) throw error;
//     if (!nearbyProviders || nearbyProviders.length === 0) {
//       toast.info("No providers found nearby.");
//       return;
//     }

//     // Send notification to each provider
//     for (const provider of nearbyProviders) {
//       await supabase.from('notifications').insert({
//         provider_id: provider.id, // adjust based on your table
//         message: `${user.user_metadata?.name || "A user"} needs ${service} at ${address}`,
//         user_id: user.id,
//         type: "service_request"
//       });
//     }

//     toast.success("Providers notified!");
//   } catch (err) {
//     console.error("Error in findProviders:", err);
//     toast.error("Something went wrong while finding providers.");
//   }
// };

const [isSending, setIsSending] = useState(false);
const [isSent, setIsSent] = useState(false);

async function sendServiceRequest(
  userId: string,
  selectedService: string,
  userName: string
) {
  try {
    setIsSending(true);
    setIsSent(false);
    setNoProvider(false);

    // 👉 Fetch providers that match selected service type
    const { data: providers, error } = await supabase
      .from("ustaz_registrations")
      .select("userId, service_type")
      .eq("service_type", selectedService);

    if (error) {
      console.error("Error fetching providers:", error);
      return;
    }

    // 👉 If no providers found
    if (!providers || providers.length === 0) {
      setNoProvider(true);   // 👈 update state
      return;
    }

    // 👉 Insert notification for each provider that matches
    for (const provider of providers) {
      if (provider.service_type === selectedService) {
        await supabase.from("notifications").insert({
          recipient_user_id: provider.userId,
          sender_user_id: userId,
          service_type: selectedService,
          username: userName,
          address: address,
          message: `${userName} wants ${selectedService} at ${address}`,
          status: "pending",
        });
      }
    }

    setIsSent(true);
  } catch (err) {
    console.error("Error sending request:", err);
  } finally {
    setIsSending(false);
    setTimeout(() => {
      setIsSent(false);
      setNoProvider(false);
    }, 3000);
  }
}

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

  // Function to get current location using browser's Geolocation API
  const getCurrentLocation = useCallback(async () => {
    if (navigator.geolocation) {
      setRequestStatus('finding_provider'); // Use a more general status for location finding
      setSearchMessage(t('gettingLocation'));
      setManualPostalCode('');
      setUserLatitude(null); // Clear previous GPS coords
      setUserLongitude(null);
      setShowProviderList(false); // Hide provider list when getting new location

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          setUserLatitude(lat);
          setUserLongitude(lng);
          setSearchMessage(t('locationDetected'));

          // Reverse geocode the coordinates to get address
          try {
            const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
            if (!apiKey) {
              console.error('Google Maps API key is not set');
              setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
              return;
            }

            const response = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
            );
            const data = await response.json();

            if (data.status === 'OK' && data.results[0]) {
              const formattedAddress = data.results[0].formatted_address;
              setAddress(formattedAddress); // Update address in context
            } else {
              // Fallback to coordinates if reverse geocoding fails
              setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
            }
          } catch (error) {
            console.error('Reverse geocoding failed:', error);
            // Fallback to coordinates if reverse geocoding fails
            setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
          }

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
  }, [t, setAddress, setService]); // Added setService to dependencies

  // Function to geocode a manual address using OpenStreetMap Nominatim API
 const geocodeAddress = useCallback(
  async (address: string, postalCode: string): Promise<{ lat: number; lng: number } | null> => {
    const fullAddress = `${address}, ${postalCode}`;
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      );
      if (!response.ok) {
        console.error(`Google Maps Geocoding error: ${response.status}`);
        return null;
      }
      const data = await response.json();
      if (data.status === "OK" && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return { lat: location.lat, lng: location.lng };
      } else {
        console.warn("No geocoding results found for the given address.");
        return null;
      }
    } catch (error) {
      console.error("Error during geocoding with Google Maps API:", error);
      return null;
    }
  },
  []
);


  // Fetch accepted provider's details (moved up for declaration order)
  const fetchAcceptedProviderDetails = useCallback(async (providerId: string) => {
    console.log('Fetching provider details for ID:', providerId);
    try {
      // Note: This fetch directly from Supabase client assumes RLS allows authenticated users
      // to read ustaz_registrations. If RLS is stricter, you might need an API route.
      const { data, error } = await supabase
        .from('ustaz_registrations')
        .select('userId, firstName, lastName, phoneNumber, phoneCountryCode, email')
        .eq('userId', providerId)
        .single();

      if (error) {
        console.error('Error fetching provider details:', error);
        throw error;
      }

      console.log('Provider details fetched successfully:', data);
      setAcceptedProvider({
        user_id: data.userId,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        phoneCountryCode: data.phoneCountryCode,
        email: data.email,
      });
      console.log('State updated with provider details');
    } catch (error) {
      console.error('Error fetching accepted provider details:', error);
      setAcceptedProvider(null);
    }
  }, [supabase]);

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
  }, [supabase, setProviderLiveLocation]);

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

  // Function to handle chat request
  const handleRequestChat = useCallback(() => {
    if (acceptedProvider?.user_id && user?.id) {
      setShowChat(true);
    } else {
      toast.error('Cannot start chat: provider or user information is missing');
    }
  }, [acceptedProvider, user]);

  // Function to handle calling the provider
  const handleCallProvider = useCallback(() => {
    if (acceptedProvider?.phoneCountryCode && acceptedProvider?.phoneNumber) {
      // Combine country code and phone number
      const fullPhoneNumber = `${acceptedProvider.phoneCountryCode}${acceptedProvider.phoneNumber}`;

      // For Pakistani numbers, ensure proper format
      let formattedNumber = fullPhoneNumber;
      if (fullPhoneNumber.startsWith('92')) {
        formattedNumber = `+${fullPhoneNumber}`;
      } else if (fullPhoneNumber.startsWith('+92')) {
        formattedNumber = fullPhoneNumber;
      } else if (fullPhoneNumber.startsWith('0')) {
        // If it starts with 0, it might be a local format, convert to international
        formattedNumber = `+92${fullPhoneNumber.substring(1)}`;
      } else {
        formattedNumber = `+92${fullPhoneNumber}`;
      }

      // Use window.location.href to initiate a phone call
      window.location.href = `tel:${formattedNumber}`;
    } else {
      toast.error('Cannot make call: provider phone number is not available');
    }
  }, [acceptedProvider]);


  // Supabase Realtime Subscription for Service Request Status (Moved up for declaration order)
  const subscribeToServiceRequest = useCallback((requestId: string) => {
    // Clean up any existing subscription first
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

          // Only update status if it's actually different to avoid unnecessary re-renders
          setRequestStatus(prevStatus => {
            if (prevStatus !== newStatus) {
              console.log('Status changed from', prevStatus, 'to', newStatus);
              return newStatus;
            }
            return prevStatus;
          });

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
    console.log("Service from context:", service); // Use service from context

    if (!user || !user.id) {
        setSearchMessage(t("pleaseSignInToViewProviders"));
        setRequestStatus('error');
        console.error("Authentication failed: User or user ID is null.");
        return;
    }
    if (!service) { // Use service from context
        setSearchMessage(t('pleaseSelectService'));
        setRequestStatus('error');
        console.error("Service type not selected.");
        return;
    }

    let finalLatitude = userLatitude;
    let finalLongitude = userLongitude;

    // Use existing geocoding logic if manual address is used
    if ((finalLatitude === null || finalLongitude === null) && address.trim() && manualPostalCode.trim()) { // Use address from context
        setSearchMessage(t('geocodingAddress'));
        const geocoded = await geocodeAddress(address, manualPostalCode); // Use address from context
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
                user_id: user.id, // Pass user ID
                serviceType: service, // Use service from context
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
  }, [user, service, userLatitude, userLongitude, address, manualPostalCode, geocodeAddress, t, isSignedIn, isLoaded]); // Updated dependencies

  // New function to send request to *selected* providers

  // Redirect if not signed in
  useEffect(() => {
    // Only redirect if isLoaded is true (meaning auth state has been checked)
    // and the user is not signed in.
    // It's better to use useRouter for navigation in Next.js
    // import { useRouter } from 'next/navigation';
    // const router = useRouter();
    // router.push('/auth/login'); // Redirect to your Supabase login page
    if (isLoaded && !isSignedIn) {
      setSearchMessage("Please sign in to access this page.");
    }
  }, [isLoaded, isSignedIn]);


  // Determine if the "Find Providers" button should be enabled
  const canSearch = service && ( // Use service from context
    (userLatitude !== null && userLongitude !== null) ||
    (address.trim() !== "" && manualPostalCode.trim() !== "") // Use address from context
  );

  // Determine if the "Cancel Request" button should be enabled
  const canCancel = currentRequestId && (requestStatus === 'notified_multiple' || requestStatus === 'finding_provider' || requestStatus === 'accepted');

  // Set up real-time subscription when request ID changes
  useEffect(() => {
    if (currentRequestId) {
      subscribeToServiceRequest(currentRequestId);
    }

    // Clean up subscription when component unmounts or requestId changes
    return () => {
      if (requestSubscriptionRef.current) {
        supabase.removeChannel(requestSubscriptionRef.current);
        requestSubscriptionRef.current = null;
      }
    };
  }, [currentRequestId, subscribeToServiceRequest]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
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
      {/* Main container: Full screen height, flex column */}
      <div className="min-h-screen bg-white flex flex-col">
        {/* This div will be the main scroll container for the input section, and the sticky parent for the map */}
        <div className="flex-1 flex flex-col lg:flex-row w-full max-w-7xl mx-auto px-4 py-8">
          {/* Input Section - This will be the scrollable part */}
          <div className="w-full lg:w-1/2 xl:w-2/5 md:p-10 mb-8 lg:mb-0 lg:overflow-y-auto lg:max-h-[calc(100vh - 100px)]"> {/* Adjusted max-height */}
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 bg-clip-text bg-gradient-to-r from-gray-800 to-[#db4b0d] mb-3">
                Find Providers
              </h2>
              <p className="text-gray-600 text-sm sm:text-md">
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

                {/* Manual Address Input - Reverted to standard Input */}
                <div>
                  <Label htmlFor="manual_address" className="text-sm font-semibold text-gray-700 mb-2 block">
                    <HomeModernIcon className="inline-block w-4 h-4 mr-2 text-[#db4b0d]" />
                    {t('streetAddress')}
                  </Label>
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
                      setUserLatitude(null); // Clear GPS coords if user starts typing manually
                      setUserLongitude(null);
                      setSearchMessage(null); // Clear location status message
                      setShowProviderList(false); // Hide provider list on manual input
                      setAvailableProviders([]); // Clear available providers
                      setSelectedProviderIds([]); // Clear selected providers
                    }}
                    placeholder={t('enterPostalCode')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm transition focus:outline-none focus:ring-0 focus:border-[#db4b0d] bg-white text-gray-800 placeholder:text-gray-500"
                    disabled={requestStatus !== 'idle' && requestStatus !== 'error' && requestStatus !== 'no_ustaz_found'}
                  />
                </div>

             {requestStatus === 'error' && (
  <div className="text-red-500 mt-2">
    {searchMessage || 'An unexpected error occurred. Please try again.'}
  </div>
)}
              </div>

              {/* Action Buttons - Modified to fetch providers first */}
              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <Button
                  onClick={async () => {
                    if (!user || !service || (!userLatitude && !address)) {
                      toast.error("Please complete your service selection and location.");
                      return;
                    }

                    // Set status to finding provider to show loading UI
                    setRequestStatus('finding_provider');
                    setSearchMessage('Finding nearby providers...');

                    try {
                      // Get user coordinates if not available
                      let finalLatitude = userLatitude;
                      let finalLongitude = userLongitude;

                      if (!finalLatitude || !finalLongitude) {
                        // Try to geocode the address
                        const geocoded = await geocodeAddress(address, manualPostalCode);
                        if (geocoded) {
                          finalLatitude = geocoded.lat;
                          finalLongitude = geocoded.lng;
                        } else {
                          toast.error("Could not determine location. Please use GPS or enter a valid address.");
                          setRequestStatus('error');
                          setSearchMessage('Could not determine location');
                          return;
                        }
                      }

                      // Call the new API endpoint to create service request
                      const response = await fetch('/api/create-service-request', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          userId: user.id,
                          serviceType: service,
                          userLat: finalLatitude,
                          userLng: finalLongitude,
                          requestDetails: address, // Use the address as request details
                          radiusKm: 3
                        })
                      });

                      // Check if response is ok before parsing JSON
                      if (!response.ok) {
                        const errorText = await response.text();
                        try {
                          const errorData = JSON.parse(errorText);
                          throw new Error(errorData.error || 'Failed to create service request');
                        } catch (e) {
                          throw new Error('Failed to create service request: ' + errorText);
                        }
                      }

                      const data = await response.json();

                      // Update UI with request info
                      setCurrentRequestId(data.requestId);
                      setRequestStatus('notified_multiple');
                      setSearchMessage('Request sent to nearby providers. Waiting for response...');

                      toast.success(`Request sent to ${data.providersNotified} providers!`);
                    } catch (error: any) {
                      console.error('Error creating service request:', error);
                      setRequestStatus('error');
                      setSearchMessage(error.message || 'Failed to send request');
                      toast.error(error.message || 'Failed to send request');
                    }
                  }}
                  disabled={requestStatus === 'finding_provider' || requestStatus === 'notified_multiple' || requestStatus === 'accepted'}
                  className="flex-1 group bg-[#db4b0d] hover:bg-[#a93a0b] text-white px-8 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center justify-center"
                >
                  {(requestStatus === 'finding_provider') ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                      Finding Providers...
                    </>
                  ) : (requestStatus === 'notified_multiple') ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                      Waiting for Response...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                      Find Available Providers
                    </>
                  )}
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
                <div className="mt-8">
                  <div className="debug-info hidden"> {/* Hidden debug info for troubleshooting */}
                    <p>Debug: requestStatus = {requestStatus}</p>
                    <p>Debug: acceptedProvider exists = {!!acceptedProvider}</p>
                    <p>Debug: acceptedProvider = {acceptedProvider ? `${acceptedProvider.firstName} ${acceptedProvider.lastName}` : 'null'}</p>
                    <p>Debug: providerLiveLocation = {providerLiveLocation ? 'exists' : 'null'}</p>
                  </div>
                  {acceptedProvider ? (
                    <ProviderTrackingInfo
                      userLat={userLatitude}
                      userLng={userLongitude}
                      provider={acceptedProvider}
                      liveLocation={providerLiveLocation}
                      onRequestChat={handleRequestChat}
                      onCallProvider={handleCallProvider}
                    />
                  ) : (
                    <UserRequestTracker
                      userId={user?.id || user?.user_metadata.id}
                      requestId={currentRequestId}
                      onProviderAccepted={(providerId) => {
                        // Removed redundant state mutation - let realtime be the single source of truth
                        // setRequestStatus('accepted');
                        // fetchAcceptedProviderDetails(providerId);
                      }}
                      onProviderRejected={() => {
                        setRequestStatus('rejected');
                        setSearchMessage('Provider rejected the request. Looking for another provider...');
                      }}
                      onNoProvidersFound={() => {
                        setRequestStatus('no_ustaz_found');
                        setSearchMessage('No providers found in your area. Please try again later.');
                      }}
                      onLiveLocationUpdate={(location) => {
                        // Update the provider live location in the parent component
                        setProviderLiveLocation(location);
                      }}
                    />
                  )}
                </div>
              )}
              {/* Display message when providers are being listed for selection */}
              {requestStatus === 'idle' && showProviderList && availableProviders.length > 0 && (
                  <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200 shadow-sm text-center">
                      <h3 className="text-xl font-bold text-[#db4b0d] mb-3">{t('selectProvidersToNotify')}</h3>
                      <p className="text-gray-600">{searchMessage}</p>
                  </div>
              )}
            </div>
          </div>

          {/* Map Section - This will be sticky */}
          <div className="w-full lg:w-1/2 xl:w-3/5 lg:sticky lg:top-8 lg:self-start">
  {/* Heading */}
  <h3 className="text-2xl font-bold text-gray-800 p-3 text-center mb-6">
    {t('providerLocation')}
  </h3>

  {/* Google Maps Component */}
  <div className="w-full h-[400px] lg:h-[calc(100vh - 150px)] border-gray-900 rounded-xl shadow-xl overflow-hidden">
    {/* Use LifecycleMapWrapper to handle the different search phases */}
    {typeof window !== 'undefined' && (
      <LifecycleMapWrapper
        userLat={userLatitude ?? undefined}
        userLng={userLongitude ?? undefined}
        providerLat={providerLiveLocation?.latitude ?? undefined}
        providerLng={providerLiveLocation?.longitude ?? undefined}
        providerInfo={acceptedProvider}
        userAddress={address}
        liveLocations={providerLiveLocation ? [providerLiveLocation] : []} // Pass as is
        searchPhase={
          requestStatus === 'finding_provider' || requestStatus === 'notified_multiple' ? 'finding_providers' :
          requestStatus === 'accepted' || requestStatus === 'arriving' || requestStatus === 'in_progress' ? 'provider_accepted' :
          'address_selection'
        }
        onRouteCalculated={(route) => {
          // Handle route calculation if needed
          console.log('Route calculated:', route);
        }}
      />
    )}
  </div>

  {/* Last updated info */}
  {providerLiveLocation && acceptedProvider && (
    <p className="text-sm text-gray-700 text-center mt-4">
      {t('providerLocation')}: Updated {timeAgo(providerLiveLocation.updated_at, t)}
    </p>
  )}
</div>

        </div>
      </div>
      <Footer />

      {/* Chat Component - Only renders when showChat is true */}
      {showChat && user?.id && acceptedProvider?.user_id && (
        <ChatComponent
          currentUserId={user.id}
          otherUserId={acceptedProvider.user_id}
          currentUserName={user.user_metadata?.name || 'You'}
          otherUserName={`${acceptedProvider.firstName} ${acceptedProvider.lastName}`}
          onClose={() => setShowChat(false)}
        />
      )}
    </>
  );
}

export default ProcessPage;