"use client";

import React, { useMemo, useState, useEffect } from "react";
import { BarChart3 } from "lucide-react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import NamiWrapped from "./NamiWrapped";

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
  notes?: string;
  time_spent?: string;
  favorite_moment?: string;
  rating?: number;
  trip_id?: string;
  created_at?: string;
};

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center font-mono border-2 border-[#291217] bg-[#E2D9F3] p-8 text-[#291217] shadow-[4px_4px_0px_0px_rgba(41,18,23,1)]">
      <div className="mb-6 flex h-20 w-20 items-center justify-center border-2 border-[#291217] bg-[#FBCAD1]">
        {icon}
      </div>
      <h3 className="mb-2 text-2xl font-black uppercase tracking-widest">
        {title}
      </h3>
      <p className="max-w-sm text-sm font-medium opacity-80">
        {description}
      </p>
    </div>
  );
}

function ChartWrapper({
  title,
  subtitle,
  heightClass = "h-[380px]",
  children,
}: {
  title: string;
  subtitle?: string;
  heightClass?: string;
  children: React.ReactNode;
}) {
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setReady(true), 150);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="border-2 border-[#291217] bg-[#E2D9F3] p-5 sm:p-6 shadow-[4px_4px_0px_0px_rgba(41,18,23,1)] flex flex-col justify-between min-w-0 w-full">
      <div className="flex items-center justify-between border-b border-[#291217]/30 pb-3 mb-4">
        <h3 className="text-base sm:text-xl font-black uppercase tracking-[0.2em]">
          {title}
        </h3>
        {subtitle && (
          <span className="border border-[#291217] px-2 py-0.5 text-[10px] font-bold uppercase bg-[#FBCAD1]">
            {subtitle}
          </span>
        )}
      </div>
      <div className={`${heightClass} w-full min-w-0 flex items-center justify-center relative`}>
        {ready ? children : <div className="text-xs font-mono text-[#5C4A60] animate-pulse">Loading visualizer...</div>}
      </div>
    </div>
  );
}

export default function AnalyticsView({ memories }: { memories: Memory[] }) {
  const [showWrapped, setShowWrapped] = useState(false);

  useEffect(() => {
    const handleOpen = () => setShowWrapped(true);
    window.addEventListener('open-nami-wrapped', handleOpen);
    return () => window.removeEventListener('open-nami-wrapped', handleOpen);
  }, []);
  const analytics = useMemo(() => {
    const sorted = [...memories].sort(
      (a, b) =>
        new Date(a.visit_date).getTime() - new Date(b.visit_date).getTime()
    );

    // Basic count
    const totalMemories = sorted.length;

    // Build Trips Map
    const tripsMap = new Map<string, Memory[]>();
    sorted.forEach((m) => {
      // Use trip_id if present, otherwise group standalone memories as their own "trip" 
      const tId = m.trip_id || `standalone_${m.id}`;
      const arr = tripsMap.get(tId) || [];
      arr.push(m);
      tripsMap.set(tId, arr);
    });

    const totalTrips = tripsMap.size;

    // Calculate Trip Durations
    let maxTripDuration = 0;
    let sumTripDuration = 0;

    tripsMap.forEach((tripMemories) => {
      const dates = tripMemories.map(m => new Date(m.visit_date).getTime()).filter(t => !isNaN(t));
      if (dates.length > 0) {
        const minT = Math.min(...dates);
        const maxT = Math.max(...dates);
        const durationDays = Math.ceil((maxT - minT) / (1000 * 60 * 60 * 24)) + 1; // +1 to count inclusive days
        if (durationDays > maxTripDuration) maxTripDuration = durationDays;
        sumTripDuration += durationDays;
      }
    });

    const avgTripDuration = totalTrips > 0 ? (sumTripDuration / totalTrips).toFixed(1) : "0";

    // Places / Cities / Countries Extraction
    const locationTripsMap = new Map<string, Set<string>>(); // location -> set of trip_ids
    const countries = new Set<string>();
    const cities = new Set<string>();
    const locationCounts: Record<string, number> = {};

    sorted.forEach((m) => {
      const loc = m.location_name;
      if (!loc || loc === "Unknown Location") return;

      locationCounts[loc] = (locationCounts[loc] || 0) + 1;

      // Extract City and Country (rudimentary string split)
      const parts = loc.split(",").map(p => p.trim()).filter(p => !/^\d+$/.test(p));
      if (parts.length > 0) {
        countries.add(parts[parts.length - 1]);
        cities.add(parts.length > 1 ? parts[parts.length - 2] : parts[0]);
      }

      // Track trips per location for repeat destinations
      const tId = m.trip_id || `standalone_${m.id}`;
      const tripSet = locationTripsMap.get(loc) || new Set();
      tripSet.add(tId);
      locationTripsMap.set(loc, tripSet);
    });

    const mostVisitedPlace = Object.entries(locationCounts).length
      ? Object.entries(locationCounts).reduce((max, current) => current[1] > max[1] ? current : max)[0]
      : "N/A";

    const repeatDestinations = Array.from(locationTripsMap.values()).filter(set => set.size > 1).length;

    // Category / Month data
    const categoryCounts = sorted.reduce<Record<string, number>>((acc, mem) => {
      const category = mem.category || "Uncategorized";
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});
    const categoryData = Object.entries(categoryCounts).map(([name, value]) => ({ name, value }));

    const monthlyCounts = sorted.reduce<Record<string, number>>((acc, mem) => {
      const month = new Date(mem.visit_date).toLocaleString("default", { month: "long" });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});
    
    const mostActiveMonth = Object.entries(monthlyCounts).length
      ? Object.entries(monthlyCounts).reduce((max, current) => current[1] > max[1] ? current : max)[0]
      : "N/A";

    const now = new Date();
    const daysGrid = Array.from({ length: 140 }).map((_, i) => {
      const d = new Date(now.getTime() - (139 - i) * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split("T")[0];
      const count = sorted.filter((m) => m.visit_date.startsWith(dateStr)).length;
      return { dateStr, count };
    });

    // --- Dynamic Insights Heuristics ---
    const insights: string[] = [];
    
    // 1. Season travel
    const seasonCounts: Record<string, number> = { "Winter": 0, "Spring": 0, "Summer": 0, "Autumn": 0 };
    sorted.forEach((m) => {
      const month = new Date(m.visit_date).getMonth();
      if (month === 11 || month <= 1) seasonCounts["Winter"]++;
      else if (month >= 2 && month <= 4) seasonCounts["Spring"]++;
      else if (month >= 5 && month <= 7) seasonCounts["Summer"]++;
      else if (month >= 8 && month <= 10) seasonCounts["Autumn"]++;
    });
    const topSeason = Object.entries(seasonCounts).reduce((a, b) => a[1] > b[1] ? a : b);
    if (topSeason[1] > 0) {
      insights.push(`You travel most during ${topSeason[0]}.`);
    }

    // 2. Top Category
    const topCategory = Object.entries(categoryCounts).length
      ? Object.entries(categoryCounts).reduce((a, b) => a[1] > b[1] ? a : b)
      : null;
    if (topCategory && topCategory[1] > 0) {
      insights.push(`${topCategory[0]} is your most visited destination type.`);
    }

    // 3. Revisit Stats
    const topRevisit = Array.from(locationTripsMap.entries()).reduce((a, b) => a[1].size > b[1].size ? a : b, ["", new Set()]);
    if (topRevisit[1].size > 1) {
      insights.push(`You revisited ${topRevisit[0]} ${topRevisit[1].size} times.`);
    }

    // 4. Avg Trip Days
    if (totalTrips > 0 && parseFloat(avgTripDuration) > 0) {
      insights.push(`Your average trip lasts ${avgTripDuration} days.`);
    }

    // 5. New cities comparison (this year vs last year)
    const currentYear = now.getFullYear();
    const citiesThisYear = new Set<string>();
    const citiesLastYear = new Set<string>();
    sorted.forEach(m => {
      const y = new Date(m.visit_date).getFullYear();
      if (y === currentYear) {
        const parts = m.location_name?.split(",").map(p => p.trim()) || [];
        if (parts.length > 1) citiesThisYear.add(parts[parts.length - 2]);
      } else if (y === currentYear - 1) {
        const parts = m.location_name?.split(",").map(p => p.trim()) || [];
        if (parts.length > 1) citiesLastYear.add(parts[parts.length - 2]);
      }
    });
    if (citiesThisYear.size > citiesLastYear.size) {
      insights.push(`This year you explored more new cities (${citiesThisYear.size}) than last year (${citiesLastYear.size}).`);
    } else if (citiesLastYear.size > 0) {
      insights.push(`Last year you explored ${citiesLastYear.size} cities, compared to ${citiesThisYear.size} this year.`);
    }

    return {
      totalMemories,
      totalTrips,
      countriesCount: countries.size,
      citiesCount: cities.size,
      mostVisitedPlace,
      maxTripDuration,
      avgTripDuration,
      mostActiveMonth,
      repeatDestinations,
      categoryData,
      daysGrid,
      insights,
    };
  }, [memories]);

  if (!memories.length) {
    return (
      <EmptyState
        icon={<BarChart3 className="h-8 w-8 text-[#291217]" />}
        title="No diagnostics yet"
        description="Upload memory sectors to unlock NAMI diagnostics."
      />
    );
  }

  // Official NAMI pastel & deep mahogany color palette
  const namiColors = ["#F9A4A6", "#7776A6", "#5C4A60", "#FBCAD1", "#291217"];

  return (
    <div className="grid gap-6 font-mono text-[#291217] select-none">
      {/* TIMELINE DIAGNOSTICS */}
      <div className="border-2 border-[#291217] bg-[#E2D9F3] p-5 sm:p-6 shadow-[4px_4px_0px_0px_rgba(41,18,23,1)]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#291217]/30 pb-3 mb-4">
          <h3 className="text-base sm:text-xl font-black uppercase tracking-[0.2em]">
            TIMELINE DIAGNOSTICS
          </h3>
          <span className="text-[10px] sm:text-xs font-bold uppercase opacity-75">
            TIMEFRAME: 140 CYCLES
          </span>
        </div>

        {/* Heatmap Grid */}
        <div className="flex flex-wrap gap-1.5 py-2 justify-center sm:justify-start overflow-x-auto">
          {analytics.daysGrid.map((day, idx) => {
            let bgClass = "bg-white/60 border border-[#291217]/20";
            if (day.count === 1) bgClass = "bg-[#FBCAD1] border border-[#291217]/60";
            if (day.count === 2) bgClass = "bg-[#F9A4A6] border border-[#291217]";
            if (day.count >= 3) bgClass = "bg-[#291217] border border-[#291217]";
            return (
              <div
                key={idx}
                title={`${day.dateStr}: ${day.count} memories`}
                className={`h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform hover:scale-125 cursor-pointer ${bgClass}`}
              />
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-end gap-2 text-[10px] font-bold uppercase">
          <span>Less</span>
          <div className="h-3 w-3 bg-white/60 border border-[#291217]/20" />
          <div className="h-3 w-3 bg-[#FBCAD1] border border-[#291217]/60" />
          <div className="h-3 w-3 bg-[#F9A4A6] border border-[#291217]" />
          <div className="h-3 w-3 bg-[#291217] border border-[#291217]" />
          <span>More</span>
        </div>
      </div>

      {/* TWO COLUMN SECTION: MEMORY ACTIVITY & CATEGORY MIX (PIE CHART) */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* MEMORY ACTIVITY (STATS LIST) */}
        <div className="border-2 border-[#291217] bg-[#E2D9F3] p-5 sm:p-6 shadow-[4px_4px_0px_0px_rgba(41,18,23,1)] flex flex-col justify-between">
          <h3 className="text-base sm:text-xl font-black uppercase tracking-[0.2em] border-b border-[#291217]/30 pb-3 mb-4">
            MEMORY ACTIVITY
          </h3>

          <div className="flex flex-col gap-4 py-2 flex-1 justify-around text-xs sm:text-sm font-bold">
            <div className="flex items-center justify-between gap-2">
              <span>TOTAL TRIPS</span>
              <span className="flex-1 border-b-2 border-dotted border-[#291217]/40 mx-2" />
              <span className="text-base sm:text-lg font-black">{analytics.totalTrips}</span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span>COUNTRIES VISITED</span>
              <span className="flex-1 border-b-2 border-dotted border-[#291217]/40 mx-2" />
              <span className="text-base sm:text-lg font-black">{analytics.countriesCount}</span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span>CITIES VISITED</span>
              <span className="flex-1 border-b-2 border-dotted border-[#291217]/40 mx-2" />
              <span className="text-base sm:text-lg font-black">{analytics.citiesCount}</span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span>TOTAL MEMORIES</span>
              <span className="flex-1 border-b-2 border-dotted border-[#291217]/40 mx-2" />
              <span className="text-base sm:text-lg font-black">{analytics.totalMemories}</span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span>MOST VISITED PLACE</span>
              <span className="flex-1 border-b-2 border-dotted border-[#291217]/40 mx-2" />
              <span className="text-xs sm:text-sm font-black truncate max-w-[130px]" title={analytics.mostVisitedPlace}>
                {analytics.mostVisitedPlace}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span>LONGEST TRIP</span>
              <span className="flex-1 border-b-2 border-dotted border-[#291217]/40 mx-2" />
              <span className="text-base sm:text-lg font-black">{analytics.maxTripDuration} <span className="text-xs">DAYS</span></span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span>AVG TRIP DURATION</span>
              <span className="flex-1 border-b-2 border-dotted border-[#291217]/40 mx-2" />
              <span className="text-base sm:text-lg font-black">{analytics.avgTripDuration} <span className="text-xs">DAYS</span></span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span>FAVORITE MONTH</span>
              <span className="flex-1 border-b-2 border-dotted border-[#291217]/40 mx-2" />
              <span className="text-base sm:text-lg font-black uppercase">{analytics.mostActiveMonth}</span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span>REPEAT DESTINATIONS</span>
              <span className="flex-1 border-b-2 border-dotted border-[#291217]/40 mx-2" />
              <span className="text-base sm:text-lg font-black">{analytics.repeatDestinations}</span>
            </div>
          </div>
        </div>

        {/* CATEGORY MIX (USER'S PREVIOUS PIE CHART - HUGE SIZE) */}
        <ChartWrapper title="CATEGORY MIX" subtitle="SECTOR: BY TAG" heightClass="h-[380px]">
          <ResponsiveContainer width="100%" height={380} debounce={50}>
            <PieChart>
              <Pie
                data={analytics.categoryData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius="75%"
                innerRadius="45%"
                stroke="#291217"
                strokeWidth={2}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              >
                {analytics.categoryData.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={namiColors[index % namiColors.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: "0px",
                  border: "2px solid #291217",
                  backgroundColor: "#E2D9F3",
                  color: "#291217",
                  fontFamily: "monospace",
                  fontWeight: "bold",
                  boxShadow: "4px 4px 0px 0px rgba(41,18,23,1)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </div>

      {/* DYNAMIC TEXT INSIGHTS & NAMI WRAPPED */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 border-2 border-[#291217] bg-[#E2D9F3] p-5 sm:p-6 shadow-[4px_4px_0px_0px_rgba(41,18,23,1)]">
          <div className="flex items-center justify-between border-b border-[#291217]/30 pb-3 mb-4">
            <h3 className="text-base sm:text-xl font-black uppercase tracking-[0.2em]">
              TRAVEL INSIGHTS
            </h3>
            <span className="border border-[#291217] px-2 py-0.5 text-[10px] font-bold uppercase bg-[#F9A4A6]">
              AI ASSISTED
            </span>
          </div>
          <div className="space-y-3">
            {analytics.insights.length > 0 ? (
              analytics.insights.map((insight, idx) => (
                <div key={idx} className="flex gap-3 items-start text-sm sm:text-base font-bold bg-white/50 p-3 border border-[#291217]/20">
                  <span className="text-[#F9A4A6] text-lg leading-none mt-0.5">✺</span>
                  <span>{insight}</span>
                </div>
              ))
            ) : (
              <div className="text-sm font-bold opacity-60">Not enough data to generate insights yet. Keep exploring!</div>
            )}
          </div>
        </div>

        <div className="border-2 border-[#291217] bg-[#291217] text-[#E2D9F3] p-5 sm:p-6 shadow-[4px_4px_0px_0px_rgba(251,202,209,1)] flex flex-col items-center justify-center text-center">
          <div className="mb-4 text-4xl">✨</div>
          <h3 className="text-xl font-black uppercase tracking-widest mb-2 text-[#F9A4A6]">
            NAMI WRAPPED
          </h3>
          <p className="text-xs font-medium opacity-80 mb-6 px-4">
            Relive your year in travel. Generate a personalized story of your journeys.
          </p>
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('open-nami-wrapped'))}
            className="w-full py-3 border-2 border-[#F9A4A6] bg-transparent text-[#F9A4A6] font-bold uppercase tracking-widest hover:bg-[#F9A4A6] hover:text-[#291217] transition-colors"
          >
            Generate Now
          </button>
        </div>
      </div>

      {showWrapped && (
        <NamiWrapped 
          memories={memories} 
          analytics={analytics} 
          onClose={() => setShowWrapped(false)} 
        />
      )}
    </div>
  );
}
