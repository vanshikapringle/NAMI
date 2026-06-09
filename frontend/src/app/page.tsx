"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  BarChart3,
  Book,
  Camera,
  ArrowRight,
  Clock,
  Edit3,
  Filter,
  Home as HomeIcon,
  Loader2,
  LogOut,
  Map as MapIcon,
  Maximize2,
  Save,
  Star,
  Upload,
  User,
  X,
  MapPin,
  Calendar,
  Github,
  Linkedin,
  Mail,
  Phone,
  Quote,
  Sparkles,
  ShieldCheck,
  Images,
  Route,
} from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import UploadModal from "@/components/UploadModal";
import { supabase } from "@/lib/supabaseClient";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function LogoMark({
  className,
  imageClassName,
}: {
  className?: string;
  imageClassName?: string;
}) {
  return (
    <span className={cn("relative block overflow-hidden", className)}>
      <Image
        src="/logo.png"
        alt="Trails & Tales logo"
        fill
        sizes="96px"
        className={cn("object-contain", imageClassName)}
        priority
      />
    </span>
  );
}

const ACTIVE_TAB_KEY = "nami-active-tab";
const MEMORY_CACHE_PREFIX = "nami-memories";
const MIN_SPLASH_MS = 2800;

const MapViewComponent = dynamic(() => import("@/components/DynamicMap"), {
  ssr: false,
});

type Memory = {
  id: string;
  title: string;
  description?: string;
  visit_date: string;
  location_name?: string;
  category?: string;
  image_url?: string;
  notes?: string;
  time_spent?: string;
  favorite_moment?: string;
  rating?: number;
  lat?: number;
  lng?: number;
};

const tabs = [
  { id: "journal", label: "Journal", icon: Book },
  { id: "map", label: "Journey Map", icon: MapIcon },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "profile", label: "Profile", icon: User },
];

const footerQuotes = [
  "Collect small moments. They become the map.",
  "A quiet trail still changes the traveler.",
  "The best archives leave room for wonder.",
  "Memory is a compass with softer edges.",
  "Go gently, notice deeply, return changed.",
];

const dashboardQuotes = {
  morning: [
    "Plan lightly, notice generously, and let the day open.",
    "Your morning archive is ready for whatever today adds.",
  ],
  afternoon: [
    "A good afternoon memory usually begins with one small detail.",
    "Keep the map open. The day still has room for a story.",
  ],
  sunset: [
    "Golden hour belongs in the journal before it fades.",
    "Save the soft edges of the day while they are still warm.",
  ],
  night: [
    "Close the day gently. The trail will wait for you.",
    "Night is for sorting the beautiful parts into memory.",
  ],
};

const landingQuotes = [
  "Turn scattered travel moments into a map you can return to.",
  "A retro memory desk for photos, places, notes, and quiet discoveries.",
  "Every trail deserves more than a camera roll.",
  "Build a personal atlas from the places that changed you.",
  "Archive the journey before the little details blur.",
];

function getDisplayName(session: any) {
  const rawName =
    session?.user?.user_metadata?.full_name ||
    session?.user?.user_metadata?.name ||
    session?.user?.email?.split("@")[0] ||
    "Vanshika";

  const compactName = rawName.replace(/[._-]/g, " ").trim();
  if (compactName.toLowerCase().includes("vanshika")) return "Vanshika";

  const firstName = compactName.split(" ")[0] || "Vanshika";
  return firstName.charAt(0).toUpperCase() + firstName.slice(1);
}

function getTimePeriod() {
  const hour = new Date().getHours();

  if (hour < 5) return "night";
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  if (hour < 20) return "sunset";
  return "night";
}

function getTimeGreeting(name: string) {
  const period = getTimePeriod();

  if (period === "morning") return `Good morning, ${name}`;
  if (period === "afternoon") return `Good afternoon, ${name}`;
  if (period === "sunset") return `Enjoy the sunset, ${name}`;
  return new Date().getHours() < 5
    ? `Have a peaceful night, ${name}`
    : `Hope you had a great day, ${name}`;
}

function getDailyQuote() {
  const day = new Date().getDate();
  return footerQuotes[day % footerQuotes.length];
}

function getDashboardQuote() {
  const period = getTimePeriod();
  const quotes = dashboardQuotes[period];
  const hour = new Date().getHours();
  return quotes[hour % quotes.length];
}

function getLandingQuote() {
  const now = new Date();
  const index = (now.getDate() + now.getHours()) % landingQuotes.length;
  return landingQuotes[index];
}

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [splashReady, setSplashReady] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [activeTab, setActiveTab] = useState("journal");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [timeTick, setTimeTick] = useState(() => Date.now());
  const displayName = getDisplayName(session);
  const dashboardGreeting = useMemo(
    () => getTimeGreeting(displayName),
    [displayName, timeTick]
  );
  const dailyQuote = useMemo(() => getDashboardQuote(), [timeTick]);

  const cacheKey = session?.user?.id
    ? `${MEMORY_CACHE_PREFIX}-${session.user.id}`
    : "";

  const updateActiveTab = (tab: string) => {
    setActiveTab(tab);
    localStorage.setItem(ACTIVE_TAB_KEY, tab);
  };

  const fetchMemories = useCallback(async () => {
    if (!session?.user?.id) return;

    const { data, error } = await supabase
      .from("memories")
      .select("*")
      .eq("user_id", session.user.id)
      .order("visit_date", { ascending: true });

    if (data && !error) {
      setMemories(data);
      localStorage.setItem(cacheKey, JSON.stringify(data));
    }
  }, [cacheKey, session?.user?.id]);

  const handleMemoryUpdated = useCallback(
    (updatedMemory: Memory) => {
      setMemories((currentMemories) => {
        const nextMemories = currentMemories.map((memory) =>
          memory.id === updatedMemory.id ? updatedMemory : memory
        );
        if (cacheKey) {
          localStorage.setItem(cacheKey, JSON.stringify(nextMemories));
        }
        return nextMemories;
      });
    },
    [cacheKey]
  );

  useEffect(() => {
    const splashTimer = window.setTimeout(() => setSplashReady(true), MIN_SPLASH_MS);
    const storedTab = localStorage.getItem(ACTIVE_TAB_KEY);
    if (storedTab && tabs.some((tab) => tab.id === storedTab)) {
      setActiveTab(storedTab);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setCheckingSession(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setCheckingSession(false);
    });

    return () => {
      window.clearTimeout(splashTimer);
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setTimeTick(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!cacheKey) return;

    const cachedMemories = localStorage.getItem(cacheKey);
    if (cachedMemories) {
      setMemories(JSON.parse(cachedMemories));
    }

    fetchMemories();
  }, [cacheKey, fetchMemories]);

  if (checkingSession || !splashReady) {
    return <SplashScreen />;
  }

  if (!showDashboard && !showAuth) {
    return (
      <LandingPage
        isSignedIn={Boolean(session)}
        onEnter={() => {
          if (session) {
            setShowDashboard(true);
          } else {
            setShowAuth(true);
          }
        }}
        onSignIn={() => setShowAuth(true)}
      />
    );
  }

  if (!session) {
    return <AuthUI onBack={() => setShowAuth(false)} />;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-72 flex-col border-r border-border bg-white px-6 py-8 lg:flex">
        <div className="mb-10 flex items-center gap-3">
          <LogoMark className="h-16 w-16" />
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Trails & Tales</h1>
            <p className="text-xs font-medium text-muted-foreground">Memory archive</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-2">
          <button
            onClick={() => {
              setShowDashboard(false);
              setShowAuth(false);
            }}
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-secondary hover:text-foreground"
          >
            <HomeIcon className="h-5 w-5" />
            Home
          </button>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => updateActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <tab.icon className="h-5 w-5" />
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto border-t border-border pt-6">
          <button
            onClick={() => supabase.auth.signOut()}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile nav placeholder */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-border bg-white/80 p-4 backdrop-blur-lg lg:hidden">
        <button
          onClick={() => {
            setShowDashboard(false);
            setShowAuth(false);
          }}
          className="flex flex-col items-center gap-1 rounded-lg p-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <HomeIcon className="h-6 w-6" />
          <span>Home</span>
        </button>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => updateActiveTab(tab.id)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-lg p-2 text-xs font-medium transition-colors",
              activeTab === tab.id
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="h-6 w-6" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <main className="flex-1 pb-24 lg:pb-0">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-white/80 px-6 py-4 backdrop-blur-md lg:px-10">
          <div className="flex min-w-0 items-center gap-4">
            <LogoMark className="hidden h-16 w-16 flex-none sm:block lg:hidden" />
            <div className="min-w-0">
              <p className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5" />
                {activeTab === "map" ? "Journey Map" : activeTab}
              </p>
              <h2 className="truncate text-2xl font-bold tracking-tight text-foreground">
                {dashboardGreeting}
              </h2>
              <p className="mt-1 max-w-xl truncate text-sm text-muted-foreground">
                {dailyQuote}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowDashboard(false);
                setShowAuth(false);
              }}
              className="hidden items-center gap-2 rounded-full border border-border bg-white px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-secondary md:flex"
            >
              <HomeIcon className="h-4 w-4" />
              Home
            </button>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="group flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md active:scale-95"
            >
              <Upload className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
              <span className="hidden sm:inline">Upload Memory</span>
              <span className="sm:hidden">Upload</span>
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-6xl p-6 lg:p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "journal" && (
                <JournalView
                  memories={memories}
                  onMemoryUpdated={handleMemoryUpdated}
                />
              )}
              {activeTab === "map" && <MapView memories={memories} />}
              {activeTab === "analytics" && <AnalyticsView memories={memories} />}
              {activeTab === "profile" && <ProfileView session={session} memories={memories} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          fetchMemories();
        }}
        user={session?.user}
      />
    </div>
  );
}

function SplashScreen() {
  const quote = getDashboardQuote();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#DDE7E1] px-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="retro-edge relative z-10 flex w-full max-w-md flex-col items-center rounded-md bg-[#F6FAF8] p-8 text-center text-[#3E6B5A]"
      >
        <LogoMark className="mb-7 h-32 w-32" />
        <p className="mb-2 font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#5F8F7B]">
          Preparing your memory deck
        </p>
        <h1 className="text-4xl font-black tracking-tight">
          Trails & Tales
        </h1>
        <p className="mt-4 text-sm font-medium leading-6 text-[#5F8F7B]">
          {quote}
        </p>
        
        <div className="mt-8 w-full max-w-xs border-2 border-[#3E6B5A] bg-[#DDE7E1] p-1 shadow-[5px_5px_0_rgba(62,107,90,0.18)]">
          <div className="relative h-5 overflow-hidden bg-[#EAF3EE]">
            <motion.div
              className="absolute inset-y-0 left-0 w-1/2 bg-[#3E6B5A]"
              animate={{ x: ["-100%", "220%"] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent_0,transparent_8px,rgba(246,250,248,0.28)_8px,rgba(246,250,248,0.28)_14px)]" />
          </div>
        </div>

        <p className="mt-4 font-mono text-xs font-bold uppercase tracking-[0.18em] text-[#5F8F7B]">
          Loading trail log
        </p>
      </motion.div>
    </div>
  );
}

function LandingPage({
  isSignedIn,
  onEnter,
  onSignIn,
}: {
  isSignedIn: boolean;
  onEnter: () => void;
  onSignIn: () => void;
}) {
  const heroQuote = getLandingQuote();
  const [isNavCompact, setIsNavCompact] = useState(false);
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "70%"]);
  const opacityY = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  useEffect(() => {
    const handleScroll = () => setIsNavCompact(window.scrollY > 80);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      <section id="top" ref={ref} className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background">
        {/* Parallax Background */}
        <motion.div
          style={{ y: backgroundY }}
          className="absolute inset-0 z-0"
        >
          <Image
            src="/hero-retro-trails.png"
            alt="Retro trail map landscape"
            fill
            className="object-cover object-[center_32%] opacity-95"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#3E6B5A]/90 via-[#3E6B5A]/62 to-[#DDE7E1]/20" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#DDE7E1] to-transparent" />
        </motion.div>

        <header className="fixed left-0 right-0 top-4 z-50 flex justify-center px-4">
          <div
            className={cn(
              "flex items-center justify-between rounded-full border border-white/35 bg-[#F6FAF8]/78 text-[#3E6B5A] shadow-[0_18px_60px_rgba(36,71,59,0.22)] backdrop-blur-xl transition-all duration-500",
              isNavCompact
                ? "w-auto gap-3 px-3 py-2"
                : "w-full max-w-5xl gap-5 px-4 py-3 sm:px-5"
            )}
          >
            <a href="#top" className="flex min-w-0 items-center gap-3">
              <LogoMark
                className={cn(
                  "transition-all duration-500",
                  isNavCompact ? "h-12 w-12" : "h-16 w-16"
                )}
              />
              <span className={cn("min-w-0 transition-all duration-300", isNavCompact && "hidden sm:block")}>
                <span className="block whitespace-nowrap text-sm font-black leading-none tracking-tight sm:text-base">
                  Trails & Tales
                </span>
                <span className={cn("mt-1 block whitespace-nowrap font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#5F8F7B]", isNavCompact && "hidden")}>
                  Memory archive
                </span>
              </span>
            </a>

            <nav className={cn("hidden items-center rounded-full bg-white/45 p-1 text-sm font-bold md:flex", isNavCompact ? "gap-1" : "gap-2")}>
              {[
                ["Features", "#features"],
                ["About", "#about"],
                ["Contact", "#contact"],
              ].map(([label, href]) => (
                <a
                  key={label}
                  href={href}
                  className={cn(
                    "rounded-full px-4 py-2 transition-colors hover:bg-[#EAF3EE]",
                    isNavCompact && "px-3 py-1.5 text-xs"
                  )}
                >
                  {label}
                </a>
              ))}
            </nav>

            {!isSignedIn && (
              <button
                onClick={onSignIn}
                className={cn(
                  "rounded-full bg-[#3E6B5A] font-black text-[#F6FAF8] shadow-sm transition-all hover:bg-[#315A4C]",
                  isNavCompact ? "px-4 py-2 text-xs" : "px-5 py-2.5 text-sm"
                )}
              >
                Sign In
              </button>
            )}
          </div>
        </header>

        {/* Parallax Main Text */}
        <motion.div 
          style={{ y: textY, opacity: opacityY }}
          className="pointer-events-none relative z-10 flex min-h-screen w-full flex-col items-start justify-start px-6 pt-36 sm:px-12 lg:items-end lg:pt-40"
        >
          <div className="mb-5 flex max-w-xl items-start gap-3 rounded-md border border-white/35 bg-[#24473B]/35 px-4 py-3 text-[#F6FAF8] shadow-sm backdrop-blur-sm lg:mr-12">
            <Quote className="mt-0.5 h-4 w-4 flex-none" />
            <p className="text-sm font-semibold leading-6">{heroQuote}</p>
          </div>
          <h1 className="max-w-4xl text-left font-serif text-6xl leading-[0.95] tracking-tight text-[#F6FAF8] drop-shadow-2xl sm:text-7xl lg:mr-12 lg:text-right lg:text-8xl">
            Archive your trails.
          </h1>
        </motion.div>

        {/* Secondary Text overlaying mountains */}
        <motion.div 
          style={{ opacity: opacityY }}
          className="pointer-events-none absolute left-0 right-0 top-[58vh] z-20 flex flex-col items-start px-6 sm:px-12 lg:top-[52vh] lg:items-end"
        >
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="max-w-2xl text-xl font-serif leading-relaxed text-[#F6FAF8] drop-shadow-sm sm:text-3xl lg:mr-12 lg:text-right"
          >
            A calm retro journal for photos, maps, memories, and the tiny details that make a journey yours.
          </motion.p>
        </motion.div>

        <button
          onClick={onEnter}
          className="retro-edge absolute bottom-10 left-6 z-30 flex items-center gap-3 rounded-md bg-[#EAF3EE] px-5 py-3 text-sm font-black text-[#3E6B5A] transition-transform hover:-translate-y-0.5 sm:left-12"
        >
          {isSignedIn ? "Open Journal" : "Start Your Archive"}
          <ArrowRight className="h-4 w-4" />
        </button>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 right-6 z-30 hidden flex-col items-center sm:flex">
          <button 
            onClick={() => {
              const featuresSection = document.getElementById('features');
              featuresSection?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="group relative flex h-20 w-20 items-center justify-center rounded-full text-[#F6FAF8] hover:scale-105 transition-transform duration-500"
          >
            <svg className="absolute inset-0 h-full w-full animate-[spin_12s_linear_infinite]" viewBox="0 0 100 100">
              <path id="textPath" d="M 50, 50 m -35, 0 a 35,35 0 1,1 70,0 a 35,35 0 1,1 -70,0" fill="transparent" />
              <text fontSize="11" className="fill-[#F6FAF8] font-mono tracking-widest uppercase">
                <textPath href="#textPath" startOffset="0%">
                  SCROLL - SCROLL -
                </textPath>
              </text>
            </svg>
            <ArrowRight className="h-6 w-6 rotate-90" strokeWidth={1} />
          </button>
        </div>
      </section>

      <section id="features" className="relative z-40 border-t border-border bg-background px-6 py-20 text-foreground sm:px-10 lg:px-16">
        <SectionIntro
          eyebrow="Features"
          title="Everything your travel archive needs, without the noise."
          copy="The app keeps the interface quiet, structured, and easy to return to after each journey."
        />
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
        <LandingNote 
          icon={<Book className="h-6 w-6 text-primary" />}
          label="01" 
          title="Journal" 
          copy="Keep memories, dates, photos, and notes together in a beautifully structured timeline." 
        />
        <LandingNote 
          icon={<MapIcon className="h-6 w-6 text-primary" />}
          label="02" 
          title="Map" 
          copy="Pin the places that shaped each trip. See your global footprint grow over time." 
        />
        <LandingNote 
          icon={<BarChart3 className="h-6 w-6 text-primary" />}
          label="03" 
          title="Analytics" 
          copy="Reflect on your journeys with insightful statistics and category breakdowns." 
        />
        </div>
      </section>

      <section id="about" className="grid gap-8 border-t border-border bg-card px-6 py-20 text-foreground sm:px-10 lg:grid-cols-[0.9fr_1.1fr] lg:px-16">
        <SectionIntro
          eyebrow="About"
          title="Built around grounded, personal storytelling."
          copy="Trails & Tales is designed as a calm memory desk: upload a photo, preserve the place, add your notes, and let your map grow naturally over time."
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <AboutTile title="Minimal Retro" copy="Structured cards, strong borders, and soft sage tones keep the product nostalgic but usable." />
          <AboutTile title="Photo First" copy="Images sit inside matching frames so the journal grid feels balanced and easy to scan." />
          <AboutTile title="Journey Aware" copy="Location data, dates, categories, and ratings stay connected in one archive." />
          <AboutTile title="Reflective" copy="Analytics and quotes create a small ritual around revisiting past travels." />
        </div>
      </section>

      <section className="border-t border-border bg-background px-6 py-20 sm:px-10 lg:px-16">
        <SectionIntro
          eyebrow="Flow"
          title="From photo to story in a few steady steps."
          copy="A simple rhythm for turning scattered travel photos into an archive you can actually browse, map, and reflect on."
        />

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          <ProcessStep icon={<Images />} title="Save the scene" copy="Upload the image and keep it in a consistent, photo-first memory card." />
          <ProcessStep icon={<Route />} title="Mark the place" copy="Connect dates, location names, coordinates, categories, and trip notes." />
          <ProcessStep icon={<ShieldCheck />} title="Return anytime" copy="Use journal, map, analytics, and profile views to revisit the full trail." />
        </div>
      </section>

      <section id="contact" className="border-t border-border bg-background px-6 py-20 sm:px-10 lg:px-16">
        <SectionIntro
          eyebrow="About Me"
          title="Vanshika Pringle"
          copy="I am an aspiring AI and Data Science professional with a strong foundation in Python, machine learning, and artificial intelligence."
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="retro-edge rounded-md bg-card p-7">
            <p className="text-base leading-8 text-muted-foreground">
              I have experience developing AI-based solutions, full-stack web applications, and data-driven platforms through research and projects. I am seeking opportunities where I can apply my technical skills, contribute to real-world solutions, and continue growing in the field of AI and data science.
            </p>
          </div>
          <div className="rounded-md border border-border bg-card p-7">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Beyond Work
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {["Travelling", "Reading", "Journalling"].map((hobby) => (
                <span
                  key={hobby}
                  className="rounded-full border border-border bg-secondary px-4 py-2 text-sm font-bold text-foreground"
                >
                  {hobby}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="relative overflow-hidden bg-[#1F3A33] px-6 py-16 text-[#F6FAF8] sm:px-10 lg:px-16">
        <div className="relative grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <LogoMark className="mb-6 h-28 w-28" />
            <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[#A8C9BA]">
              Vanshika Pringle
            </p>
            <h2 className="mt-3 max-w-3xl font-serif text-5xl leading-none text-[#F6FAF8] sm:text-6xl">
              Trails & Tales
            </h2>
            <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-[#C9DED5]">
              A personal travel journal for preserving photos, maps, memories, and the quiet details that make every journey yours.
            </p>
          </div>

          <div className="rounded-md border border-[#C9DED5]/25 bg-[#2A4A41] p-6">
            <p className="font-mono text-xs font-black uppercase tracking-[0.2em] text-[#A8C9BA]">
              Contact
            </p>
            <p className="mt-3 text-xl font-black text-[#F6FAF8]">
              Build notes, ideas, or collaborations.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <SocialIconLink icon={<Phone className="h-5 w-5" />} label="Phone" href="tel:8091073626" />
              <SocialIconLink icon={<Mail className="h-5 w-5" />} label="Email" href="mailto:vanshikapringle@gmail.com" />
              <SocialIconLink icon={<Linkedin className="h-5 w-5" />} label="LinkedIn" href="https://www.linkedin.com/in/vanshikapringle/" />
              <SocialIconLink icon={<Github className="h-5 w-5" />} label="GitHub" href="https://github.com/vanshikapringle" />
            </div>
            <p className="mt-6 border-t border-[#C9DED5]/20 pt-4 text-sm font-semibold leading-6 text-[#C9DED5]">
              {getDailyQuote()}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SectionIntro({
  eyebrow,
  title,
  copy,
}: {
  eyebrow: string;
  title: string;
  copy: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="font-mono text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-black leading-tight text-foreground sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-base leading-7 text-muted-foreground">
        {copy}
      </p>
    </div>
  );
}

function SocialIconLink({
  icon,
  label,
  href,
}: {
  icon: React.ReactElement;
  label: string;
  href: string;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      title={label}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noreferrer" : undefined}
      className="flex h-12 w-12 items-center justify-center rounded-full border border-[#C9DED5]/25 bg-[#F6FAF8] text-[#1F3A33] transition-all hover:-translate-y-0.5 hover:bg-[#C9DED5]"
    >
      {icon}
    </a>
  );
}

function AboutTile({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="rounded-md border border-border bg-background p-5">
      <h3 className="text-lg font-black text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p>
    </div>
  );
}

function ProcessStep({
  icon,
  title,
  copy,
}: {
  icon: React.ReactElement;
  title: string;
  copy: string;
}) {
  return (
    <div className="flex gap-4 rounded-md border border-border bg-card p-6">
      <div className="flex h-12 w-12 flex-none items-center justify-center rounded-md bg-secondary text-primary">
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-black text-foreground">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy}</p>
      </div>
    </div>
  );
}

function LandingNote({
  icon,
  label,
  title,
  copy,
}: {
  icon: React.ReactNode;
  label: string;
  title: string;
  copy: string;
}) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="group retro-edge rounded-md bg-card p-8 transition-all hover:-translate-y-1"
    >
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
        {icon}
      </div>
      <div className="flex items-center gap-3 mb-3">
        <p className="font-mono text-sm font-bold text-muted-foreground opacity-70">{label}</p>
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
      </div>
      <p className="text-base leading-relaxed text-muted-foreground">{copy}</p>
    </motion.div>
  );
}

function JournalView({
  memories,
  onMemoryUpdated,
}: {
  memories: Memory[];
  onMemoryUpdated: (memory: Memory) => void;
}) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [lightboxMemory, setLightboxMemory] = useState<Memory | null>(null);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);

  if (!memories.length) {
    return (
      <EmptyState
        icon={<Camera className="h-8 w-8 text-primary" />}
        title="Your journal is empty"
        description="Upload your first travel memory to start your tale."
      />
    );
  }

  const categories = [
    "All",
    ...Array.from(
      new Set(memories.map((memory) => memory.category || "Uncategorized"))
    ).sort(),
  ];
  const visibleMemories =
    selectedCategory === "All"
      ? memories
      : memories.filter(
          (memory) => (memory.category || "Uncategorized") === selectedCategory
        );

  return (
    <>
      <div className="mb-6 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
          <Filter className="h-4 w-4" />
          Filter by tag
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                selectedCategory === category
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {!visibleMemories.length ? (
        <EmptyState
          icon={<Filter className="h-8 w-8 text-primary" />}
          title="No memories in this tag"
          description="Try another tag to bring your memories back into view."
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {visibleMemories.map((mem) => (
            <motion.article
              key={mem.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ y: -4 }}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:shadow-md"
            >
              {mem.image_url ? (
                <button
                  type="button"
                  onClick={() => setLightboxMemory(mem)}
                  className="relative aspect-[4/3] w-full overflow-hidden bg-secondary text-left"
                  aria-label={`Open ${mem.title} image`}
                >
                  <Image
                    src={mem.image_url}
                    alt={mem.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {mem.category && (
                    <div className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold tracking-wide text-white backdrop-blur-md">
                      {mem.category}
                    </div>
                  )}
                  <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/55 px-3 py-1 text-xs font-bold text-white opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100">
                    <Maximize2 className="h-3.5 w-3.5" />
                    View
                  </div>
                </button>
              ) : (
                <div className="flex aspect-[4/3] w-full items-center justify-center bg-secondary">
                  <Camera className="h-10 w-10 text-muted-foreground/30" />
                </div>
              )}

              <div className="flex flex-1 flex-col p-5">
                <div className="mb-3 flex items-center justify-between text-xs font-medium text-muted-foreground">
                  <div className="flex items-center gap-1.5 bg-secondary px-2 py-1 rounded-md">
                    <Calendar className="h-3 w-3" />
                    {mem.visit_date}
                  </div>
                  <div className="flex items-center gap-1.5 truncate max-w-[140px]">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{mem.location_name || "Unknown"}</span>
                  </div>
                </div>

                <h3 className="mb-2 text-xl font-bold tracking-tight text-foreground line-clamp-1">
                  {mem.title}
                </h3>
                
                <p className="mb-4 text-sm leading-relaxed text-muted-foreground line-clamp-2">
                  {mem.description || "No journal entry added."}
                </p>

                <div className="mt-auto flex items-center justify-between gap-4 border-t border-border pt-4 text-sm">
                  <div className="flex min-w-0 items-center gap-4">
                    {mem.rating && (
                      <div className="flex items-center gap-1 font-semibold text-yellow-500">
                        <Star className="h-4 w-4 fill-current" />
                        {mem.rating}/5
                      </div>
                    )}
                    {mem.time_spent && (
                      <div className="flex items-center gap-1.5 truncate font-medium text-muted-foreground">
                        <Clock className="h-4 w-4 flex-none" />
                        <span className="truncate">{mem.time_spent}</span>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingMemory(mem)}
                    className="flex flex-none items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground transition-colors hover:bg-secondary"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Edit
                  </button>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      )}

      <ImageLightbox
        memory={lightboxMemory}
        onClose={() => setLightboxMemory(null)}
      />
      <EditMemoryModal
        memory={editingMemory}
        onClose={() => setEditingMemory(null)}
        onSaved={(updatedMemory) => {
          onMemoryUpdated(updatedMemory);
          setEditingMemory(null);
        }}
      />
    </>
  );
}

function ImageLightbox({
  memory,
  onClose,
}: {
  memory: Memory | null;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {memory?.image_url && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-5 rounded-full bg-white/12 p-3 text-white transition-colors hover:bg-white/20"
            aria-label="Close image"
          >
            <X className="h-5 w-5" />
          </button>
          <motion.div
            initial={{ scale: 0.95, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 12 }}
            className="relative h-[82vh] w-full max-w-6xl"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={memory.image_url}
              alt={memory.title}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </motion.div>
          <div className="absolute bottom-5 left-1/2 max-w-[90vw] -translate-x-1/2 rounded-full bg-white/12 px-5 py-2 text-center text-sm font-semibold text-white backdrop-blur-md">
            {memory.title}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function EditMemoryModal({
  memory,
  onClose,
  onSaved,
}: {
  memory: Memory | null;
  onClose: () => void;
  onSaved: (memory: Memory) => void;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Uncategorized");
  const [description, setDescription] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [locationName, setLocationName] = useState("");
  const [notes, setNotes] = useState("");
  const [timeSpent, setTimeSpent] = useState("");
  const [rating, setRating] = useState(5);
  const [favoriteMoment, setFavoriteMoment] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!memory) return;
    setTitle(memory.title || "");
    setCategory(memory.category || "Uncategorized");
    setDescription(memory.description || "");
    setVisitDate(memory.visit_date || "");
    setLocationName(memory.location_name || "");
    setNotes(memory.notes || "");
    setTimeSpent(memory.time_spent || "");
    setRating(memory.rating || 5);
    setFavoriteMoment(memory.favorite_moment || "");
  }, [memory]);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!memory) return;

    setSaving(true);
    const payload = {
      title: title || "Untitled Memory",
      category,
      description,
      visit_date: visitDate,
      location_name: locationName,
      notes,
      time_spent: timeSpent,
      rating,
      favorite_moment: favoriteMoment,
    };

    const { error } = await supabase
      .from("memories")
      .update(payload)
      .eq("id", memory.id);

    setSaving(false);

    if (error) {
      alert(error.message || "Could not update this memory.");
      return;
    }

    onSaved({ ...memory, ...payload });
  };

  return (
    <AnimatePresence>
      {memory && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-foreground/25 backdrop-blur-sm"
            onClick={saving ? undefined : onClose}
          />
          <div className="fixed inset-0 z-[61] grid place-items-center px-4 py-6 pointer-events-none">
            <motion.form
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onSubmit={handleSave}
              className="pointer-events-auto relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl sm:p-8"
            >
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
                aria-label="Close edit form"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mb-8 pr-10">
                <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Edit Entry
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                  Update memory details
                </h2>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <EditField label="Title">
                  <input value={title} onChange={(e) => setTitle(e.target.value)} />
                </EditField>
                <EditField label="Tag">
                  <select value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option>Uncategorized</option>
                    <option>Trek</option>
                    <option>Food</option>
                    <option>Monument</option>
                    <option>Relaxation</option>
                  </select>
                </EditField>
                <EditField label="Visit Date">
                  <input
                    type="date"
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                  />
                </EditField>
                <EditField label="Location">
                  <input
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                  />
                </EditField>
                <EditField label="Time Spent">
                  <input
                    value={timeSpent}
                    onChange={(e) => setTimeSpent(e.target.value)}
                  />
                </EditField>
                <EditField label="Rating">
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                  />
                </EditField>
                <EditField label="Favorite Moment" wide>
                  <input
                    value={favoriteMoment}
                    onChange={(e) => setFavoriteMoment(e.target.value)}
                  />
                </EditField>
                <EditField label="Journal Entry" wide>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </EditField>
                <EditField label="Personal Notes" wide>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </EditField>
              </div>

              <div className="mt-8 flex justify-end gap-3 border-t border-border pt-6">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="rounded-xl px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex min-w-[140px] items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </motion.form>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

function EditField({
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

function MapView({ memories }: { memories: Memory[] }) {
  const validMemories = memories.filter((m) => m.lat != null && m.lng != null);

  if (!validMemories.length) {
    return (
      <EmptyState
        icon={<MapIcon className="h-8 w-8 text-primary" />}
        title="No valid GPS data found"
        description="Upload photos containing location metadata to map your journey."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border p-6">
        <h3 className="text-xl font-bold">Your Journey</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {validMemories.length} pinned locations on the map
        </p>
      </div>

      <div className="min-h-[600px] w-full bg-secondary relative z-0">
        <MapViewComponent memories={validMemories} />
      </div>
    </div>
  );
}

function AnalyticsView({ memories }: { memories: Memory[] }) {
  const analytics = useMemo(() => {
    const sorted = [...memories].sort(
      (a, b) =>
        new Date(a.visit_date).getTime() - new Date(b.visit_date).getTime()
    );

    let totalTrips = sorted.length ? 1 : 0;
    for (let i = 1; i < sorted.length; i++) {
      const previousDate = new Date(sorted[i - 1].visit_date);
      const currentDate = new Date(sorted[i].visit_date);
      const diffDays =
        (currentDate.getTime() - previousDate.getTime()) /
        (1000 * 60 * 60 * 24);

      if (diffDays > 20) totalTrips++;
    }

    const categoryCounts = sorted.reduce<Record<string, number>>((acc, mem) => {
      const category = mem.category || "Uncategorized";
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    const monthlyCounts = sorted.reduce<Record<string, number>>((acc, mem) => {
      const month = new Date(mem.visit_date).toLocaleString("default", {
        month: "short",
      });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});

    const yearlyCounts = sorted.reduce<Record<string, number>>((acc, mem) => {
      const year = new Date(mem.visit_date).getFullYear().toString();
      acc[year] = (acc[year] || 0) + 1;
      return acc;
    }, {});

    const categoryData = Object.entries(categoryCounts).map(([name, value]) => ({
      name,
      value,
    }));

    const monthlyData = Object.entries(monthlyCounts).map(([month, count]) => ({
      month,
      count,
    }));

    const yearlyData = Object.entries(yearlyCounts).map(([year, count]) => ({
      year,
      count,
    }));

    const favoriteCategory = categoryData.length
      ? categoryData.reduce((max, current) =>
          current.value > max.value ? current : max
        ).name
      : "None";

    const mostActiveMonth = monthlyData.length
      ? monthlyData.reduce((max, current) =>
          current.count > max.count ? current : max
        ).month
      : "N/A";

    const rated = sorted.filter((mem) => typeof mem.rating === "number");
    const averageRating = rated.length
      ? (
          rated.reduce((sum, mem) => sum + Number(mem.rating), 0) /
          rated.length
        ).toFixed(1)
      : "N/A";

    return {
      totalPlaces: sorted.length,
      totalTrips,
      categoryData,
      monthlyData,
      yearlyData,
      favoriteCategory,
      mostActiveMonth,
      uniqueCities: new Set(sorted.map((m) => m.location_name).filter(Boolean))
        .size,
      averageRating,
    };
  }, [memories]);

  if (!memories.length) {
    return (
      <EmptyState
        icon={<BarChart3 className="h-8 w-8 text-primary" />}
        title="No analytics yet"
        description="Upload a few memories to unlock insights about your travels."
      />
    );
  }

  const colors = ["#5F8F7B", "#3E6B5A", "#DDE7E1", "#EAF3EE", "#F6FAF8"];

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label="Places" value={analytics.totalPlaces} />
        <Stat label="Trips" value={analytics.totalTrips} />
        <Stat label="Cities" value={analytics.uniqueCities} />
        <Stat label="Top Tag" value={analytics.favoriteCategory} />
        <Stat label="Avg Rating" value={analytics.averageRating} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartPanel title="Monthly Memory Count">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={analytics.monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="month" stroke="#5F8F7B" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis allowDecimals={false} stroke="#5F8F7B" tickLine={false} axisLine={false} fontSize={12} />
              <Tooltip cursor={{ fill: '#EAF3EE' }} contentStyle={{ borderRadius: '6px', border: '1px solid rgba(62,107,90,0.28)', boxShadow: 'none' }} />
              <Bar dataKey="count" fill="#5F8F7B" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Category Mix">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={analytics.categoryData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={95}
                innerRadius={60}
                stroke="none"
                label
              >
                {analytics.categoryData.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={colors[index % colors.length]}
                  />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '6px', border: '1px solid rgba(62,107,90,0.28)', boxShadow: 'none' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>

      <p className="text-sm font-medium text-muted-foreground bg-white px-4 py-3 rounded-xl border border-border inline-block w-max shadow-sm">
        Most active month: <strong className="text-foreground">{analytics.mostActiveMonth}</strong>
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <motion.div 
      whileHover={{ y: -2 }}
      className="rounded-2xl border border-border bg-card p-5 shadow-sm"
    >
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-black tracking-tight text-foreground">{value}</p>
    </motion.div>
  );
}

function ChartPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h3 className="mb-6 text-lg font-bold tracking-tight text-foreground">{title}</h3>
      {children}
    </section>
  );
}

function ProfileView({
  session,
  memories,
}: {
  session: any;
  memories: Memory[];
}) {
  return (
    <div className="grid max-w-4xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
            {session.user.email?.[0].toUpperCase()}
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">{session.user.email}</h3>
            <p className="mt-1 text-sm text-muted-foreground">Traveler Profile</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-border pt-6">
          <div>
            <p className="text-sm text-muted-foreground">Total Memories</p>
            <p className="mt-1 text-2xl font-bold">{memories.length}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
          About Me
        </p>
        <h3 className="mt-3 text-2xl font-black text-foreground">
          Vanshika Pringle
        </h3>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          I am an aspiring AI and Data Science professional with a strong foundation in Python, machine learning, and artificial intelligence. I enjoy building AI-based solutions, full-stack web applications, and data-driven platforms through research and projects.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {["AI", "Data Science", "Python", "Travelling", "Reading", "Journalling"].map((item) => (
            <span
              key={item}
              className="rounded-full border border-border bg-secondary px-3 py-1.5 text-xs font-bold text-foreground"
            >
              {item}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}

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
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-8 text-center shadow-sm">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
        {icon}
      </div>
      <h2 className="text-xl font-bold tracking-tight text-foreground">{title}</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function AuthUI({ onBack }: { onBack?: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = isLogin
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[1.05fr_0.95fr]">
      <div className="relative hidden overflow-hidden lg:block">
        <Image
          src="/hero-retro-trails.png"
          alt="Retro travel landscape"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-[#24473B]/70" />
        <div className="absolute inset-10 flex flex-col justify-between border border-white/25 p-8 text-[#F6FAF8]">
          <a href="#top" className="flex items-center gap-3 text-lg font-black tracking-tight">
            <LogoMark className="h-16 w-16" />
            <span>Trails & Tales</span>
          </a>
          <div>
            <Quote className="mb-4 h-7 w-7" />
            <p className="max-w-lg font-serif text-4xl leading-tight">
              {getLandingQuote()}
            </p>
            <p className="mt-5 max-w-md text-sm font-medium leading-6 text-[#EAF3EE]">
              Keep every trail, photo, note, and place in one thoughtful archive.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-4 sm:p-8">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-xl"
      >
        {onBack && (
          <button
            onClick={onBack}
            className="mb-6 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            &larr; Back to landing
          </button>
        )}

        <div className="mb-8 text-center">
          <LogoMark className="mx-auto mb-4 h-20 w-20" />
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {isLogin ? "Welcome back" : "Create an account"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isLogin
              ? "Sign in to continue building your travel archive."
              : "Start saving your trails, maps, and favorite moments."}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-border bg-transparent px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-border bg-transparent px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="Enter your password"
            />
          </div>

          {error && <p className="text-sm font-medium text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-foreground/90 disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isLogin ? "Sign In" : "Sign Up"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </motion.div>
      </div>
    </div>
  );
}
