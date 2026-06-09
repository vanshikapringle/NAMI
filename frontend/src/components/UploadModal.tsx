"use client";

import { useState } from "react";
import { Loader2, UploadCloud, X, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function UploadModal({
  isOpen,
  onClose,
  user,
}: {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Uncategorized");
  const [description, setDescription] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [notes, setNotes] = useState("");
  const [timeSpent, setTimeSpent] = useState("");
  const [rating, setRating] = useState(5);
  const [favoriteMoment, setFavoriteMoment] = useState("");
  const [success, setSuccess] = useState(false);

  const resetForm = () => {
    setFile(null);
    setTitle("");
    setCategory("Uncategorized");
    setDescription("");
    setVisitDate("");
    setNotes("");
    setTimeSpent("");
    setRating(5);
    setFavoriteMoment("");
    setSuccess(false);
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  const handleUpload = async () => {
    if (!file || !user) return;

    setLoading(true);
    setSuccess(false);

    try {
      setStep("Extracting GPS coordinates...");
      const formData = new FormData();
      formData.append("file", file);

      const apiRes = await fetch("http://localhost:8000/upload-photo", {
        method: "POST",
        body: formData,
      });

      if (!apiRes.ok) {
        throw new Error("Photo metadata service is not available.");
      }

      const apiData = await apiRes.json();

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
        (apiData.location_name !== "Unknown Location"
          ? apiData.location_name
          : "New Memory");

      const { error: dbError } = await supabase.from("memories").insert({
        user_id: user.id,
        title: fallbackTitle,
        description: description || "No journal entry added.",
        ai_summary: "",
        lat: apiData.lat,
        lng: apiData.lng,
        image_url: publicUrl,
        category,
        location_name: apiData.location_name || "Unknown Location",
        visit_date: visitDate || new Date().toISOString().split("T")[0],
        notes,
        time_spent: timeSpent,
        rating,
        favorite_moment: favoriteMoment,
      });

      if (dbError) throw dbError;

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
              disabled={loading}
              className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-8 flex items-center gap-4 pr-8">
              <div className="relative h-20 w-20 flex-none overflow-hidden">
                <Image
                  src="/logo.png"
                  alt="Trails & Tales logo"
                  fill
                  sizes="80px"
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
                <label className="mb-8 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-secondary p-8 transition-colors hover:bg-background">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                    <UploadCloud className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {file ? file.name : "Click to upload a travel photo"}
                  </span>
                  <span className="mt-1 text-xs text-muted-foreground">
                    JPG, PNG, HEIC (metadata will be extracted)
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="sr-only"
                    disabled={loading}
                  />
                </label>

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

                  <Field label="Time Spent">
                    <input
                      type="text"
                      value={timeSpent}
                      onChange={(e) => setTimeSpent(e.target.value)}
                      placeholder="e.g. 3 hours"
                      className="form-input"
                      disabled={loading}
                    />
                  </Field>

                  <Field label="Rating (1-5)">
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

                  <Field label="Favorite Moment">
                    <input
                      type="text"
                      value={favoriteMoment}
                      onChange={(e) => setFavoriteMoment(e.target.value)}
                      placeholder="e.g. Seeing the view"
                      className="form-input"
                      disabled={loading}
                    />
                  </Field>

                  <Field label="Journal Entry" wide>
                    <textarea
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Write the story of this memory..."
                      className="form-input resize-none"
                      disabled={loading}
                    />
                  </Field>

                  <Field label="Personal Notes" wide>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any quick practical notes?"
                      className="form-input resize-none"
                      disabled={loading}
                    />
                  </Field>
                </div>

                <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-border">
                  <button
                    onClick={handleClose}
                    disabled={loading}
                    className="rounded-xl px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary disabled:opacity-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={!file || loading}
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
