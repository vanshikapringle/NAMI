"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Search, MapPin, Check, SkipForward, Loader2, AlertCircle } from "lucide-react";

const LocationPickerMap = dynamic(() => import("./LocationPickerMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 w-full items-center justify-center border-2 border-[var(--text-primary)] bg-[var(--accent-muted)]/20 font-mono text-xs text-[var(--text-secondary)]">
      LOADING INTERACTIVE MAP...
    </div>
  ),
});

export type LocationSelection = {
  lat: number | null;
  lng: number | null;
  location_name: string;
  location_source: "exif" | "manual_search" | "manual_map" | "none";
};

type LocationPickerProps = {
  initialLat?: number | null;
  initialLng?: number | null;
  initialLocationName?: string;
  onSaveLocation: (selection: LocationSelection) => void;
  onSkipLocation: () => void;
};

type SearchSuggestion = {
  lat: number;
  lng: number;
  city: string;
  country: string;
  formatted_address: string;
};

export default function LocationPicker({
  initialLat,
  initialLng,
  initialLocationName,
  onSaveLocation,
  onSkipLocation,
}: LocationPickerProps) {
  const [activeTab, setActiveTab] = useState<"search" | "map">("search");
  const [searchQuery, setSearchQuery] = useState(initialLocationName || "");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [selectedPos, setSelectedPos] = useState<[number, number]>(
    initialLat && initialLng ? [initialLat, initialLng] : [37.7749, -122.4194]
  );
  const [selectedAddress, setSelectedAddress] = useState<string>(
    initialLocationName || ""
  );
  const [locationSource, setLocationSource] = useState<"manual_search" | "manual_map">(
    "manual_search"
  );
  const [reversing, setReversing] = useState(false);
  const [suppressSuggestions, setSuppressSuggestions] = useState(false);

  useEffect(() => {
    if (suppressSuggestions || !searchQuery || searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoadingSearch(true);
      try {
        const res = await fetch(
          `http://localhost:8000/api/v1/location/search?query=${encodeURIComponent(searchQuery)}`
        );
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setSuggestions(json.data);
          }
        }
      } catch (err) {
        console.error("Location search failed:", err);
      } finally {
        setLoadingSearch(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery, suppressSuggestions]);

  const handleMapClick = async (lat: number, lng: number) => {
    setSelectedPos([lat, lng]);
    setLocationSource("manual_map");
    setReversing(true);
    setSuppressSuggestions(true);
    try {
      const res = await fetch(
        `http://localhost:8000/api/v1/location/reverse?lat=${lat}&lng=${lng}&source=manual_map`
      );
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setSelectedAddress(json.data.formatted_address);
          setSearchQuery(json.data.formatted_address);
        }
      } else {
        const fallback = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        setSelectedAddress(fallback);
        setSearchQuery(fallback);
      }
    } catch {
      const fallback = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      setSelectedAddress(fallback);
      setSearchQuery(fallback);
    } finally {
      setReversing(false);
    }
  };

  const selectSuggestion = (sug: SearchSuggestion) => {
    setSelectedPos([sug.lat, sug.lng]);
    setSelectedAddress(sug.formatted_address);
    setSearchQuery(sug.formatted_address);
    setLocationSource("manual_search");
    setSuggestions([]);
    setSuppressSuggestions(true);
    
    // Auto-confirm when they select an explicit suggestion
    onSaveLocation({
      lat: sug.lat,
      lng: sug.lng,
      location_name: sug.formatted_address,
      location_source: "manual_search",
    });
  };

  const handleInputChange = (val: string) => {
    setSearchQuery(val);
    setSuppressSuggestions(false);
  };

  return (
    <div className="flex flex-col gap-4 border-2 border-[var(--text-primary)] bg-[var(--bg-main)] p-4 font-mono text-[var(--text-primary)] shadow-[4px_4px_0px_0px_var(--text-primary)]">
      {/* Alert Banner */}
      <div className="flex items-start gap-2.5 border-2 border-[var(--text-primary)] bg-[#FDF0D5] p-3 text-xs font-bold">
        <AlertCircle className="h-4 w-4 shrink-0 text-[#C1121F]" />
        <div>
          <p className="uppercase text-[#C1121F]">GPS Coordinates Found? NO</p>
          <p className="mt-0.5 text-[11px] font-normal text-[var(--text-primary)]">
            We couldn&apos;t determine the location automatically. Search for a place below or drop a pin on the map.
          </p>
        </div>
      </div>

      {/* Unified Search / Selected Location Bar */}
      <div className="relative">
        <div className="flex items-center border-2 border-[var(--text-primary)] bg-white px-3 py-2 shadow-sm focus-within:bg-[#FFFDF9]">
          <MapPin className="mr-2.5 h-4 w-4 shrink-0 text-[var(--accent)]" />
          <input
            type="text"
            value={reversing ? "Resolving map coordinates..." : searchQuery}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Search city, landmark, or region (e.g. Kyoto, Yosemite)..."
            className="w-full bg-transparent text-xs font-bold text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none"
          />
          {loadingSearch && (
            <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin text-[var(--text-primary)]" />
          )}
        </div>

        {/* Autocomplete Suggestions Dropdown */}
        {suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-[2000] mt-1 max-h-48 overflow-y-auto border-2 border-[var(--text-primary)] bg-white shadow-lg divide-y-2 divide-[var(--text-primary)]">
            {suggestions.map((sug, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => selectSuggestion(sug)}
                className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-[var(--accent-muted)]/30"
              >
                <span className="text-xs font-bold text-[var(--text-primary)]">{sug.city}, {sug.country}</span>
                <span className="line-clamp-1 text-[10px] text-[var(--text-secondary)]">{sug.formatted_address}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-2 border-[var(--text-primary)]">
        <button
          type="button"
          onClick={() => setActiveTab("search")}
          className={`flex flex-1 items-center justify-center gap-2 py-2 text-xs font-bold uppercase transition-colors ${
            activeTab === "search"
              ? "bg-[var(--text-primary)] text-[var(--bg-main)]"
              : "bg-[var(--bg-main)] text-[var(--text-primary)] hover:bg-[var(--accent-muted)]/40"
          }`}
        >
          <Search className="h-3.5 w-3.5" />
          Search Mode
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("map")}
          className={`flex flex-1 items-center justify-center gap-2 border-l-2 border-[var(--text-primary)] py-2 text-xs font-bold uppercase transition-colors ${
            activeTab === "map"
              ? "bg-[var(--text-primary)] text-[var(--bg-main)]"
              : "bg-[var(--bg-main)] text-[var(--text-primary)] hover:bg-[var(--accent-muted)]/40"
          }`}
        >
          <MapPin className="h-3.5 w-3.5" />
          Interactive Map
        </button>
      </div>

      {/* Map View */}
      {activeTab === "map" && (
        <div className="flex flex-col gap-2">
          <LocationPickerMap selectedPos={selectedPos} onPositionSelected={handleMapClick} />
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col gap-2 sm:flex-row mt-1">
        <button
          type="button"
          onClick={() =>
            onSaveLocation({
              lat: selectedPos[0],
              lng: selectedPos[1],
              location_name: selectedAddress || searchQuery || "Unknown Location",
              location_source: locationSource,
            })
          }
          className="flex flex-1 items-center justify-center gap-2 border-2 border-[var(--text-primary)] bg-[var(--accent)] px-4 py-2.5 text-xs font-bold uppercase text-[var(--text-primary)] shadow-[2px_2px_0px_0px_var(--text-primary)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_var(--text-primary)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        >
          <Check className="h-4 w-4" />
          Confirm Location
        </button>
        <button
          type="button"
          onClick={onSkipLocation}
          className="flex items-center justify-center gap-2 border-2 border-[var(--text-primary)] bg-white px-4 py-2.5 text-xs font-bold uppercase text-[var(--text-primary)] shadow-[2px_2px_0px_0px_var(--text-primary)] transition-all hover:bg-gray-100 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_var(--text-primary)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        >
          <SkipForward className="h-4 w-4" />
          Or Skip for Now
        </button>
      </div>
    </div>
  );
}
