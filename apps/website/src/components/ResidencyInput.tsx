"use client";

import { useState, useRef, useEffect } from "react";
import { MapPin, Loader2, X } from "lucide-react";
import { KARACHI_AREAS } from "@ustaz/shared/utils";

interface ResidencyInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  onBlur?: () => void;
}

export default function ResidencyInput({
  value,
  onChange,
  error,
  onBlur,
}: ResidencyInputProps) {
  const [detecting, setDetecting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [filter, setFilter] = useState("");
  const [hasDetected, setHasDetected] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filtered = KARACHI_AREAS.filter((area) =>
    area.toLowerCase().includes(filter.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function extractAreaFromGeocode(data: any): string | null {
    if (!data.results?.length) return null;
    const components: any[] = data.results[0].address_components || [];
    const find = (type: string) =>
      components.find((c: any) => c.types.includes(type))?.long_name;

    const sublocality1 = find('sublocality_level_1');
    if (sublocality1 && sublocality1.toLowerCase() !== 'karachi') return sublocality1;

    const sublocality = find('sublocality');
    if (sublocality && sublocality.toLowerCase() !== 'karachi') return sublocality;

    const neighborhood = find('neighborhood');
    if (neighborhood) {
      const match = KARACHI_AREAS.find(area =>
        neighborhood.toLowerCase().includes(area.toLowerCase()) ||
        area.toLowerCase().includes(neighborhood.toLowerCase())
      );
      if (match) return match;
      return neighborhood;
    }

    const locality = find('locality');
    if (locality && locality.toLowerCase() !== 'karachi') return locality;

    const formatted: string = data.results[0].formatted_address || '';
    const parts = formatted.split(',').map((s: string) => s.trim()).filter(Boolean);
    if (parts.length >= 2) return parts[parts.length - 2];
    if (parts.length === 1) return parts[0];
    return null;
  }

  async function detectLocation() {
    if (!navigator.geolocation) {
      setShowDropdown(true);
      return;
    }
    setDetecting(true);
    try {
      const pos = await new Promise<GeolocationPosition>(
        (resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
          })
      );
      const { latitude, longitude } = pos.coords;
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        setShowDropdown(true);
        return;
      }
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
      );
      const data = await res.json();
      const area = extractAreaFromGeocode(data);
      if (area) {
        onChange(area);
        setFilter("");
      } else {
        setShowDropdown(true);
      }
    } catch {
      setShowDropdown(true);
    } finally {
      setDetecting(false);
      setHasDetected(true);
    }
  }

  function handleFocus() {
    if (!hasDetected && !value) {
      detectLocation();
    } else {
      setShowDropdown(true);
    }
  }

  return (
    <div className="relative">
      <div
        className={`flex min-h-[48px] items-center overflow-hidden rounded-xl border bg-white transition-colors focus-within:border-[#db4b0d] focus-within:ring-2 focus-within:ring-[#db4b0d]/15 ${
          error ? "border-red-300" : "border-gray-200"
        }`}
      >
        <span className="flex h-full shrink-0 items-center border-r border-gray-200 bg-gray-50 px-3.5">
          {detecting ? (
            <Loader2 className="h-4 w-4 animate-spin text-[#db4b0d]" />
          ) : (
            <MapPin className="h-4 w-4 text-gray-400" />
          )}
        </span>
        <input
          ref={inputRef}
          type="text"
          value={showDropdown ? filter : value}
          onChange={(e) => {
            setFilter(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={handleFocus}
          onBlur={onBlur}
          placeholder={detecting ? "Detecting your location..." : "e.g. Malir Halt, Defence, Clifton..."}
          className="w-full bg-transparent px-4 text-[15px] text-[#0f1729] outline-none placeholder:text-gray-400"
        />
        {value && !showDropdown && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setFilter("");
              setHasDetected(false);
            }}
            className="shrink-0 px-2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg"
        >
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500">
              No areas found. Type to search or use a custom name.
            </div>
          ) : (
            filtered.map((area) => (
              <button
                key={area}
                type="button"
                onClick={() => {
                  onChange(area);
                  setFilter("");
                  setShowDropdown(false);
                }}
                className={`w-full px-4 py-2.5 text-left text-sm hover:bg-[#db4b0d]/5 transition-colors ${
                  value === area ? "bg-[#db4b0d]/10 font-semibold text-[#db4b0d]" : "text-[#0f1729]"
                }`}
              >
                {area}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
