"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Calendar, Camera } from "lucide-react";
import Image from "next/image";

type Memory = {
  id: string;
  title: string;
  location_name?: string;
  category?: string;
  image_url?: string;
  visit_date: string;
  notes?: string;
};

type Trip = {
  id: string;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  cover_image?: string;
  start_location?: string;
  end_location?: string;
};

export default function JourneyReplay({
  trip,
  memories,
  onClose,
}: {
  trip: Trip;
  memories: Memory[];
  onClose: () => void;
}) {
  const [currentStep, setCurrentStep] = useState(0);

  // Steps:
  // 0: Intro (Trip Cover & Title)
  // 1 to N: Memories
  // N + 1: Outro (Stats)
  
  const totalSteps = memories.length + 2;

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentStep, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 font-mono text-white backdrop-blur-md">
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50">
        <div className="flex gap-1">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div 
              key={i} 
              className={`h-1 w-6 sm:w-10 transition-colors ${i <= currentStep ? "bg-[#F9A4A6]" : "bg-white/20"}`}
            />
          ))}
        </div>
      </div>

      {/* Navigation Areas */}
      <div className="absolute left-0 top-0 bottom-0 w-1/3 z-40 cursor-w-resize" onClick={handlePrev} />
      <div className="absolute right-0 top-0 bottom-0 w-1/3 z-40 cursor-e-resize" onClick={handleNext} />

      <AnimatePresence mode="wait">
        {currentStep === 0 && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center text-center p-8 max-w-2xl relative z-30 pointer-events-none"
          >
            <div className="mb-8 w-48 h-48 sm:w-64 sm:h-64 rounded-full overflow-hidden border-4 border-[#F9A4A6] relative">
              {trip.cover_image ? (
                <Image src={trip.cover_image} alt={trip.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full bg-white/10 flex items-center justify-center">
                  <MapPin className="w-16 h-16 opacity-50" />
                </div>
              )}
            </div>
            <h1 className="text-4xl sm:text-7xl font-black uppercase tracking-widest mb-4 text-[#F9A4A6]">
              {trip.name}
            </h1>
            {trip.description && (
              <p className="text-lg sm:text-xl opacity-80 mb-8">{trip.description}</p>
            )}
            <div className="flex items-center justify-center gap-4 text-sm font-bold uppercase tracking-widest bg-white/10 px-6 py-3 border border-white/20">
              <Calendar className="w-5 h-5 text-[#F9A4A6]" />
              {trip.start_date} {trip.end_date ? `- ${trip.end_date}` : ""}
            </div>
            <p className="mt-12 text-xs uppercase tracking-[0.3em] opacity-50 animate-pulse text-[#F9A4A6]">Tap right to begin replay</p>
          </motion.div>
        )}

        {currentStep > 0 && currentStep <= memories.length && (
          <motion.div
            key={`memory-${currentStep}`}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="w-full h-full flex flex-col items-center justify-center p-4 sm:p-12 relative z-30 pointer-events-none"
          >
            <div className="relative w-full max-w-5xl aspect-video overflow-hidden border-2 border-white/20 shadow-2xl bg-black">
              {memories[currentStep - 1].image_url ? (
                <Image 
                  src={memories[currentStep - 1].image_url!} 
                  alt={memories[currentStep - 1].title} 
                  fill 
                  className="object-contain" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Camera className="w-24 h-24 opacity-20" />
                </div>
              )}
              
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-6 sm:p-10 pt-24">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="flex items-center gap-3 text-[#F9A4A6] mb-3 font-bold uppercase text-xs sm:text-sm tracking-widest">
                      <MapPin className="w-5 h-5" />
                      <span>{memories[currentStep - 1].location_name || "Unknown Location"}</span>
                      <span className="opacity-50">•</span>
                      <span>{memories[currentStep - 1].visit_date}</span>
                    </div>
                    <h2 className="text-3xl sm:text-5xl font-black mb-2">{memories[currentStep - 1].title}</h2>
                    {memories[currentStep - 1].notes && (
                      <p className="text-sm sm:text-base opacity-80 max-w-3xl line-clamp-3">
                        {memories[currentStep - 1].notes}
                      </p>
                    )}
                  </div>
                  {memories[currentStep - 1].category && (
                    <div className="hidden sm:block border border-white/30 bg-black/40 backdrop-blur-sm px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#F9A4A6]">
                      {memories[currentStep - 1].category}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {currentStep === totalSteps - 1 && (
          <motion.div
            key="outro"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center text-center p-8 max-w-2xl relative z-30 pointer-events-auto"
          >
            <h2 className="text-5xl sm:text-7xl font-black uppercase tracking-widest mb-16 text-[#F9A4A6]">
              Journey Complete
            </h2>
            
            <div className="grid grid-cols-2 gap-4 sm:gap-8 w-full mb-16">
              <div className="bg-white/5 p-8 border border-white/10 hover:border-[#F9A4A6]/50 transition-colors">
                <div className="text-5xl font-black mb-3">{memories.length}</div>
                <div className="text-xs uppercase tracking-[0.2em] opacity-70 text-[#F9A4A6]">Memories Captured</div>
              </div>
              <div className="bg-white/5 p-8 border border-white/10 hover:border-[#F9A4A6]/50 transition-colors">
                <div className="text-5xl font-black mb-3">
                  {new Set(memories.map(m => m.location_name)).size}
                </div>
                <div className="text-xs uppercase tracking-[0.2em] opacity-70 text-[#F9A4A6]">Unique Locations</div>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="px-8 py-4 border-2 border-[#F9A4A6] text-[#F9A4A6] hover:bg-[#F9A4A6] hover:text-[#291217] transition-colors font-bold uppercase tracking-widest"
            >
              Back to Archive
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
