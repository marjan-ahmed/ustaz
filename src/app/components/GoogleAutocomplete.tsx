"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Loader } from "@googlemaps/js-api-loader";
import { MapPin, X, Loader2 } from "lucide-react";

/* ─── Inject Google pac-container styles once ─────────────────────────────── */
const PAC_STYLES = `
  .pac-container {
    margin-top: 6px;
    border-radius: 14px;
    border: 1.5px solid #e5e7eb;
    box-shadow: 0 8px 32px rgba(219,75,13,0.10), 0 2px 8px rgba(0,0,0,0.07);
    background: #ffffff;
    font-family: inherit;
    overflow: hidden;
    z-index: 9999;
    padding: 6px 0;
  }
  .pac-container::after { display: none; }

  .pac-item {
    display: flex;
    align-items: center;
    padding: 10px 14px;
    font-size: 13.5px;
    color: #1f2937;
    cursor: pointer;
    border: none;
    transition: background 0.15s;
    line-height: 1.4;
  }
  .pac-item:hover,
  .pac-item-selected {
    background: #fff7f4;
  }

  .pac-icon {
    display: none;
  }
  /* Custom pin icon via pseudo-element */
  .pac-item::before {
    content: "";
    display: inline-block;
    width: 16px;
    height: 16px;
    margin-right: 10px;
    flex-shrink: 0;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23db4b0d' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0z'/%3E%3Ccircle cx='12' cy='10' r='3'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-size: contain;
  }

  .pac-item-query {
    font-weight: 600;
    color: #111827;
    font-size: 13.5px;
    padding-right: 3px;
  }
  .pac-matched {
    color: #db4b0d;
    font-weight: 700;
  }
`;

function injectPacStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById("ustaz-pac-styles")) return;
  const style = document.createElement("style");
  style.id = "ustaz-pac-styles";
  style.textContent = PAC_STYLES;
  document.head.appendChild(style);
}

/* ─── Component ───────────────────────────────────────────────────────────── */
interface GoogleAutocompleteProps {
  value: string;
  onPlaceSelect: (address: string, lat: number | null, lng: number | null) => void;
  disabled?: boolean;
  className?: string;
}

const GoogleAutocomplete: React.FC<GoogleAutocompleteProps> = ({
  value,
  onPlaceSelect,
  disabled = false,
  className = "",
}) => {
  const t = useTranslations("process");
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [apiLoaded, setApiLoaded] = useState(false);
  const [apiError, setApiError] = useState(false);
  const [internalValue, setInternalValue] = useState(value);
  const [focused, setFocused] = useState(false);

  /* sync external value → internal */
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  /* load Google Maps once */
  useEffect(() => {
    injectPacStyles();
    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
      version: "weekly",
      libraries: ["places"],
    });
    loader
      .load()
      .then(() => setApiLoaded(true))
      .catch(() => setApiError(true));
  }, []);

  /* init Autocomplete after API loads */
  useEffect(() => {
    if (!apiLoaded || !inputRef.current || autocompleteRef.current) return;

    autocompleteRef.current = new window.google.maps.places.Autocomplete(
      inputRef.current,
      { types: ["address"] }
    );

    const ac = autocompleteRef.current;
    ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      if (place?.formatted_address && place.geometry?.location) {
        const addr = place.formatted_address;
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setInternalValue(addr);
        onPlaceSelect(addr, lat, lng);
      } else if (inputRef.current) {
        onPlaceSelect(inputRef.current.value, null, null);
        setInternalValue(inputRef.current.value);
      }
    });
  }, [apiLoaded, onPlaceSelect]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInternalValue(e.target.value);
      onPlaceSelect(e.target.value, null, null);
    },
    [onPlaceSelect]
  );

  const handleClear = useCallback(() => {
    setInternalValue("");
    onPlaceSelect("", null, null);
    inputRef.current?.focus();
  }, [onPlaceSelect]);

  /* ── Loading state ── */
  if (!apiLoaded && !apiError) {
    return (
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
          <Loader2 className="w-4 h-4 text-[#db4b0d] animate-spin" />
        </div>
        <input
          disabled
          placeholder="Loading map services…"
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
        />
      </div>
    );
  }

  /* ── Error state ── */
  if (apiError) {
    return (
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
          <MapPin className="w-4 h-4 text-gray-400" />
        </div>
        <input
          type="text"
          value={internalValue}
          onChange={handleChange}
          disabled={disabled}
          placeholder="Enter your address"
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm bg-white text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#db4b0d]"
        />
      </div>
    );
  }

  /* ── Main autocomplete input ── */
  return (
    <div className="relative w-full group">
      {/* Left pin icon */}
      <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none z-10">
        <MapPin
          className={`w-4 h-4 transition-colors duration-200 ${
            focused ? "text-[#db4b0d]" : "text-gray-400"
          }`}
        />
      </div>

      <input
        ref={inputRef}
        type="text"
        value={internalValue}
        onChange={handleChange}
        disabled={disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={t("enterStreetAddress")}
        className={[
          "w-full pl-10 pr-9 py-3 text-sm rounded-xl transition-all duration-200",
          "border bg-white text-gray-800 placeholder:text-gray-400",
          "focus:outline-none focus:ring-0",
          focused
            ? "border-[#db4b0d] shadow-[0_0_0_3px_rgba(219,75,13,0.12)]"
            : "border-gray-300 hover:border-gray-400",
          disabled ? "bg-gray-50 text-gray-400 cursor-not-allowed opacity-70" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      />

      {/* Clear button */}
      {internalValue && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-[#db4b0d] transition-colors"
          aria-label="Clear address"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export default GoogleAutocomplete;
