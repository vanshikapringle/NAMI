import { useEffect, useState, useMemo } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import "leaflet-defaulticon-compatibility";
import L from "leaflet";
import { Layers, Play } from "lucide-react";

type Trip = {
  id: string;
  name: string;
  description?: string;
  cover_image?: string;
  start_date?: string;
  end_date?: string;
};

type Memory = {
  id: string;
  trip_id?: string;
  title: string;
  description?: string;
  location_name?: string;
  category?: string;
  image_url?: string;
  visit_date: string;
  lat?: number | null;
  lng?: number | null;
};

// Generates a distinct color for a given trip ID (or a fallback)
const generateColor = (id: string) => {
  if (!id) return "#64748B"; // slate-500 for unassigned
  
  const colors = [
    "#EF4444", // red
    "#F97316", // orange
    "#F59E0B", // amber
    "#84CC16", // lime
    "#22C55E", // green
    "#10B981", // emerald
    "#06B6D4", // cyan
    "#3B82F6", // blue
    "#6366F1", // indigo
    "#8B5CF6", // violet
    "#D946EF", // fuchsia
    "#F43F5E", // rose
  ];
  
  // Simple hash
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
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

function MapReplayController({
  memories,
  onStepChange,
  onComplete,
}: {
  memories: Memory[];
  onStepChange: React.Dispatch<React.SetStateAction<number>>;
  onComplete: () => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (memories.length === 0) return;
    
    // Fly to first memory
    const firstMem = memories[0];
    if (firstMem.lat && firstMem.lng) {
      map.flyTo([firstMem.lat, firstMem.lng], 9, { duration: 1.5 });
    }
    onStepChange(0);

    const interval = setInterval(() => {
      onStepChange((prevStep) => {
        const next = prevStep + 1;
        if (next >= memories.length) {
          clearInterval(interval);
          setTimeout(onComplete, 3000);
          return prevStep;
        }
        
        const mem = memories[next];
        if (mem.lat && mem.lng) {
          map.flyTo([mem.lat, mem.lng], 9, { duration: 1.5 });
        }
        return next;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [memories, map, onStepChange, onComplete]);

  return null;
}

export default function DynamicMap({
  memories,
  trips = [],
  onLocationSelect,
}: {
  memories: Memory[];
  trips?: Trip[];
  onLocationSelect?: (locationName: string) => void;
}) {
  const [activeTripIds, setActiveTripIds] = useState<Set<string>>(() => {
    // Default to all trips visible + "unassigned" memories visible
    const set = new Set<string>();
    trips.forEach(t => set.add(t.id));
    set.add("unassigned");
    return set;
  });
  
  const [replayingTripId, setReplayingTripId] = useState<string | null>(null);
  const [replayStep, setReplayStep] = useState<number>(0);
  
  const replayingTrip = useMemo(() => trips.find(t => t.id === replayingTripId), [replayingTripId, trips]);
  const replayingMemories = useMemo(() => {
    if (!replayingTripId) return [];
    return memories
      .filter(m => m.trip_id === replayingTripId)
      .sort((a, b) => new Date(a.visit_date).getTime() - new Date(b.visit_date).getTime());
  }, [replayingTripId, memories]);

  // Ensure new trips are automatically checked when loaded
  useEffect(() => {
    setActiveTripIds((prev) => {
      let changed = false;
      const next = new Set(prev);
      trips.forEach((t) => {
        if (!next.has(t.id)) {
          next.add(t.id);
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [trips]);
  
  const [showPanel, setShowPanel] = useState(false);

  const defaultLat = memories.length > 0 ? Number(memories[0].lat) : 20;
  const defaultLng = memories.length > 0 ? Number(memories[0].lng) : 77;
  const currentCenter: [number, number] = [defaultLat, defaultLng];
  const currentZoom = 5;

  const toggleTrip = (id: string) => {
    setActiveTripIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const visibleMemories = useMemo(() => {
    return memories.filter(mem => {
      const tripId = mem.trip_id || "unassigned";
      return activeTripIds.has(tripId);
    });
  }, [memories, activeTripIds]);

  const tripSegments = useMemo(() => {
    const segments: { tripId: string, positions: [number, number][], color: string }[] = [];
    
    // For each active trip, find its memories, sort them by date, and make a polyline
    for (const tripId of Array.from(activeTripIds)) {
      if (tripId === "unassigned") continue; // We don't draw lines for unassigned
      
      const tripMems = memories
        .filter(m => m.trip_id === tripId && m.lat && m.lng)
        .sort((a, b) => {
          const timeA = new Date(a.visit_date || 0).getTime();
          const timeB = new Date(b.visit_date || 0).getTime();
          return (Number.isNaN(timeA) ? 0 : timeA) - (Number.isNaN(timeB) ? 0 : timeB);
        });
        
      if (tripMems.length > 1) {
        segments.push({
          tripId,
          positions: tripMems.map(m => [Number(m.lat), Number(m.lng)]),
          color: generateColor(tripId),
        });
      }
    }
    
    return segments;
  }, [memories, activeTripIds]);

  const normalizeLocation = (loc: string | null | undefined) => {
    if (!loc || loc === "Unknown Location") return "UNKNOWN LOCATION";
    const parts = loc
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p.length > 0 && !/^\d{4,8}$/.test(p));
    if (parts.length > 2) {
      return parts.slice(0, 2).join(", ").toUpperCase();
    }
    return parts.join(", ").toUpperCase();
  };

  const coordinateGroups = useMemo(() => {
    return Array.from(
      visibleMemories.reduce<Map<string, { memories: Memory[], color: string }>>((groups, memory) => {
        const coordKey = `${memory.lat},${memory.lng}`;
        const current = groups.get(coordKey) || { memories: [], color: generateColor(memory.trip_id || "") };
        current.memories.push(memory);
        groups.set(coordKey, current);
        return groups;
      }, new Map())
    );
  }, [visibleMemories]);

  return (
    <div className="relative z-0 h-full w-full overflow-hidden">
      {/* Debug Info */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-black text-white p-2 text-xs rounded">
        Active Trips: {activeTripIds.size} | Segments: {tripSegments.length}
      </div>
      
      {/* Floating Toggle Panel */}
      <div className="absolute left-4 top-4 z-[1000] flex flex-col items-start gap-2 max-h-[calc(100%-2rem)]">
        <button
          onClick={() => setShowPanel(!showPanel)}
          className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold shadow-md hover:bg-gray-50 transition-colors"
        >
          <Layers className="h-4 w-4" />
          Trips Filter
        </button>
        
        {showPanel && (
          <div className="w-64 overflow-y-auto rounded-xl bg-white p-3 shadow-lg max-h-full">
            <h4 className="mb-2 text-xs font-black uppercase tracking-wider text-muted-foreground">Visible Trips</h4>
            <div className="space-y-1">
              {trips.map(trip => (
                <div key={trip.id} className="flex items-center justify-between gap-1 rounded-lg p-1.5 hover:bg-secondary/50">
                  <label className="flex cursor-pointer items-center gap-2 flex-1">
                    <input
                      type="checkbox"
                      checked={activeTripIds.has(trip.id)}
                      onChange={() => toggleTrip(trip.id)}
                      className="accent-primary"
                    />
                    <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: generateColor(trip.id) }} />
                    <span className="truncate text-sm font-semibold">{trip.name}</span>
                  </label>
                  {activeTripIds.has(trip.id) && (
                    <button 
                      onClick={() => setReplayingTripId(trip.id)}
                      className="p-1 hover:bg-[#F9A4A6] rounded text-[#291217] transition-colors"
                      title="Replay Journey"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>
                  )}
                </div>
              ))}
              <label className="flex cursor-pointer items-center gap-2 rounded-lg p-2 hover:bg-secondary/50">
                <input
                  type="checkbox"
                  checked={activeTripIds.has("unassigned")}
                  onChange={() => toggleTrip("unassigned")}
                  className="accent-primary"
                />
                <div className="h-3 w-3 rounded-full flex-shrink-0 bg-slate-500" />
                <span className="truncate text-sm font-semibold italic">Unassigned Memories</span>
              </label>
            </div>
          </div>
        )}
      </div>

      <MapContainer
        center={[20, 77]}
        zoom={5}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <MapController center={currentCenter} zoom={currentZoom} />

        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {tripSegments.map((segment) => (
          <Polyline
            key={segment.tripId}
            positions={segment.positions}
            pathOptions={{
              color: segment.color,
              weight: 2,
              dashArray: "5, 5",
              opacity: 0.8
            }}
          />
        ))}

        {coordinateGroups.map(([coordKey, { memories: entries, color }]) => {
          const firstMemory = entries[0];
          const displayTitle = entries.length > 1 ? `${entries.length} Memories` : firstMemory.title;
          
          const iconHtml = `
            <div class="map-city-marker">
              <div class="map-city__label" style="border-left-color: ${color}">
                <span data-icon="📍" class="map-city__sign anim-grow shadow-lg" style="background-color: ${color}; color: white; border-color: white; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${displayTitle}</span>
              </div>
            </div>
          `;
          
          const customIcon = L.divIcon({
            className: "bg-transparent border-0",
            html: iconHtml,
            iconSize: [48, 48],
            iconAnchor: [24, 48],
            popupAnchor: [0, -48]
          });

          return (
            <Marker
              key={coordKey}
              position={[Number(firstMemory.lat), Number(firstMemory.lng)]}
              icon={customIcon}
            >
              <Popup>
                <div className="mb-1 text-left font-black text-[var(--foreground)] truncate">
                  {firstMemory.location_name}
                </div>
                <div className="mb-2 text-xs text-[var(--muted)]">
                  {entries.length} {entries.length === 1 ? "memory" : "memories"} saved here
                </div>
                <div className="mb-2 grid max-h-44 grid-cols-2 gap-2 overflow-y-auto">
                  {entries.map((mem) => (
                    <button
                      key={mem.id}
                      type="button"
                      onClick={() => onLocationSelect?.(mem.location_name || "")}
                      className="group overflow-hidden rounded border border-[var(--border)] bg-[var(--secondary)] text-left"
                      title={`Open ${mem.title}`}
                    >
                      {mem.image_url ? (
                        <img
                          src={mem.image_url}
                          alt={mem.title}
                          className="h-20 w-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-20 w-full items-center justify-center text-xs text-[var(--muted-foreground)]">
                          No photo
                        </div>
                      )}
                      <div className="truncate px-2 py-1 text-[10px] font-bold text-[var(--foreground)]">
                        {mem.title}
                      </div>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => onLocationSelect?.(firstMemory.location_name || "")}
                  className="w-full rounded bg-[var(--primary)] px-3 py-2 text-xs font-black text-white"
                >
                  Open location memories
                </button>
              </Popup>
            </Marker>
          );
        })}
        {replayingTripId && replayingMemories.length > 0 && (
          <MapReplayController
            memories={replayingMemories}
            onStepChange={setReplayStep}
            onComplete={() => setReplayingTripId(null)}
          />
        )}
        
        {/* Playback Path with different colors */}
        {replayingTripId && replayingMemories.slice(0, replayStep + 1).map((mem, idx, arr) => {
          if (idx === 0) return null;
          const prev = arr[idx - 1];
          if (!prev.lat || !prev.lng || !mem.lat || !mem.lng) return null;
          // Use different colors for each segment during replay
          const color = generateColor(mem.id); 
          return (
            <Polyline
              key={`replay-seg-${idx}`}
              positions={[[Number(prev.lat), Number(prev.lng)], [Number(mem.lat), Number(mem.lng)]]}
              pathOptions={{
                color: color,
                weight: 4,
                dashArray: "10, 10",
                className: "animate-pulse" // make it pulse for effect
              }}
            />
          );
        })}
      </MapContainer>

      {/* Floating Card for Replay */}
      {replayingTripId && replayingMemories[replayStep] && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-sm bg-[#291217] text-[#E2D9F3] border-4 border-[#F9A4A6] p-4 shadow-2xl flex flex-col gap-3 rounded-xl animate-in fade-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-[#F9A4A6]">
            <span>{replayingTrip?.name}</span>
            <span>{replayStep + 1} / {replayingMemories.length}</span>
          </div>
          {replayingMemories[replayStep].image_url && (
            <img 
              src={replayingMemories[replayStep].image_url!} 
              alt="memory" 
              className="w-full h-32 object-cover rounded border border-white/20"
            />
          )}
          <div>
            <h3 className="font-black text-lg">{replayingMemories[replayStep].title}</h3>
            <p className="text-sm opacity-80">{replayingMemories[replayStep].location_name}</p>
          </div>
          <button 
            onClick={() => setReplayingTripId(null)}
            className="absolute -top-4 -right-4 bg-[#F9A4A6] text-[#291217] w-8 h-8 rounded-full flex items-center justify-center font-black hover:scale-110 transition-transform"
          >
            X
          </button>
        </div>
      )}
    </div>
  );
}
