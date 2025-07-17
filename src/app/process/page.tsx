"use client";

import { useEffect, useState } from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

export default function Process() {
  const [cities, setCities] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState("");
  const [manualAddress, setManualAddress] = useState("");
  const [location, setLocation] = useState({ lat: 24.8607, lng: 67.0011 });

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await fetch("https://countriesnow.space/api/v0.1/countries/cities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ country: "Pakistan" }),
        });
        const data = await response.json();
        setCities(data.data || []);
      } catch (error) {
        console.error("Failed to fetch cities", error);
      }
    };

    fetchCities();
  }, []);

  const handleUseMapLocation = () => {
    setManualAddress(`${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`);
  };

  const containerStyle = {
    width: "100%",
    height: "100%",
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row h-screen mt-20 gap-4">
      {/* Left Section */}
      <div className="w-full md:w-1/2 p-6 space-y-8 rounded-lg shadow">
        <h2 className="text-xl font-semibold">Find a Service Provider</h2>

        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="">Select City</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={manualAddress}
          onChange={(e) => setManualAddress(e.target.value)}
          placeholder="Enter Address Manually"
          className="w-full p-2 border rounded"
        />

        <button
          onClick={handleUseMapLocation}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Use Map Location as Address
        </button>

        <p className="text-sm mt-2">
          Latitude: {location.lat.toFixed(4)}, Longitude: {location.lng.toFixed(4)}
        </p>

        <button
          onClick={() =>
            console.log({ selectedCity, manualAddress, location })
          }
          className="w-full bg-orange-600 text-white py-2 rounded hover:bg-orange-700"
        >
          Find Provider
        </button>
      </div>

      {/* Right Section */}
      <div className="w-full md:w-1/2 h-[300px] md:h-full rounded-lg overflow-hidden shadow">
        <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={location}
            zoom={12}
            onClick={(e) => {
              if (e.latLng) {
                setLocation({
                  lat: e.latLng.lat(),
                  lng: e.latLng.lng(),
                });
              }
            }}
          >
            <Marker position={location} />
          </GoogleMap>
        </LoadScript>
      </div>
    </div>
  );
}
