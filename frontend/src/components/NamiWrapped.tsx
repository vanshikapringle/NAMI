"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, MapPin, Map, Plane, Compass } from "lucide-react";
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

export default function NamiWrapped({
  memories,
  analytics,
  onClose,
}: {
  memories: Memory[];
  analytics: any; // Using the analytics object generated in AnalyticsView
  onClose: () => void;
}) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const totalSlides = 6;

  const handleNext = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentSlide, onClose]);

  // Slides configuration
  // 0: Intro (NAMI Wrapped Title)
  // 1: The Numbers (Total Memories, Trips, Cities)
  // 2: The Places (Most visited place)
  // 3: The Patterns (Top Category, Longest Trip)
  // 4: The Discoveries (Insights)
  // 5: Summary Poster

  const slideVariants = {
    initial: { opacity: 0, scale: 0.9, y: 50 },
    animate: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 20 } },
    exit: { opacity: 0, scale: 1.1, y: -50, transition: { duration: 0.3 } }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#291217] font-mono text-[#E2D9F3] overflow-hidden">
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Progress Bar */}
      <div className="absolute top-6 left-6 right-16 z-50 flex gap-2">
        {Array.from({ length: totalSlides }).map((_, i) => (
          <div key={i} className="flex-1 h-1.5 bg-white/20 overflow-hidden rounded-full">
            <motion.div 
              className="h-full bg-[#F9A4A6]"
              initial={{ width: "0%" }}
              animate={{ width: i < currentSlide ? "100%" : i === currentSlide ? "100%" : "0%" }}
              transition={{ duration: i === currentSlide ? 4 : 0.1, ease: "linear" }}
              onAnimationComplete={() => {
                if (i === currentSlide && i < totalSlides - 1) {
                  // Optional: auto-advance
                  // handleNext();
                }
              }}
            />
          </div>
        ))}
      </div>

      {/* Navigation Click Areas */}
      <div className="absolute left-0 top-0 bottom-0 w-1/3 z-40 cursor-w-resize" onClick={handlePrev} />
      <div className="absolute right-0 top-0 bottom-0 w-2/3 z-40 cursor-e-resize" onClick={handleNext} />

      <AnimatePresence mode="wait">
        {currentSlide === 0 && (
          <motion.div
            key="slide-0"
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex flex-col items-center justify-center text-center p-8 max-w-4xl relative z-30 pointer-events-none"
          >
            <Compass className="w-24 h-24 sm:w-32 sm:h-32 mb-8 text-[#F9A4A6] animate-pulse" />
            <h1 className="text-5xl sm:text-8xl font-black uppercase tracking-[0.2em] mb-6 text-[#F9A4A6]">
              NAMI WRAPPED
            </h1>
            <p className="text-xl sm:text-3xl font-medium opacity-90 tracking-widest uppercase border-y-2 border-[#F9A4A6]/30 py-4 px-8">
              A Look Back at Your Journeys
            </p>
            <p className="mt-16 text-sm uppercase tracking-[0.3em] opacity-50 animate-bounce">
              Tap right to reveal
            </p>
          </motion.div>
        )}

        {currentSlide === 1 && (
          <motion.div
            key="slide-1"
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex flex-col items-center justify-center text-center p-8 max-w-5xl relative z-30 pointer-events-none w-full"
          >
            <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-widest mb-16 text-white">
              The Numbers
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 w-full">
              <div className="bg-[#E2D9F3]/10 p-6 sm:p-10 border border-[#F9A4A6]/30 flex flex-col items-center">
                <span className="text-5xl sm:text-7xl font-black text-[#F9A4A6] mb-2">{analytics.totalMemories}</span>
                <span className="text-xs sm:text-sm uppercase tracking-widest opacity-80">Memories</span>
              </div>
              <div className="bg-[#E2D9F3]/10 p-6 sm:p-10 border border-[#F9A4A6]/30 flex flex-col items-center">
                <span className="text-5xl sm:text-7xl font-black text-[#FBCAD1] mb-2">{analytics.totalTrips}</span>
                <span className="text-xs sm:text-sm uppercase tracking-widest opacity-80">Trips</span>
              </div>
              <div className="bg-[#E2D9F3]/10 p-6 sm:p-10 border border-[#F9A4A6]/30 flex flex-col items-center">
                <span className="text-5xl sm:text-7xl font-black text-[#F9A4A6] mb-2">{analytics.citiesCount}</span>
                <span className="text-xs sm:text-sm uppercase tracking-widest opacity-80">Cities</span>
              </div>
              <div className="bg-[#E2D9F3]/10 p-6 sm:p-10 border border-[#F9A4A6]/30 flex flex-col items-center">
                <span className="text-5xl sm:text-7xl font-black text-[#FBCAD1] mb-2">{analytics.countriesCount}</span>
                <span className="text-xs sm:text-sm uppercase tracking-widest opacity-80">Countries</span>
              </div>
            </div>
          </motion.div>
        )}

        {currentSlide === 2 && (
          <motion.div
            key="slide-2"
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex flex-col items-center justify-center text-center p-8 max-w-4xl relative z-30 pointer-events-none"
          >
            <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-widest mb-12 text-white">
              Your Top Destination
            </h2>
            <MapPin className="w-24 h-24 sm:w-32 sm:h-32 mb-8 text-[#FBCAD1]" />
            <h1 className="text-5xl sm:text-8xl font-black text-[#F9A4A6] mb-8 uppercase px-4 leading-tight">
              {analytics.mostVisitedPlace}
            </h1>
            <p className="text-xl sm:text-2xl font-medium opacity-90 tracking-widest uppercase">
              You kept going back for more.
            </p>
          </motion.div>
        )}

        {currentSlide === 3 && (
          <motion.div
            key="slide-3"
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex flex-col items-center justify-center text-center p-8 max-w-4xl relative z-30 pointer-events-none w-full"
          >
            <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-widest mb-16 text-white">
              Travel Patterns
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
              <div className="bg-[#F9A4A6] text-[#291217] p-10 border-4 border-[#291217] shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)]">
                <div className="text-sm font-bold uppercase tracking-widest mb-4 opacity-70">Longest Trip</div>
                <div className="text-6xl font-black mb-2">{analytics.maxTripDuration}</div>
                <div className="text-xl font-bold uppercase tracking-widest">Days</div>
              </div>
              <div className="bg-[#FBCAD1] text-[#291217] p-10 border-4 border-[#291217] shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)]">
                <div className="text-sm font-bold uppercase tracking-widest mb-4 opacity-70">Favorite Month</div>
                <div className="text-4xl sm:text-5xl font-black mb-2 uppercase break-words">{analytics.mostActiveMonth}</div>
              </div>
            </div>
          </motion.div>
        )}

        {currentSlide === 4 && (
          <motion.div
            key="slide-4"
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex flex-col items-center justify-center text-left p-8 max-w-4xl relative z-30 pointer-events-none w-full"
          >
            <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-widest mb-12 text-[#F9A4A6] w-full text-center">
              The Discoveries
            </h2>
            <div className="space-y-6 w-full">
              {analytics.insights.length > 0 ? (
                analytics.insights.map((insight: string, idx: number) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.4 + 0.2 }}
                    key={idx} 
                    className="flex gap-4 items-center text-xl sm:text-3xl font-bold bg-white/5 p-6 border-l-4 border-[#F9A4A6]"
                  >
                    <span>{insight}</span>
                  </motion.div>
                ))
              ) : (
                <div className="text-center text-2xl font-bold opacity-60">
                  Keep exploring to unlock AI insights next year!
                </div>
              )}
            </div>
          </motion.div>
        )}

        {currentSlide === 5 && (
          <motion.div
            key="slide-5"
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex flex-col items-center justify-center text-center p-4 sm:p-8 w-full max-w-md relative z-30 pointer-events-auto"
          >
            {/* Shareable Card */}
            <div className="bg-[#E2D9F3] text-[#291217] p-8 border-4 border-[#F9A4A6] shadow-[12px_12px_0px_0px_rgba(249,164,166,1)] w-full relative">
              <div className="absolute top-4 right-4 bg-[#291217] text-white px-2 py-1 text-xs font-bold uppercase tracking-widest">
                NAMI 2026
              </div>
              <h1 className="text-3xl font-black uppercase tracking-widest mb-6 border-b-2 border-[#291217]/20 pb-4 text-left">
                My Travel<br/>Wrapped
              </h1>
              
              <div className="space-y-4 text-left font-bold text-sm">
                <div className="flex justify-between border-b border-[#291217]/10 pb-2">
                  <span>Memories</span>
                  <span className="text-[#F9A4A6] bg-[#291217] px-2">{analytics.totalMemories}</span>
                </div>
                <div className="flex justify-between border-b border-[#291217]/10 pb-2">
                  <span>Trips</span>
                  <span className="text-[#F9A4A6] bg-[#291217] px-2">{analytics.totalTrips}</span>
                </div>
                <div className="flex justify-between border-b border-[#291217]/10 pb-2">
                  <span>Top Place</span>
                  <span className="truncate max-w-[120px]">{analytics.mostVisitedPlace}</span>
                </div>
                <div className="flex justify-between pb-2">
                  <span>New Cities</span>
                  <span>{analytics.citiesCount}</span>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t-2 border-[#291217]/20">
                <button 
                  onClick={onClose}
                  className="w-full py-4 bg-[#291217] text-[#F9A4A6] hover:bg-[#F9A4A6] hover:text-[#291217] transition-colors border-2 border-[#291217] uppercase tracking-widest font-black"
                >
                  Close Wrapped
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
