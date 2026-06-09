import { useEffect, useState } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import "leaflet-defaulticon-compatibility";

type Memory = {
  id: string;
  title: string;
  description?: string;
  location_name?: string;
  category?: string;
  image_url?: string;
  visit_date: string;
  lat?: number | null;
  lng?: number | null;
};

function MapController({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();

  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1 });
  }, [center, zoom, map]);

  return null;
}

export default function DynamicMap({ memories }: { memories: Memory[] }) {
  const [replayIndex, setReplayIndex] = useState(-1);
  const [isReplaying, setIsReplaying] = useState(false);

  const defaultLat = memories.length > 0 ? Number(memories[0].lat) : 20;
  const defaultLng = memories.length > 0 ? Number(memories[0].lng) : 77;

  const currentCenter: [number, number] =
    replayIndex >= 0 && replayIndex < memories.length
      ? [Number(memories[replayIndex].lat), Number(memories[replayIndex].lng)]
      : [defaultLat, defaultLng];

  const currentZoom = isReplaying ? 6 : 5;

  useEffect(() => {
    if (!isReplaying) return;

    if (replayIndex < memories.length - 1) {
      const timer = setTimeout(() => {
        setReplayIndex((prev) => prev + 1);
      }, 2000);

      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      setIsReplaying(false);
      setReplayIndex(-1);
    }, 3000);

    return () => clearTimeout(timer);
  }, [isReplaying, replayIndex, memories.length]);

  const handleReplay = () => {
    setReplayIndex(0);
    setIsReplaying(true);
  };

  const tripSegments: [number, number][][] = [];
  let currentTrip: [number, number][] = [];

  memories.forEach((mem, index) => {
    if (index === 0) {
      currentTrip.push([Number(mem.lat), Number(mem.lng)]);
      return;
    }

    const previousDate = new Date(memories[index - 1].visit_date);
    const currentDate = new Date(mem.visit_date);
    const diffDays =
      (currentDate.getTime() - previousDate.getTime()) /
      (1000 * 60 * 60 * 24);

    if (diffDays > 20) {
      tripSegments.push(currentTrip);
      currentTrip = [];
    }

    currentTrip.push([Number(mem.lat), Number(mem.lng)]);
  });

  if (currentTrip.length > 0) {
    tripSegments.push(currentTrip);
  }

  const visibleMemories = isReplaying
    ? memories.slice(0, replayIndex + 1)
    : memories;

  return (
    <div className="relative z-0 h-[620px] w-full overflow-hidden">
      <div className="absolute right-4 top-4 z-[1000]">
        <button
          onClick={handleReplay}
          disabled={isReplaying || memories.length < 2}
          className="retro-button bg-white text-sm disabled:opacity-50"
        >
          {isReplaying
            ? `Replaying (${replayIndex + 1}/${memories.length})`
            : "Replay Journey"}
        </button>
      </div>

      <MapContainer
        center={[20, 77]}
        zoom={5}
        scrollWheelZoom={true}
        style={{ height: "620px", width: "100%" }}
      >
        <MapController center={currentCenter} zoom={currentZoom} />

        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {tripSegments.map((trip, index) =>
          trip.length > 1 ? (
            <Polyline
              key={index}
              positions={trip}
              color="#5F8F7B"
              weight={4}
              dashArray="8,8"
            />
          ) : null
        )}

        {visibleMemories.map((mem) => (
          <Marker key={mem.id} position={[Number(mem.lat), Number(mem.lng)]}>
            <Popup>
              <div className="font-black text-[var(--ink)]">{mem.title}</div>
              <div className="mb-2 text-xs text-[var(--muted)]">
                {mem.location_name}
              </div>
              <div className="mb-2 text-xs font-black uppercase text-[var(--primary)]">
                {mem.category}
              </div>
              {mem.image_url && (
                <img
                  src={mem.image_url}
                  alt="Memory"
                  className="mb-2 h-24 w-full rounded bg-[var(--secondary)] object-contain"
                />
              )}
              {mem.description && (
                <p className="line-clamp-3 text-xs text-[var(--muted)]">
                  {mem.description}
                </p>
              )}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
