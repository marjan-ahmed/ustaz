"use client";

import { useState } from "react";
import { MapPin, Loader2, X, LocateFixed } from "lucide-react";

const KARACHI_AREAS = [
  "Defence Phase V", "Defence Phase VI", "Defence Phase VII", "Defence Phase VIII",
  "Clifton", "Clifton Block 2", "Clifton Block 5", "Clifton Block 9",
  "Gulshan-e-Iqbal", "Gulistan-e-Johar", "Gulshan-e-Hadeed",
  "North Nazimabad", "North Karachi", "Nazimabad",
  "PECHS", "PECHS Block 2", "PECHS Block 6",
  "Malir", "Malir Halt", "Malir Cantt",
  "Korangi", "Korangi Industrial Area",
  "Saddar", "Burns Garden", "Bahadurabad", "Tariq Road",
  "Scheme 33", "Gizri", "Orangi Town",
  "SITE Area", "SITE Industrial Area", "Surjani Town",
  "North Korangi", "Shah Faisal Colony", "Federal B Area",
  "Buffer Zone", "Kiaa Chaari", "Landhi", "Steel Town",
  "Ibrahim Hyderi", "Baldia Town", "Manghopir",
];

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
  const [detectError, setDetectError] = useState<string | null>(null);

  function extractAreaFromGeocode(data: any): string | null {
    if (!data.results?.length) return null;
    const components: any[] = data.results[0].address_components || [];
    const find = (type: string) =>
      components.find((c: any) => c.types.includes(type))?.long_name;

    const neighborhood = find("neighborhood");
    const sublocality1 = find("sublocality_level_1");
    const sublocality = find("sublocality");
    const locality = find("locality");

    const broadArea =
      (sublocality1 && sublocality1.toLowerCase() !== "karachi" ? sublocality1 : null) ||
      (sublocality && sublocality.toLowerCase() !== "karachi" ? sublocality : null) ||
      (locality && locality.toLowerCase() !== "karachi" ? locality : null);

    if (neighborhood && broadArea) {
      return `${neighborhood}, ${broadArea}`;
    }
    if (neighborhood) {
      const match = KARACHI_AREAS.find(
        (area) =>
          neighborhood.toLowerCase().includes(area.toLowerCase()) ||
          area.toLowerCase().includes(neighborhood.toLowerCase())
      );
      return match || neighborhood;
    }
    if (broadArea) return broadArea;

    const formatted: string = data.results[0].formatted_address || "";
    const parts = formatted
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);
    if (parts.length >= 2) return parts[parts.length - 2];
    if (parts.length === 1) return parts[0];
    return null;
  }

  async function handleLocate() {
    setDetectError(null);

    if (!navigator.geolocation || !window.isSecureContext) {
      setDetectError(
        "Location needs a secure (https) connection. Please type your area."
      );
      return;
    }

    setDetecting(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          // Coarse WiFi/cell fix is enough for neighborhood granularity and
          // succeeds on laptops with no GPS, where high accuracy fails fast.
          enableHighAccuracy: false,
          timeout: 30000,
          maximumAge: 300000,
        })
      );

      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        setDetectError("Location lookup is unavailable. Please type your area.");
        return;
      }

      const { latitude, longitude } = pos.coords;
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
      );
      const data = await res.json();
      const area = extractAreaFromGeocode(data);

      if (area) {
        onChange(area);
      } else {
        setDetectError("Couldn't identify your area. Please type it.");
      }
    } catch (e: any) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[ResidencyInput] detection failed:", e);
      }
      setDetectError(
        e?.code === 1
          ? "Location permission denied. Enable it in your browser settings."
          : "Couldn't detect your location. Please type your area."
      );
    } finally {
      setDetecting(false);
    }
  }

  return (
    <div>
      <div
        className={`flex min-h-[48px] items-center overflow-hidden rounded-xl border bg-white transition-colors focus-within:border-[#db4b0d] focus-within:ring-2 focus-within:ring-[#db4b0d]/15 ${
          error ? "border-red-300" : "border-gray-200"
        }`}
      >
        <span className="flex h-full shrink-0 items-center border-r border-gray-200 bg-gray-50 px-3.5">
          <MapPin className="h-4 w-4 text-gray-400" />
        </span>

        <input
          type="text"
          value={value}
          onChange={(e) => {
            setDetectError(null);
            onChange(e.target.value);
          }}
          onBlur={onBlur}
          placeholder="e.g. Alfalah Society, Malir Halt..."
          className="w-full bg-transparent px-4 text-[15px] text-[#0f1729] outline-none placeholder:text-gray-400"
        />

        {value && !detecting && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setDetectError(null);
            }}
            aria-label="Clear area"
            className="shrink-0 px-3.5 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={handleLocate}
        disabled={detecting}
        className="mt-2 flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl border border-[#db4b0d]/25 bg-[#FFF7ED] px-4 text-sm font-semibold text-[#db4b0d] transition-colors hover:border-[#db4b0d]/40 hover:bg-[#db4b0d]/10 active:bg-[#db4b0d]/15 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {detecting ? (
          <Loader2 className="h-[18px] w-[18px] animate-spin" />
        ) : (
          <LocateFixed className="h-[18px] w-[18px]" />
        )}
        {detecting ? "Locating you..." : "Use my current location"}
      </button>

      {detectError && (
        <p className="mt-1.5 text-xs text-gray-500">{detectError}</p>
      )}
    </div>
  );
}
