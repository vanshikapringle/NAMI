import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Route, MapPin, Calendar, Plus } from "lucide-react";
import Image from "next/image";

import { supabase } from "@/lib/supabaseClient";
import JourneyReplay from "./JourneyReplay";

type Trip = {
  id: string;
  name: string;
  description?: string;
  cover_image?: string;
  start_date?: string;
  end_date?: string;
  start_location?: string;
  end_location?: string;
};

type Memory = any; // Will use the full type when actually building components, or just pass generic any

export default function TripView({
  trips,
  memories,
  onMemoryClick,
  onTripUpdated,
}: {
  trips: Trip[];
  memories: Memory[];
  onMemoryClick: (memory: Memory) => void;
  onTripUpdated?: (updatedTrip: Trip) => void;
}) {
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Trip>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isReplaying, setIsReplaying] = useState(false);

  const activeTrip = useMemo(
    () => trips.find((t) => t.id === selectedTrip) || null,
    [trips, selectedTrip]
  );

  const handleEditClick = () => {
    if (activeTrip) {
      setEditData({ ...activeTrip });
      setIsEditing(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!activeTrip || !editData.name) return;
    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from("trips")
        .update({
          name: editData.name,
          description: editData.description || null,
          start_date: editData.start_date || null,
          end_date: editData.end_date || null,
          start_location: editData.start_location || null,
          end_location: editData.end_location || null,
          cover_image: editData.cover_image || null,
        })
        .eq("id", activeTrip.id)
        .select()
        .single();
      
      if (data && !error && onTripUpdated) {
        onTripUpdated(data);
      }
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update trip", err);
    } finally {
      setIsSaving(false);
    }
  };

  const tripMemories = useMemo(() => {
    if (!selectedTrip) return [];
    return memories.filter((m) => m.trip_id === selectedTrip);
  }, [memories, selectedTrip]);

  const places = useMemo(() => {
    const map = new Map<string, Memory[]>();
    tripMemories.forEach((m) => {
      const loc = m.location_name || "Unknown Location";
      if (!map.has(loc)) map.set(loc, []);
      map.get(loc)!.push(m);
    });
    return Array.from(map.entries());
  }, [tripMemories]);

  if (!selectedTrip) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-foreground sm:text-3xl">
              Your Trips
            </h2>
            <p className="mt-1 text-sm font-medium text-muted-foreground sm:text-base">
              Journeys organized by trips and destinations.
            </p>
          </div>
        </div>

        {trips.length === 0 ? (
          <div className="flex h-[300px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border bg-card/30 p-8 text-center">
            <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary">
              <Route className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-foreground">No trips yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Create a trip when uploading your first memory to organize your journey.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {trips.map((trip) => (
              <motion.div
                key={trip.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedTrip(trip.id);
                  setIsEditing(false);
                }}
                className="group relative cursor-pointer overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition-all hover:shadow-md"
              >
                <div className="relative h-48 w-full bg-muted">
                  {trip.cover_image ? (
                    <Image
                      src={trip.cover_image}
                      alt={trip.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-secondary/50 text-muted-foreground">
                      <Route className="h-10 w-10 opacity-50" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h3 className="text-xl font-bold line-clamp-1">{trip.name}</h3>
                    {(trip.start_date || trip.end_date) && (
                      <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-white/80">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {trip.start_date} {trip.end_date ? `- ${trip.end_date}` : ""}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <button
        onClick={() => setSelectedTrip(null)}
        className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Back to Trips
      </button>

      <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
        {isEditing ? (
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Edit Trip Details</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground">Trip Name</label>
                <input
                  type="text"
                  value={editData.name || ""}
                  onChange={(e) => setEditData({...editData, name: e.target.value})}
                  className="mt-1 w-full rounded-xl border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground">Description</label>
                <input
                  type="text"
                  value={editData.description || ""}
                  onChange={(e) => setEditData({...editData, description: e.target.value})}
                  className="mt-1 w-full rounded-xl border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground">Starting Point</label>
                <input
                  type="text"
                  value={editData.start_location || ""}
                  onChange={(e) => setEditData({...editData, start_location: e.target.value})}
                  className="mt-1 w-full rounded-xl border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground">Destination (End)</label>
                <input
                  type="text"
                  value={editData.end_location || ""}
                  onChange={(e) => setEditData({...editData, end_location: e.target.value})}
                  className="mt-1 w-full rounded-xl border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground">Start Date</label>
                <input
                  type="date"
                  value={editData.start_date || ""}
                  onChange={(e) => setEditData({...editData, start_date: e.target.value})}
                  className="mt-1 w-full rounded-xl border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground">End Date</label>
                <input
                  type="date"
                  value={editData.end_date || ""}
                  onChange={(e) => setEditData({...editData, end_date: e.target.value})}
                  className="mt-1 w-full rounded-xl border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Cover Image URL</label>
                <input
                  type="text"
                  value={editData.cover_image || ""}
                  onChange={(e) => setEditData({...editData, cover_image: e.target.value})}
                  className="mt-1 w-full rounded-xl border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setIsEditing(false)}
                className="rounded-xl border border-border px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-secondary"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90"
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Trip"}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tight text-foreground">
                  {activeTrip?.name}
                </h2>
                {activeTrip?.description && (
                  <p className="mt-2 text-base text-muted-foreground">
                    {activeTrip.description}
                  </p>
                )}
                {(activeTrip?.start_location || activeTrip?.end_location) && (
                  <div className="mt-4 flex items-center gap-2 text-sm font-medium text-primary">
                    <Route className="h-4 w-4" />
                    <span>
                      {activeTrip.start_location || "?"} → {activeTrip.end_location || "?"}
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={handleEditClick}
                className="rounded-xl border border-border bg-secondary px-4 py-2 text-sm font-bold text-foreground hover:bg-border transition-colors"
              >
                Edit Trip
              </button>
            </div>
            {tripMemories.length > 0 && (
              <div className="mt-6 flex justify-start">
                <button
                  onClick={() => setIsReplaying(true)}
                  className="rounded-xl bg-[#F9A4A6] text-[#291217] px-6 py-3 text-sm font-bold uppercase tracking-widest hover:bg-[#F9A4A6]/80 transition-colors shadow-sm"
                >
                  ▶ Replay Journey
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {isReplaying && activeTrip && (
        <JourneyReplay 
          trip={activeTrip} 
          memories={tripMemories} 
          onClose={() => setIsReplaying(false)} 
        />
      )}

      <div className="space-y-12">
        {places.map(([placeName, localMemories]) => (
          <div key={placeName} className="space-y-4">
            <div className="sticky top-0 z-10 flex items-center gap-2 bg-background/80 py-2 backdrop-blur-md">
              <MapPin className="h-5 w-5 text-primary" />
              <h3 className="text-xl font-bold uppercase tracking-tight text-foreground">
                {placeName}
              </h3>
              <span className="ml-2 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold text-muted-foreground">
                {localMemories.length}
              </span>
            </div>
            
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {localMemories.map((memory) => (
                <motion.div
                  key={memory.id}
                  whileHover={{ y: -4 }}
                  onClick={() => onMemoryClick(memory)}
                  className="group cursor-pointer overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:shadow-md"
                >
                  <div className="relative aspect-square w-full bg-muted">
                    {memory.image_url ? (
                      <Image
                        src={memory.image_url}
                        alt={memory.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-secondary">
                        <MapPin className="h-8 w-8 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h4 className="font-bold text-foreground line-clamp-1">
                      {memory.title}
                    </h4>
                    {memory.category && (
                      <span className="mt-2 inline-block rounded-lg bg-secondary px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {memory.category}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
        {places.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            No memories assigned to this trip yet.
          </div>
        )}
      </div>
    </div>
  );
}
