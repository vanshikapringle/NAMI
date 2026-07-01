"use client";

import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet-defaulticon-compatibility";

type LocationPickerMapProps = {
  selectedPos: [number, number];
  onPositionSelected: (lat: number, lng: number) => void;
};

function ClickHandler({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationPickerMap({ selectedPos, onPositionSelected }: LocationPickerMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-64 w-full items-center justify-center border-2 border-[var(--text-primary)] bg-[var(--accent-muted)]/20 font-mono text-xs text-[var(--text-secondary)]">
        LOADING INTERACTIVE MAP...
      </div>
    );
  }

  return (
    <div className="relative h-64 w-full overflow-hidden border-2 border-[var(--text-primary)]">
      <MapContainer
        center={selectedPos}
        zoom={6}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={selectedPos} />
        <ClickHandler onSelect={onPositionSelected} />
      </MapContainer>
      <div className="absolute bottom-2 left-2 z-[1000] border-2 border-[var(--text-primary)] bg-[var(--bg-main)] px-2 py-1 font-mono text-[10px] font-bold text-[var(--text-primary)] shadow-sm">
        CLICK ANYWHERE ON MAP TO DROP PIN
      </div>
    </div>
  );
}
