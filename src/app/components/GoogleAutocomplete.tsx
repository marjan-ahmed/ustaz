"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { Input } from '@/components/ui/input'; // Import Shadcn UI Input
import { useTranslations } from 'next-intl'; // For translations
import { Loader } from '@googlemaps/js-api-loader'; // Import Loader for Google Maps API

interface GoogleAutocompleteProps {
  value: string; // The current value of the address from the parent component
  onPlaceSelect: (address: string, lat: number | null, lng: number | null) => void;
  disabled?: boolean;
  className?: string; // For passing Tailwind classes
}

const GoogleAutocomplete: React.FC<GoogleAutocompleteProps> = ({
  value,
  onPlaceSelect,
  disabled = false,
  className = "",
}) => {
  const t = useTranslations('process'); // Assuming 'process' namespace for translations
  const inputRef = useRef<HTMLInputElement>(null); // Ref for the actual <input> element
  const autocompleteInstance = useRef<google.maps.places.Autocomplete | null>(null);
  const [googleMapsApiLoaded, setGoogleMapsApiLoaded] = useState(false); // State to track Google Maps API loading

  // Internal state to manage the input field's value, kept in sync with 'value' prop
  const [internalAddress, setInternalAddress] = useState(value);

  // Update internal state when external 'value' prop changes
  useEffect(() => {
    setInternalAddress(value);
  }, [value]);

  // Effect to load Google Maps API (runs once)
  useEffect(() => {
    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
      version: 'weekly',
      libraries: ['places'],
    });

    loader.load().then(() => {
      setGoogleMapsApiLoaded(true);
      console.log("Google Maps API loaded successfully within GoogleAutocomplete.");
    }).catch((e: unknown) => {
      console.error('Google Maps API failed to load in GoogleAutocomplete:', e);
      // Optionally, you could pass an error state back to the parent via a prop
    });
  }, []); // Empty dependency array means this runs once on mount

  useEffect(() => {
    // Only proceed if Google Maps API is loaded and the input element is available
    if (!googleMapsApiLoaded || !window.google || !window.google.maps || !window.google.maps.places || !inputRef.current) {
      return;
    }

    // Initialize Autocomplete only once
    if (!autocompleteInstance.current) {
      autocompleteInstance.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ["address"], // 'address' is suitable for street addresses.
        // Removed componentRestrictions to allow worldwide locations
      });

      // Add listener for place changes
      const placeChangeListener = () => {
        const place = autocompleteInstance.current?.getPlace();
        if (place && place.formatted_address && place.geometry && place.geometry.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          onPlaceSelect(place.formatted_address, lat, lng);
          setInternalAddress(place.formatted_address); // Update internal state
        } else if (inputRef.current) {
          // If no place is selected but user typed something, pass the raw input
          onPlaceSelect(inputRef.current.value, null, null);
          setInternalAddress(inputRef.current.value);
        }
      };

      if (autocompleteInstance.current) {
        autocompleteInstance.current.addListener("place_changed", placeChangeListener);
      }

      // Cleanup function: remove listener when component unmounts
      return () => {
        // This is a basic cleanup. More robust cleanup might involve checking if the listener exists.
        // For Autocomplete, the listener is typically tied to the input element.
        // When the input element is removed from DOM, the listener will also be cleaned up by browser.
      };
    }
  }, [googleMapsApiLoaded, onPlaceSelect]); // Dependencies: re-run if API loads or onPlaceSelect callback changes

  // Handle direct input changes (user typing)
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalAddress(e.target.value);
    // Also call onPlaceSelect with current typed value and null coords
    // This ensures parent component's address state is always updated as user types
    onPlaceSelect(e.target.value, null, null);
  }, [onPlaceSelect]);

  if (!googleMapsApiLoaded) {
    return (
      <Input
        type="text"
        value={t('loadingMapServices')}
        disabled={true}
        className={`${className} bg-gray-100 text-gray-500 cursor-not-allowed`}
      />
    );
  }

  return (
    <Input
      ref={inputRef}
      type="text"
      value={internalAddress}
      onChange={handleInputChange}
      disabled={disabled}
      className={className}
      placeholder={t('enterStreetAddress')} // Use translation for placeholder
    />
  );
};

export default GoogleAutocomplete;
