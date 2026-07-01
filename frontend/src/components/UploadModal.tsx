"use client";

import { useState } from "react";
import { Loader2, UploadCloud, X, CheckCircle2, MapPin, Edit3, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import LocationPicker, { LocationSelection } from "./LocationPicker";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function UploadModal({
  isOpen,
  onClose,
  user,
  existingLocations = [],
  existingMemories = [],
  existingTrips = [],
}: {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  existingLocations?: string[];
  existingMemories?: any[];
  existingTrips?: any[];
}) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzingFile, setAnalyzingFile] = useState(false);
  const [duplicateDetected, setDuplicateDetected] = useState(false);
  const [similarityScore, setSimilarityScore] = useState(0);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [ignoreDuplicateWarning, setIgnoreDuplicateWarning] = useState(false);
  const [step, setStep] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Uncategorized");
  const [description, setDescription] = useState("");
  const [locationName, setLocationName] = useState("");
  const [extractedLat, setExtractedLat] = useState<number | null>(null);
  const [extractedLng, setExtractedLng] = useState<number | null>(null);
  const [locationSource, setLocationSource] = useState<"exif" | "manual_search" | "manual_map" | "none">("none");
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [visitDate, setVisitDate] = useState("");
  const [notes, setNotes] = useState("");
  const [timeSpent, setTimeSpent] = useState("");
  const [rating, setRating] = useState(5);
  const [favoriteMoment, setFavoriteMoment] = useState("");
  const [success, setSuccess] = useState(false);

  const [selectedTripId, setSelectedTripId] = useState("none");
  const [isCreatingTrip, setIsCreatingTrip] = useState(false);
  const [newTripName, setNewTripName] = useState("");
  const [newTripStartDate, setNewTripStartDate] = useState("");
  const [newTripEndDate, setNewTripEndDate] = useState("");
  const [newTripStartLocation, setNewTripStartLocation] = useState("");
  const [newTripCoverImage, setNewTripCoverImage] = useState("");
  const [newTripDescription, setNewTripDescription] = useState("");

  const [modalStep, setModalStep] = useState<"trip" | "memory">("trip");

  const resetForm = () => {
    setFile(null);
    setAnalyzingFile(false);
    setDuplicateDetected(false);
    setShowDuplicateWarning(false);
    setIgnoreDuplicateWarning(false);
    setTitle("");
    setCategory("Uncategorized");
    setDescription("");
    setLocationName("");
    setExtractedLat(null);
    setExtractedLng(null);
    setLocationSource("none");
    setShowLocationPicker(false);
    setVisitDate("");
    setNotes("");
    setTimeSpent("");
    setRating(5);
    setFavoriteMoment("");
    setSuccess(false);
    setStep("");
    setSelectedTripId("none");
    setIsCreatingTrip(false);
    setNewTripName("");
    setNewTripStartDate("");
    setNewTripEndDate("");
    setNewTripCoverImage("");
    setNewTripDescription("");
    setModalStep("trip");
  };

  const handleClose = () => {
    if (!loading && !analyzingFile) {
      resetForm();
      onClose();
    }
  };

  const handleFileSelect = async (selectedFile: File | null) => {
    setFile(selectedFile);
    if (!selectedFile) {
      setExtractedLat(null);
      setExtractedLng(null);
      setLocationName("");
      setLocationSource("none");
      setShowLocationPicker(false);
      return;
    }

    setAnalyzingFile(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const apiRes = await fetch("http://localhost:8000/upload-photo", {
        method: "POST",
        body: formData,
      });

        if (apiRes.ok) {
          const apiData = await apiRes.json();
          const isBackendDup = apiData.duplicate?.is_duplicate === true;
          const backendSimilarity = apiData.duplicate?.similarity_score || 0;
          const isFrontendDup = existingMemories?.some((m: any) => 
            m.title === selectedFile.name || 
            m.image_url?.includes(selectedFile.name)
          ) || false;
          setDuplicateDetected(isBackendDup || isFrontendDup);
          setSimilarityScore(isBackendDup ? backendSimilarity : (isFrontendDup ? 1.0 : 0));

          const hasGps =
            apiData.lat !== null &&
            apiData.lat !== undefined &&
            apiData.lng !== null &&
            apiData.lng !== undefined &&
            apiData.location_name &&
            apiData.location_name !== "Unknown Location";

        if (hasGps) {
          setExtractedLat(apiData.lat);
          setExtractedLng(apiData.lng);
          setLocationName(apiData.location_name);
          setLocationSource("exif");
          setShowLocationPicker(false);
          
          if (!title || title.trim() === "" || title === "Unknown Location") {
            setTitle(apiData.location_name);
          }
        } else {
          setExtractedLat(null);
          setExtractedLng(null);
          setLocationName("Unknown Location");
          setLocationSource("none");
          setShowLocationPicker(true);
        }
        
        if (apiData.timestamp) {
          // EXIF format is typically "YYYY:MM:DD HH:MM:SS"
          try {
            const datePart = apiData.timestamp.split(" ")[0].replace(/:/g, "-");
            if (datePart) setVisitDate(datePart);
          } catch (e) {
            console.warn("Could not parse timestamp:", apiData.timestamp);
          }
        }
      } else {
        setShowLocationPicker(true);
      }
    } catch (err) {
      console.error("EXIF extraction failed:", err);
      setShowLocationPicker(true);
    } finally {
      setAnalyzingFile(false);
    }
  };

  const handleSaveLocationPicker = (selection: LocationSelection) => {
    setExtractedLat(selection.lat);
    setExtractedLng(selection.lng);
    setLocationName(selection.location_name);
    setLocationSource(selection.location_source);
    setShowLocationPicker(false);
    
    if (!title || title.trim() === "" || title === locationName || title === "Unknown Location") {
      setTitle(selection.location_name);
    }
  };

  const handleSkipLocationPicker = () => {
    setExtractedLat(null);
    setExtractedLng(null);
    if (!locationName) setLocationName("Unknown Location");
    setLocationSource("none");
    setShowLocationPicker(false);
  };

  const executeUpload = async () => {
    if (!file || !user) return;

    setLoading(true);
    setSuccess(false);

    try {
      setStep("Uploading photo to cloud storage...");
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      const { error: storageError } = await supabase.storage
        .from("travel-photos")
        .upload(fileName, file);

      if (storageError) throw storageError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("travel-photos").getPublicUrl(fileName);

      setStep("Saving memory to your journal...");

      const fallbackTitle =
        title ||
        (locationName && locationName !== "Unknown Location"
          ? locationName
          : "New Memory");

      const memoryPayload: any = {
        user_id: user.id,
        title: fallbackTitle,
        description: description || "No journal entry added.",
        ai_summary: "",
        lat: extractedLat,
        lng: extractedLng,
        image_url: publicUrl,
        category,
        location_name: locationName || "Unknown Location",
        location_source: locationSource,
        visit_date: visitDate || new Date().toISOString().split("T")[0],
        notes,
        time_spent: timeSpent,
        rating,
        favorite_moment: favoriteMoment,
      };

      if (isCreatingTrip && newTripName.trim()) {
        const newTripPayload = {
          user_id: user.id,
          name: newTripName.trim(),
          start_date: newTripStartDate || null,
          end_date: newTripEndDate || null,
          start_location: newTripStartLocation.trim() || null,
          description: newTripDescription || null,
          cover_image: newTripCoverImage || null,
        };
        const { data: tripData, error: tripError } = await supabase
          .from("trips")
          .insert(newTripPayload)
          .select()
          .single();
        if (tripError) {
          throw tripError;
        } else if (tripData) {
          memoryPayload.trip_id = tripData.id;
        }
      } else if (selectedTripId !== "none") {
        memoryPayload.trip_id = selectedTripId;
      }

      let { error: dbError } = await supabase.from("memories").insert(memoryPayload);

      // If column location_source is not in schema cache yet, retry immediately without it
      if (dbError && (dbError.message?.includes("location_source") || dbError.details?.includes("location_source") || dbError.hint?.includes("location_source") || dbError.code === "PGRST204")) {
        delete memoryPayload.location_source;
        const fallbackInsert = await supabase.from("memories").insert(memoryPayload);
        dbError = fallbackInsert.error;
      }

      if (dbError) throw dbError;

      try {
        const dupForm = new FormData();
        dupForm.append("file", file);
        await fetch("http://localhost:8000/register-duplicate", {
          method: "POST",
          body: dupForm,
        });
      } catch (err) {
        console.error("Could not register duplicate hash:", err);
      }

      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Something went wrong.");
      setLoading(false);
      setStep("");
    }
  };

  const handleUpload = async () => {
    if (!file || !user) return;
    const isFrontendDup = existingMemories?.some((m: any) => 
      m.title === file.name || 
      m.image_url?.includes(file.name)
    ) || false;

    if ((duplicateDetected || isFrontendDup) && !ignoreDuplicateWarning) {
      setShowDuplicateWarning(true);
      return;
    }
    await executeUpload();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm"
            onClick={handleClose}
          />
          <div className="fixed inset-0 z-50 grid place-items-center px-4 py-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="pointer-events-auto relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl sm:p-8"
            >
              <button
                onClick={handleClose}
                disabled={loading || analyzingFile}
                className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mb-8 flex items-center gap-3 pr-8">
                <div className="relative h-10 w-10 flex-none overflow-visible">
                  <Image
                    src="/logo.png"
                    alt="Trails & Tales logo"
                    fill
                    sizes="40px"
                    className="object-contain"
                  />
                </div>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">Add New Memory</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Archive a new place, photo, and story.</p>
                </div>
              </div>

              {success ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-primary">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">Memory Saved!</h3>
                  <p className="text-sm text-muted-foreground mt-2">Your journal has been updated.</p>
                </motion.div>
              ) : (
                <>
                  {modalStep === "trip" ? (
                    <div className="space-y-6 animate-in fade-in zoom-in-95">
                      <div className="space-y-4">
                        {!isCreatingTrip ? (
                          <div className="flex flex-col gap-5">
                            <div>
                              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Select Existing Trip</label>
                              <select
                                value={selectedTripId}
                                onChange={(e) => setSelectedTripId(e.target.value)}
                                className="form-input w-full"
                                disabled={loading}
                              >
                                <option value="none">-- Select a Trip --</option>
                                {existingTrips?.map((trip) => (
                                  <option key={trip.id} value={trip.id}>
                                    {trip.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <div className="h-[1px] flex-1 bg-border" />
                              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">OR</span>
                              <div className="h-[1px] flex-1 bg-border" />
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setIsCreatingTrip(true);
                                setSelectedTripId("none");
                              }}
                              className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/50 bg-primary/5 py-4 text-sm font-bold text-primary hover:bg-primary/10 transition-colors"
                            >
                              + Create New Trip
                            </button>
                          </div>
                        ) : (
                          <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-bold text-foreground">Create New Trip</h4>
                              <button
                                type="button"
                                onClick={() => setIsCreatingTrip(false)}
                                className="text-xs text-muted-foreground hover:text-foreground"
                              >
                                Cancel
                              </button>
                            </div>
                            <div>
                              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                Trip Name *
                              </label>
                              <input
                                type="text"
                                value={newTripName}
                                onChange={(e) => setNewTripName(e.target.value)}
                                placeholder="e.g. Summer in Europe"
                                className="form-input w-full"
                                disabled={loading}
                                required={isCreatingTrip}
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                Description (Optional)
                              </label>
                              <input
                                type="text"
                                value={newTripDescription}
                                onChange={(e) => setNewTripDescription(e.target.value)}
                                placeholder="e.g. A two-week journey across the continent."
                                className="form-input w-full"
                                disabled={loading}
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                Starting Point
                              </label>
                              <input
                                type="text"
                                value={newTripStartLocation}
                                onChange={(e) => setNewTripStartLocation(e.target.value)}
                                placeholder="e.g. Paris, France"
                                className="form-input w-full"
                                disabled={loading}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                  Start Date
                                </label>
                                <input
                                  type="date"
                                  value={newTripStartDate}
                                  onChange={(e) => setNewTripStartDate(e.target.value)}
                                  className="form-input w-full"
                                  disabled={loading}
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                  End Date
                                </label>
                                <input
                                  type="date"
                                  value={newTripEndDate}
                                  onChange={(e) => setNewTripEndDate(e.target.value)}
                                  className="form-input w-full"
                                  disabled={loading}
                                />
                              </div>
                            </div>
                            <div>
                              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                Cover Image URL (Optional)
                              </label>
                              <input
                                type="text"
                                value={newTripCoverImage}
                                onChange={(e) => setNewTripCoverImage(e.target.value)}
                                placeholder="https://..."
                                className="form-input w-full"
                                disabled={loading}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-border">
                        <button
                          onClick={handleClose}
                          className="rounded-xl px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            if (isCreatingTrip && !newTripName.trim()) {
                              alert("Please enter a trip name.");
                              return;
                            }
                            if (!isCreatingTrip && selectedTripId === "none") {
                              alert("Please select a trip or create a new one.");
                              return;
                            }
                            setModalStep("memory");
                          }}
                          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
                        >
                          Continue
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="animate-in fade-in zoom-in-95">
                      <div className="mb-4 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setModalStep("trip")}
                          className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                        >
                          ← Back to Trip Selection
                        </button>
                      </div>

                      <label className="mb-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-secondary p-8 transition-colors hover:bg-background">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                          {analyzingFile ? (
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          ) : (
                            <UploadCloud className="h-6 w-6 text-primary" />
                          )}
                        </div>
                        <span className="text-sm font-semibold text-foreground">
                          {analyzingFile
                            ? "Extracting EXIF GPS coordinates..."
                            : file
                            ? file.name
                            : "Click to upload a travel photo"}
                        </span>
                        <span className="mt-1 text-xs text-muted-foreground">
                          JPG, PNG, HEIC (EXIF coordinates extracted automatically)
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                          className="sr-only"
                          disabled={loading || analyzingFile}
                        />
                      </label>

                      {/* Location Picker or Status Badge */}
                      {file && showLocationPicker && (
                        <div className="mb-6">
                          <LocationPicker
                            initialLat={extractedLat}
                            initialLng={extractedLng}
                            initialLocationName={locationName}
                            onSaveLocation={handleSaveLocationPicker}
                            onSkipLocation={handleSkipLocationPicker}
                          />
                        </div>
                      )}

                      {file && !showLocationPicker && (
                        <div className="mb-6 flex items-center justify-between rounded-xl border border-border bg-secondary/50 p-3 text-xs">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <MapPin className="h-4 w-4 shrink-0 text-primary" />
                            <div className="flex flex-col truncate">
                              <span className="font-bold text-foreground truncate">
                                {locationName || "Unknown Location"}
                              </span>
                              <span className="text-[10px] uppercase text-muted-foreground">
                                Source: {locationSource}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowLocationPicker(true)}
                            className="flex shrink-0 items-center gap-1 rounded-lg border border-border bg-white px-2.5 py-1 font-semibold text-foreground hover:bg-background transition-colors"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            Change Location
                          </button>
                        </div>
                      )}

                      <div className="grid gap-5 sm:grid-cols-2">
                        <Field label="Title">
                          <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Sunset in Kyoto"
                            className="form-input"
                            disabled={loading}
                          />
                        </Field>

                        <Field label="Category">
                          <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="form-input"
                            disabled={loading}
                          >
                            <option>Uncategorized</option>
                            <option>Trek</option>
                            <option>Food</option>
                            <option>Monument</option>
                            <option>Relaxation</option>
                          </select>
                        </Field>

                        <Field label="Visit Date">
                          <input
                            type="date"
                            value={visitDate}
                            onChange={(e) => setVisitDate(e.target.value)}
                            className="form-input"
                            disabled={loading}
                          />
                        </Field>

                        <Field label="Location Name">
                          <input
                            list="locations-list"
                            type="text"
                            value={locationName}
                            onChange={(e) => setLocationName(e.target.value)}
                            placeholder="Type or select a location..."
                            className="form-input"
                            disabled={loading}
                          />
                          <datalist id="locations-list">
                            {existingLocations.map((loc, i) => (
                              <option key={i} value={loc} />
                            ))}
                          </datalist>
                        </Field>
                        
                        <Field label="Time Spent">
                          <input
                            type="text"
                            value={timeSpent}
                            onChange={(e) => setTimeSpent(e.target.value)}
                            placeholder="e.g. 2 hours"
                            className="form-input"
                            disabled={loading}
                          />
                        </Field>

                        <Field label="Rating">
                          <input
                            type="number"
                            min="1"
                            max="5"
                            value={rating}
                            onChange={(e) => setRating(Number(e.target.value))}
                            className="form-input"
                            disabled={loading}
                          />
                        </Field>
                        
                        <Field label="Favorite Moment" wide>
                          <input
                            type="text"
                            value={favoriteMoment}
                            onChange={(e) => setFavoriteMoment(e.target.value)}
                            placeholder="e.g. Finding that hidden waterfall"
                            className="form-input"
                            disabled={loading}
                          />
                        </Field>

                        <Field label="Journal Entry" wide>
                          <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What made this place special?"
                            rows={3}
                            className="form-input resize-none"
                            disabled={loading}
                          />
                        </Field>
                        
                        <Field label="Personal Notes" wide>
                          <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Private notes (not shown in main view)"
                            rows={2}
                            className="form-input resize-none"
                            disabled={loading}
                          />
                        </Field>
                      </div>

                      {showDuplicateWarning && (
                        <div className="mt-6 rounded-2xl border-2 border-amber-500 bg-amber-50 p-5 text-amber-950 shadow-lg animate-in fade-in zoom-in-95">
                          <div className="flex items-start gap-3.5">
                            <div className="rounded-full bg-amber-500 p-2 text-white shrink-0 mt-0.5">
                              <AlertTriangle className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-base font-black uppercase tracking-wide text-amber-900">
                                Duplicate Image Detected
                              </h4>
                              <p className="mt-1 text-sm font-medium text-amber-800">
                                This photo looks similar to one you've already uploaded.
                                {similarityScore > 0 && ` Similarity: ${Math.round(similarityScore * 100)}%`}
                              </p>
                              <div className="mt-4 flex flex-wrap gap-3">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIgnoreDuplicateWarning(true);
                                    setShowDuplicateWarning(false);
                                    executeUpload();
                                  }}
                                  className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow transition-all hover:bg-amber-700 active:scale-95"
                                >
                                  Upload Anyway
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowDuplicateWarning(false);
                                    setLoading(false);
                                  }}
                                  className="rounded-xl border border-amber-300 bg-white px-4 py-2 text-xs font-bold text-amber-900 transition-colors hover:bg-amber-100 active:scale-95"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-border">
                        <button
                          onClick={handleClose}
                          disabled={loading || analyzingFile}
                          className="rounded-xl px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary disabled:opacity-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleUpload}
                          disabled={!file || loading || analyzingFile}
                          className="flex min-w-[140px] items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:opacity-50"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="truncate">{step}</span>
                            </>
                          ) : (
                            "Save Memory"
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

function Field({
  label,
  wide,
  children,
}: {
  label: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("space-y-1.5", wide && "sm:col-span-2")}>
      <span className="block text-sm font-semibold text-foreground">{label}</span>
      <div className="[&>input]:w-full [&>input]:rounded-xl [&>input]:border [&>input]:border-border [&>input]:bg-transparent [&>input]:px-3 [&>input]:py-2.5 [&>input]:text-sm [&>input]:outline-none [&>input]:transition-colors [&>input]:focus:border-primary [&>input]:focus:ring-1 [&>input]:focus:ring-primary [&>select]:w-full [&>select]:rounded-xl [&>select]:border [&>select]:border-border [&>select]:bg-transparent [&>select]:px-3 [&>select]:py-2.5 [&>select]:text-sm [&>select]:outline-none [&>select]:transition-colors [&>select]:focus:border-primary [&>select]:focus:ring-1 [&>select]:focus:ring-primary [&>textarea]:w-full [&>textarea]:rounded-xl [&>textarea]:border [&>textarea]:border-border [&>textarea]:bg-transparent [&>textarea]:px-3 [&>textarea]:py-2.5 [&>textarea]:text-sm [&>textarea]:outline-none [&>textarea]:transition-colors [&>textarea]:focus:border-primary [&>textarea]:focus:ring-1 [&>textarea]:focus:ring-primary">
        {children}
      </div>
    </label>
  );
}
