"use client"

import React, { useState, useEffect } from "react"
import { supabase } from "../../../client/supabaseClient" // Adjust path as needed
import {
  MapPin,
  Briefcase,
  Search,
  Loader2,
  Phone,
  Mail,
  LocateFixed,
  Route,
  Home,
  MailOpen,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input" // Assuming you have an Input component
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import Header from "@/app/components/Header" // Adjust path as needed
import Footer from "@/app/components/Footer" // Adjust path as needed
// Removed: import { useTranslations } from "next-intl"

// Define TypeScript Interfaces
interface Provider {
  userId: string
  firstName: string
  lastName: string
  service_type: string
  latitude: number
  longitude: number
  phoneNumber: string
  phoneCountryCode: string
  email?: string
  streetAddress?: string
  city?: string
  distance?: number // Added for calculated distance
}

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  return parseFloat(distance.toFixed(2)); // Return distance rounded to 2 decimal places
}

function FindProviderPage() {
  // const t = useTranslations("findProvider") // Removed useTranslations
  const [selectedServiceType, setSelectedServiceType] = useState<string>("")
  const [userLatitude, setUserLatitude] = useState<number | null>(null)
  const [userLongitude, setUserLongitude] = useState<number | null>(null)
  const [manualAddress, setManualAddress] = useState<string>("")
  const [manualPostalCode, setManualPostalCode] = useState<string>("")
  const [providers, setProviders] = useState<Provider[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [locationStatus, setLocationStatus] = useState<string | null>(null) // To show messages about location

  const service_types = [
    "Electrician Service",
    "Plumbing",
    "Carpentry",
    "AC Maintenance",
    "Solar Technician",
  ]

  // Function to get current location using browser's Geolocation API
  const getCurrentLocation = async () => {
    if (navigator.geolocation) {
      setIsLoading(true)
      setSearchError(null)
      setLocationStatus("Getting your current location...")
      // Clear manual address fields when using GPS
      setManualAddress("")
      setManualPostalCode("")

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLatitude(position.coords.latitude)
          setUserLongitude(position.coords.longitude)
          setLocationStatus("Location detected!")
          setIsLoading(false)
        },
        (error) => {
          console.error("Error getting location:", error)
          setSearchError("Failed to get your location. Please allow location access or enter your address manually.")
          setLocationStatus("Location permission denied or not available.")
          setIsLoading(false)
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      )
    } else {
      setSearchError("Geolocation is not supported by your browser.")
      setLocationStatus("Geolocation not supported.")
    }
  }

  // Function to geocode a manual address using OpenStreetMap Nominatim API
  const geocodeAddress = async (address: string, postalCode: string): Promise<{ lat: number; lng: number } | null> => {
    const query = `${address}, ${postalCode}`;
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      if (data && data.length > 0) {
        // Take the first result
        const location = data[0];
        return { lat: parseFloat(location.lat), lng: parseFloat(location.lon) };
      } else {
        console.warn("No geocoding results found for the given address.");
        return null;
      }
    } catch (error) {
      console.error("Error during geocoding with Nominatim:", error);
      return null;
    }
  };

  // Function to fetch providers from Supabase
  const fetchProviders = async () => {
    setIsLoading(true)
    setSearchError(null)
    setProviders([])

    if (!selectedServiceType) {
      setSearchError("Please select a service type.")
      setIsLoading(false)
      return
    }

    let finalLatitude = userLatitude;
    let finalLongitude = userLongitude;

    // If GPS coordinates are not available, try to geocode manual input
    if (finalLatitude === null || finalLongitude === null) {
        if (manualAddress.trim() && manualPostalCode.trim()) {
            setLocationStatus("Geocoding address...");
            const geocoded = await geocodeAddress(manualAddress, manualPostalCode);
            if (geocoded) {
                finalLatitude = geocoded.lat;
                finalLongitude = geocoded.lng;
                setLocationStatus("Address geocoded successfully.");
            } else {
                setSearchError("Failed to geocode the address. Please check the address and postal code.");
                setIsLoading(false);
                return;
            }
        } else {
            setSearchError("Please get your current location or enter your address and postal code manually.");
            setIsLoading(false);
            return;
        }
    }

    // Double check coordinates are now available
    if (finalLatitude === null || finalLongitude === null) {
      setSearchError("No valid location available to search for providers.");
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("ustaz_registrations")
        .select(
          "userId, firstName, lastName, service_type, latitude, longitude, phoneNumber, phoneCountryCode, email, streetAddress, city"
        )
        .eq("service_type", selectedServiceType)
        .not("latitude", "is", null) // Ensure providers have location data
        .not("longitude", "is", null)

      if (error) {
        throw error
      }

      if (data && data.length > 0) {
        // Calculate distance for each provider
        const providersWithDistance = data
          .map((provider: any) => ({
            ...provider,
            distance: calculateDistance(
              finalLatitude!, // Use finalLatitude
              finalLongitude!, // Use finalLongitude
              provider.latitude,
              provider.longitude,
            ),
          }))
          .sort((a, b) => a.distance - b.distance) // Sort by nearest first

        setProviders(providersWithDistance)
      } else {
        setProviders([])
        setLocationStatus("No providers found for the selected service in your area.")
      }
    } catch (error: any) {
      console.error("Error fetching providers:", error.message)
      setSearchError(`Error fetching providers: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const canSearch = selectedServiceType && (
    (userLatitude !== null && userLongitude !== null) ||
    (manualAddress.trim() !== "" && manualPostalCode.trim() !== "")
  );

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="w-full max-w-3xl bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden p-8 md:p-10">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">
              Find Nearest Provider
            </h2>
            <p className="text-gray-600 text-lg">
              Select a service type and provide your location to find nearby professionals.
            </p>
          </div>

          <div className="space-y-6 mb-8">
            {/* Service Type Selection */}
            <div>
              <Label htmlFor="service_type" className="text-sm font-semibold text-gray-700 mb-2 block">
                <Briefcase className="inline-block w-4 h-4 mr-2 text-blue-500" />
                Service Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={selectedServiceType}
                onValueChange={(value) => setSelectedServiceType(value)}
              >
                <SelectTrigger
                  id="service_type"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm transition focus:outline-none focus:ring-0 focus:border-blue-400 bg-white hover:border-gray-300"
                >
                  <SelectValue placeholder="Select a service type" />
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
                Your Location
              </h3>

              {/* Get Current Location */}
              <div className="border-b border-blue-200 pb-4 mb-4">
                <p className="text-sm text-gray-600 mb-3">
                  Click the button below to automatically detect your current location.
                </p>
                <Button
                  onClick={getCurrentLocation}
                  disabled={isLoading}
                  className="w-full group bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center justify-center"
                >
                  {isLoading && locationStatus === "Getting your current location..." ? (
                    <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                  ) : (
                    <LocateFixed className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                  )}
                  Get Current Location
                </Button>
                {userLatitude !== null && userLongitude !== null && (
                  <p className="text-sm text-gray-700 text-center mt-2">
                    Coordinates: Lat {userLatitude.toFixed(4)}, Lng{" "}
                    {userLongitude.toFixed(4)}
                  </p>
                )}
              </div>

              {/* Or divider */}
              <div className="relative flex justify-center text-xs uppercase my-4">
                <span className="bg-blue-50 px-2 text-gray-500">Or enter manually</span>
              </div>

              {/* Manual Address Input */}
              <div>
                <Label htmlFor="manual_address" className="text-sm font-semibold text-gray-700 mb-2 block">
                  <Home className="inline-block w-4 h-4 mr-2 text-blue-500" />
                  Street Address (e.g., 123 Main St, Anytown)
                </Label>
                <Input
                  id="manual_address"
                  type="text"
                  value={manualAddress}
                  onChange={(e) => {
                    setManualAddress(e.target.value)
                    // Clear GPS coords if user starts typing manually
                    setUserLatitude(null);
                    setUserLongitude(null);
                    setLocationStatus(null);
                  }}
                  placeholder="e.g., 123 Main St, Anytown"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm transition focus:outline-none focus:ring-0 focus:border-blue-400 bg-white"
                />
              </div>
              <div className="mt-4">
                <Label htmlFor="manual_postal_code" className="text-sm font-semibold text-gray-700 mb-2 block">
                  <MailOpen className="inline-block w-4 h-4 mr-2 text-blue-500" />
                  Postal Code
                </Label>
                <Input
                  id="manual_postal_code"
                  type="text"
                  value={manualPostalCode}
                  onChange={(e) => {
                    setManualPostalCode(e.target.value)
                    // Clear GPS coords if user starts typing manually
                    setUserLatitude(null);
                    setUserLongitude(null);
                    setLocationStatus(null);
                  }}
                  placeholder="e.g., 90210"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm transition focus:outline-none focus:ring-0 focus:border-blue-400 bg-white"
                />
              </div>

              {locationStatus && (
                <p className={`text-sm text-center mt-4 ${searchError ? "text-red-600" : "text-gray-700"}`}>
                  {locationStatus}
                </p>
              )}
            </div>

            {/* Search Button */}
            <Button
              onClick={fetchProviders}
              disabled={isLoading || !canSearch}
              className="w-full group bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center mt-6"
            >
              {isLoading && canSearch ? (
                <Loader2 className="h-5 w-5 mr-3 animate-spin" />
              ) : (
                <Search className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
              )}
              Find Providers
            </Button>

            {searchError && (
              <p className="text-red-600 text-center mt-4 text-sm animate-fade-in">{searchError}</p>
            )}
          </div>

          {/* Provider Results */}
          <div className="mt-8 space-y-6">
            <h3 className="text-2xl font-bold text-gray-800 text-center mb-6">
              Available Providers
            </h3>
            {isLoading && canSearch ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                <span className="ml-4 text-gray-600">Loading providers...</span>
              </div>
            ) : providers.length > 0 ? (
              providers.map((provider) => (
                <div
                  key={provider.userId}
                  className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:shadow-xl hover:scale-[1.01] duration-200"
                >
                  <div className="flex-1">
                    <h4 className="text-xl font-semibold text-blue-700">
                      {provider.firstName} {provider.lastName}
                    </h4>
                    <p className="text-gray-600 flex items-center mt-1">
                      <Briefcase className="w-4 h-4 mr-2 text-gray-500" />
                      {provider.service_type}
                    </p>
                    <p className="text-gray-600 flex items-center mt-1">
                      <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                      {provider.streetAddress && provider.city
                        ? `${provider.streetAddress}, ${provider.city}`
                        : provider.city || "Location unavailable"}
                    </p>
                    {provider.distance !== undefined && (
                      <p className="text-blue-600 font-medium flex items-center mt-2">
                        <Route className="w-4 h-4 mr-2 text-blue-500" />
                        Distance: {provider.distance} km Away
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col md:items-end items-start gap-2 mt-4 md:mt-0">
                    <a
                      href={`tel:${provider.phoneCountryCode}${provider.phoneNumber}`}
                      className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      {provider.phoneCountryCode} {provider.phoneNumber}
                    </a>
                    {provider.email && (
                      <a
                        href={`mailto:${provider.email}`}
                        className="inline-flex items-center text-gray-600 hover:text-gray-800 transition-colors duration-200"
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        {provider.email}
                      </a>
                    )}
                  </div>
                </div>
              ))
            ) : (
              !isLoading && <p className="text-center text-gray-500">No providers match your criteria.</p>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}

export default FindProviderPage