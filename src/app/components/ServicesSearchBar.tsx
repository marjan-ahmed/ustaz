'use client';

import { useEffect, useRef, useState } from 'react';
import { FaSearchLocation } from 'react-icons/fa'; // Keep FaSearchLocation
import { FaArrowRightLong } from 'react-icons/fa6'; // Use FaArrowRightLong for the arrow
import {
  MdElectricalServices,
  MdPlumbing,
  MdCarpenter,
  MdAcUnit,
  MdSolarPower,
} from 'react-icons/md';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  Dialog, // Keeping Dialog imports in case they are used elsewhere or for future features
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

import { Textarea } from '@/components/ui/textarea'; // Keeping Textarea import
import { Button } from '@/components/ui/button';
import Link from 'next/link'; // Keeping Link import for potential future use, though direct navigation is used
import { useSupabaseUser } from '@/hooks/useSupabaseUser'; // Re-added useSupabaseUser hook
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'; // Re-added Sheet components
import { AuthContainer } from './AuthContainer'; // Re-added AuthContainer import
import { ArrowRight } from 'lucide-react'; // Re-added ArrowRight from lucide-react
import { useRouter } from 'next/navigation'; // Re-added useRouter hook
import { useServiceContext } from '../context/ServiceContext';
import { Loader } from '@googlemaps/js-api-loader'; // Import Loader for Google Maps API


declare global {
  interface Window {
    google: any; // Declare google for Google Maps API
  }
}

const services = [
  // Updated values to match the full service names used in ProcessPage.tsx for consistency
  { label: 'Electrician Service', value: 'Electrician Service', icon: MdElectricalServices },
  { label: 'Plumbing Service', value: 'Plumbing', icon: MdPlumbing },
  { label: 'Carpenter', value: 'Carpentry', icon: MdCarpenter },
  { label: 'AC Maintenance', value: 'AC Maintenance', icon: MdAcUnit },
  { label: 'Solar Technician', value: 'Solar Technician', icon: MdSolarPower },
];

const ServiceSearchBar = () => {
  // Destructure address and service from context for initial state and updates
  const { address, service,  setLat, setLng, setAddress, setService } = useServiceContext();

  // Initialize local state with values from context
  const [location, setLocation] = useState(address);
  const [selectedService, setSelectedService] = useState(service);
  const [mobileNotes, setMobileNotes] = useState(''); // Retained, though "Add Notes" button is removed
  const autocompleteRef = useRef<HTMLDivElement>(null); // Ref for the Google Autocomplete container
  const [authSheetOpen, setAuthSheetOpen] = useState(false); // State for auth sheet visibility
  const { isSignedIn } = useSupabaseUser(); // Using your custom Supabase user hook
  const router = useRouter(); // Initialize useRouter
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // State for displaying error messages in UI

  useEffect(() => {
    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
      version: 'weekly',
      libraries: ['places'],
    });

    loader.load().then(() => {
      // Ensure Google Maps API and PlaceAutocompleteElement are available
      if (
        window.google &&
        window.google.maps &&
        window.google.maps.places &&
        'PlaceAutocompleteElement' in window.google.maps.places &&
        autocompleteRef.current
      ) {
        const pac = new window.google.maps.places.PlaceAutocompleteElement({});
        // Apply Tailwind classes directly to the PAC element's internal input for consistent styling
        // The PAC element itself is a custom HTML element, its internal input will inherit styles
        // or can be targeted via CSS. The class applied here will affect the custom element.
        pac.className = 'w-full border-0 bg-transparent outline-none text-sm text-black placeholder:text-gray-400';

        // Clear existing content and append the PlaceAutocompleteElement to the ref'd div
        autocompleteRef.current.innerHTML = '';
        autocompleteRef.current.appendChild(pac);

        // Access the actual input element rendered by PlaceAutocompleteElement
        const inputElement = autocompleteRef.current.querySelector('input');
        if (inputElement) {
          // Set its initial value from the component's 'location' state (which comes from context)
          if (location) {
            inputElement.value = location;
          }

          // Add an 'input' event listener to capture typed text immediately
          // This ensures 'location' state is updated as the user types,
          // even if they don't select a suggestion.
          inputElement.addEventListener('input', (e: Event) => {
            const target = e.target as HTMLInputElement;
            setLocation(target.value); // Update local location state
            setAddress(target.value); // Update context address
            setErrorMessage(null); // Clear any error messages when user starts typing
          });
        }

        // Add 'gmp-placechange' listener for when a place suggestion is selected
        // This event provides more structured data about the selected place.
        pac.addEventListener('gmp-placechange', (event: any) => {
          const place = event?.detail?.place;
          if (place && place.formattedAddress && place.location) {
            setLocation(place.formattedAddress); // Update local location state
            setAddress(place.formattedAddress); // Update context address with selected place
            setErrorMessage(null); // Clear error message on successful location selection
            // Note: setUserLatitude, setUserLongitude, setSearchMessage, setShowProviderList,
            // setAvailableProviders, setSelectedProviderIds are states/functions from ProcessPage.tsx.
            // They are not directly relevant to ServiceSelector's core function of setting address/service,
            // so they are commented out here to avoid dependency issues if not defined in this component.
            // If needed, they would be passed down as props or accessed via another context.

            const lat = place.location.lat();
            const lng = place.location.lng();
            setLat(lat)
            setLng(lng)

            console.log('📍 Coordinates:', { lat, lng });

          }
        });
      }
    }).catch((e: unknown) => {
      console.error('Google Maps Autocomplete failed to load:', e);
      setErrorMessage('Failed to load map services. Please try again later.'); // User-friendly error message
    });
  }, [location, setAddress]); // Dependencies: re-run if local location or setAddress changes

  // Update local state if context 'address' changes from outside this component
  useEffect(() => {
    if (address !== location) {
      setLocation(address);
    }
  }, [address]);

  // Update local state if context 'service' changes from outside this component
  useEffect(() => {
    if (service !== selectedService) {
      setSelectedService(service);
    }
  }, [service]);


  const handleSubmit = () => {
    // Validate that location and service are selected
    if (!location) {
      setErrorMessage('Please enter your location.');
      return;
    }
    if (!selectedService) {
      setErrorMessage('Please select a service.');
      return;
    }

    // Clear any previous error messages
    setErrorMessage(null);

    console.log('➡️ Saving to context:');
    console.log('Service:', selectedService);
    console.log('Location:', location);
    console.log('Notes:', mobileNotes); // mobileNotes is still part of the state, though not used in UI now

    // Update the ServiceContext with the latest values
    setAddress(location);
    setService(selectedService);

    // Navigate to the process page
    router.push('/process');
  };

  return (
  <div className="w-full max-w-sm px-4">
    <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-4 rounded-2xl shadow-lg border border-gray-200">
      
      {/* Location Input (Google Autocomplete)
      <div className="rounded-xl px-3 py-2 w-full sm:flex-1">
        <div
          ref={autocompleteRef}
          className="w-full text-sm
            [&>input]:bg-transparent
            [&>input]:outline-none
            [&>input]:text-gray-800
            [&>input]:w-full
            [&>input]:placeholder:text-gray-400"
        />
      </div> */}

      {/* Service Selector */}
      <div className="w-full sm:w-[220px]">
        <Select
          onValueChange={(value) => {
            setSelectedService(value);
            setService(value);
          }}
          value={selectedService}
        >
          <SelectTrigger className="w-full text-black bg-gray-100 text-sm rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-400 h-[45px]">
            <SelectValue placeholder="Select service" />
          </SelectTrigger>
          <SelectContent>
            {services.map((s) => (
              <SelectItem key={s.value} value={s.value} className="flex items-center gap-2">
                <s.icon className="text-lg mr-2" />
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Submit or Login Button */}
      {isSignedIn ? (
        <Link href={'/process'}>
        <button
          onClick={handleSubmit}
          className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-xl transition w-full sm:w-auto text-sm"
        >
          Find <FaArrowRightLong />
        </button>
        </Link>
      ) : (
        <Sheet open={authSheetOpen} onOpenChange={setAuthSheetOpen}>
          <SheetTrigger asChild>
            <button className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-xl transition w-full sm:w-auto text-sm">
              Login <ArrowRight />
            </button>
          </SheetTrigger>
          <SheetContent
            side="top"
            className="h-screen flex flex-col p-4 sm:p-6 md:p-8 overflow-y-auto"
          >
            <SheetHeader className="pb-6 border-b border-gray-200">
              <SheetTitle className="text-2xl font-bold text-gray-800">
                Welcome Back
              </SheetTitle>
              <SheetDescription className="text-gray-600">
                Sign in or create your account
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 flex items-center justify-center py-8">
              <div className="w-full max-w-md">
                <AuthContainer />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>

  </div>
);
};

export default ServiceSearchBar;