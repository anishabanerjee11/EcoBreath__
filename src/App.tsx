import { useState, useEffect } from "react";
import {
  Sun,
  Wind,
  Droplets,
  Cloud,
  Compass,
  ShieldAlert,
  Sparkles,
  Map,
  Plus,
  Home as HomeIcon,
  ClipboardList,
  Bell,
  User as UserIcon,
  CheckCircle2,
  Activity,
  ChevronRight,
  Loader2,
  Volume2,
  RefreshCw,
  X,
  VolumeX,
  Languages,
  MapPin
} from "lucide-react";

import { InitSyncData, AIBriefing } from "./types";
import LandingPage from "./components/LandingPage";
import AnalyticsCharts from "./components/AnalyticsCharts";
import ReportModal from "./components/ReportModal";
import NotificationsDrawer from "./components/NotificationsDrawer";

interface PushToast {
  id: string;
  title: string;
  description: string;
  category: string;
}

export default function App() {
  // Onboarding state
  const [user, setUser] = useState<{ name: string; city: string } | null>(null);

  // Core synchronized application state
  const [syncData, setSyncData] = useState<InitSyncData | null>(null);
  const [aiBriefing, setAiBriefing] = useState<AIBriefing | null>(null);
  const [selectedCity, setSelectedCity] = useState("Rourkela");
  const [currentTab, setCurrentTab] = useState<"Home" | "Reports" | "Alerts" | "Profile">("Home");

  // Local interaction states
  const [showReportModal, setShowReportModal] = useState(false);
  const [connected, setConnected] = useState(false);
  const [toasts, setToasts] = useState<PushToast[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [reportsFilter, setReportsFilter] = useState<"All" | "Pending" | "Verified" | "Resolved">("All");

  // Setup Server-Sent Events (SSE) stream for real-time telemetry and push notifications
  useEffect(() => {
    if (!user) return;

    let sseSource: EventSource | null = null;
    let reconnectTimeout: any = null;

    // Standard HTTP fetch fallback for initial synchronization (Crucial for Vercel Serverless environment)
    const fetchInitialSync = async () => {
      try {
        const res = await fetch("/api/sync");
        if (res.ok) {
          const payload = await res.json();
          setSyncData((prev) => prev || payload);
          if (payload.userProfile && user.name === "Anisha Banerjee") {
            setUser({
              name: payload.userProfile.name,
              city: payload.userProfile.settings.liveLocation === "granted" ? "Rourkela" : "Rourkela",
            });
          }
        }
      } catch (err) {
        console.error("[HTTP Sync] Failed to retrieve initial sync snapshot:", err);
      }
    };

    fetchInitialSync();

    const connectSSE = () => {
      console.log("[SSE] Connecting to EcoBreath telemetry stream...");
      sseSource = new EventSource("/api/notifications/stream");

      sseSource.onopen = () => {
        setConnected(true);
        console.log("[SSE] Connected securely to telemetry server.");
      };

      sseSource.onerror = (err) => {
        setConnected(false);
        console.error("[SSE] Connection lost. Retrying in 5 seconds...", err);
        sseSource?.close();
        reconnectTimeout = setTimeout(connectSSE, 5000);
      };

      sseSource.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log("[SSE] Message received:", message.type);

          switch (message.type) {
            case "INIT_SYNC":
              setSyncData(message.payload);
              // Set the default user profile from sync payload
              if (message.payload.userProfile && user.name === "Anisha Banerjee") {
                setUser({
                  name: message.payload.userProfile.name,
                  city: message.payload.userProfile.settings.liveLocation === "granted" ? "Rourkela" : "Rourkela",
                });
              }
              break;

            case "TELEMETRY_UPDATE":
              setSyncData((prev) => {
                if (!prev) return null;
                return {
                  ...prev,
                  ...message.payload,
                };
              });
              break;

            case "NEW_REPORT":
              setSyncData((prev) => {
                if (!prev) return null;
                return {
                  ...prev,
                  incidents: message.payload.incidents,
                  alerts: message.payload.alerts,
                  userProfile: message.payload.userProfile,
                };
              });
              break;

            case "PUSH_NOTIFICATION": {
              const alert = message.payload;
              // Trigger UI Toast notification
              triggerPushToast(alert);
              // Append to local alerts list
              setSyncData((prev) => {
                if (!prev) return null;
                return {
                  ...prev,
                  alerts: [alert, ...prev.alerts],
                };
              });
              break;
            }

            default:
              break;
          }
        } catch (e) {
          console.error("[SSE] Parsing error on message event:", e);
        }
      };
    };

    connectSSE();

    // Fetch initial AI briefing
    fetchAIBriefing();

    return () => {
      sseSource?.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [user]);

  // Sync city parameter in sync data
  useEffect(() => {
    if (syncData) {
      // Trigger a prompt briefing update automatically when changing cities
      fetchAIBriefing();
    }
  }, [selectedCity]);

  // Play synthetic environmental synth signal for alerts
  const playAlertSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // high tone
      osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.3); // fall to middle A

      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);

      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (soundErr) {
      console.warn("Unable to initialize synthesizer:", soundErr);
    }
  };

  const triggerPushToast = (alert: any) => {
    playAlertSound();
    const newToast: PushToast = {
      id: "toast_" + Date.now(),
      title: alert.title,
      description: alert.description || alert.location,
      category: alert.category || "Critical",
    };

    setToasts((prev) => [newToast, ...prev]);

    // Auto-remove toast after 6 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 6000);
  };

  const fetchAIBriefing = async () => {
    try {
      const res = await fetch("/api/gemini/briefing", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setAiBriefing(data);
      }
    } catch (err) {
      console.error("Failed to sync environmental advice briefing:", err);
    }
  };

  const handleCityChange = async (city: string) => {
    setSelectedCity(city);
    try {
      await fetch("/api/weather/city", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city }),
      });
    } catch (err) {
      console.error("Failed to notify server of city transition:", err);
    }
  };

  const handleReportSubmit = async (reportData: {
    category: string;
    location: string;
    description: string;
    imageBase64?: string;
  }) => {
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reportData),
    });
    if (!res.ok) {
      throw new Error("Unable to submit environmental hazard report");
    }
    const data = await res.json();
    return data;
  };

  const handleArchiveAlert = async (id: string) => {
    try {
      const res = await fetch("/api/alerts/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setSyncData((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            alerts: prev.alerts.filter((a) => a.id !== id),
          };
        });
      }
    } catch (err) {
      console.error("Failed to archive environmental log:", err);
    }
  };

  const handleUpdateSettings = async (settingKey: string, value: any) => {
    try {
      const updatedSettings = {
        [settingKey]: value,
      };
      const res = await fetch("/api/profile/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedSettings),
      });
      if (res.ok && syncData) {
        setSyncData((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            userProfile: {
              ...prev.userProfile,
              settings: {
                ...prev.userProfile.settings,
                ...updatedSettings,
              },
            },
          };
        });
      }
    } catch (err) {
      console.error("Failed to synchronize user settings:", err);
    }
  };

  // Onboard Completion callback
  const handleOnboardComplete = (userData: { name: string; city: string }) => {
    setUser(userData);
    setSelectedCity(userData.city);
  };

  if (!user) {
    return <LandingPage onOnboardComplete={handleOnboardComplete} />;
  }

  // Define AQI Styling levels
  const getAqiDetails = (aqi: number) => {
    if (aqi <= 50) return { label: "Good", color: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/10", glow: "shadow-emerald-500/20" };
    if (aqi <= 100) return { label: "Moderate", color: "text-amber-400", border: "border-amber-500/30", bg: "bg-amber-500/10", glow: "shadow-amber-500/20" };
    if (aqi <= 150) return { label: "Unhealthy", color: "text-orange-400", border: "border-orange-500/30", bg: "bg-orange-500/10", glow: "shadow-orange-500/20" };
    return { label: "Very Unhealthy", color: "text-red-400", border: "border-red-500/30", bg: "bg-red-500/10", glow: "shadow-red-500/20" };
  };

  const aqiStyles = getAqiDetails(syncData?.weather.aqi || 126);

  // Filter reported incidents
  const filteredIncidents = syncData?.incidents.filter((inc) => {
    if (reportsFilter === "All") return true;
    if (reportsFilter === "Pending" && inc.status === "Under Verification") return true;
    if (reportsFilter === "Verified" && inc.status === "In Progress") return true;
    if (reportsFilter === "Resolved" && inc.status === "Resolved") return true;
    return false;
  }) || [];

  return (
    <div className={`min-h-screen bg-[#0A0E1A] text-slate-100 font-sans flex flex-col relative overflow-x-hidden ${syncData?.userProfile.settings.darkMode ? "dark" : ""}`}>
      {/* Background visual canvas accents */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-blue-600/[0.04] blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-500/[0.04] blur-[150px] pointer-events-none" />

      {/* FLOATING PUSH TOASTS PANEL */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.95 }}
              className="bg-[#0A0E1A]/90 border border-slate-700/50 backdrop-blur-md p-4 rounded-2xl shadow-2xl flex items-start gap-3 relative overflow-hidden"
            >
              {/* Highlight strip color */}
              <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${toast.category === "Critical" ? "bg-red-500" : "bg-blue-400"}`} />
              <div className="flex-1 text-left pl-2">
                <span className="text-[9px] font-bold text-slate-500 font-mono tracking-wider uppercase block">
                  PUSH NOTIFICATION
                </span>
                <h5 className="font-bold text-slate-200 text-xs mt-0.5">{toast.title}</h5>
                <p className="text-[11px] text-slate-400 mt-1 leading-normal">{toast.description}</p>
              </div>
              <button
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="text-slate-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* CORE HEADER */}
      <header className="w-full bg-[#0A0E1A]/60 border-b border-slate-800/50 sticky top-0 backdrop-blur-md z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          {/* Logo brand & Connection sensor indicators */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Compass className="w-5 h-5 text-blue-400 stroke-[2.5]" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-display font-extrabold text-base tracking-tight text-white leading-tight">
                ECOBREATH
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse" : "bg-amber-400 animate-bounce"}`} />
                <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-wider">
                  {connected ? "SENSOR FEED ACTIVE" : "CONNECTING SIGNAL..."}
                </span>
              </div>
            </div>
          </div>

          {/* Controls: Target City selection & Audio alerts */}
          <div className="flex items-center gap-3">
            {/* Audio enable */}
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                // play test chime if enabled
                if (!soundEnabled) {
                  setTimeout(() => {
                    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.frequency.setValueAtTime(440, ctx.currentTime);
                    gain.gain.setValueAtTime(0.05, ctx.currentTime);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.1);
                  }, 100);
                }
              }}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                soundEnabled
                  ? "bg-blue-500/20 border-blue-400/30 text-blue-400"
                  : "bg-slate-800/50 border-slate-700/50 text-slate-400 hover:text-slate-200"
              }`}
              title={soundEnabled ? "Mute Alert Signals" : "Enable Sound Chime Signals"}
            >
              {soundEnabled ? <Volume2 className="w-4.5 h-4.5" /> : <VolumeX className="w-4.5 h-4.5" />}
            </button>

            {/* City dropdown selection */}
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 pointer-events-none" />
              <select
                value={selectedCity}
                onChange={(e) => handleCityChange(e.target.value)}
                className="pl-9 pr-8 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
              >
                <option value="Rourkela">Rourkela</option>
                <option value="Delhi">Delhi</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Bengaluru">Bengaluru</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* DASHBOARD GRID CONTENT */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-8 pb-32">
        <AnimatePresence mode="wait">
          {/* TAB 1: HOME PANEL */}
          {currentTab === "Home" && (
            <motion.div
              key="tab-home"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* LIVE SNAPSHOT ALERT BANNER */}
              <div className="p-5 bg-gradient-to-br from-blue-600/10 to-transparent border border-slate-700/50 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                    <Sun className="w-5 h-5 text-sky-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-sky-400 font-mono uppercase tracking-wider">
                      Live Environmental Snapshot
                    </span>
                    <h4 className="text-slate-200 text-sm font-semibold mt-0.5">
                      {selectedCity} is showing {aqiStyles.label.toLowerCase()} pressure today.
                    </h4>
                  </div>
                </div>

                {/* mini stats indicators */}
                <div className="flex items-center gap-3 font-mono text-[10px] text-slate-400">
                  <span className="px-2.5 py-1.5 bg-[#0A0E1A]/60 border border-slate-700/30 rounded-xl">12 Hotspots Monitored</span>
                  <span className="px-2.5 py-1.5 bg-[#0A0E1A]/60 border border-slate-700/30 rounded-xl">3 Verified Reports</span>
                </div>
              </div>

              {/* FIRST MODULE ROW: AQI RING & WEATHER STATS CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                {/* Large AQI Gauge Ring Widget */}
                <div className="md:col-span-5 bg-gradient-to-br from-blue-600/10 to-transparent border border-slate-700/50 p-6 rounded-[32px] flex flex-col items-center justify-center relative overflow-hidden min-h-[300px]">
                  <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider mb-4">
                    Current AQI Diagnostic
                  </span>

                  {/* Circular radial gauge rendering */}
                  <div className="relative w-40 h-40 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90">
                      <circle
                        cx="80"
                        cy="80"
                        r="68"
                        stroke="rgba(255,255,255,0.05)"
                        strokeWidth="10"
                        fill="transparent"
                      />
                      <circle
                        cx="80"
                        cy="80"
                        r="68"
                        stroke={syncData?.weather.aqi && syncData.weather.aqi > 150 ? "#f87171" : syncData?.weather.aqi && syncData.weather.aqi > 100 ? "#fb923c" : "#34d399"}
                        strokeWidth="10"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 68}
                        strokeDashoffset={(2 * Math.PI * 68) * (1 - (syncData?.weather.aqi || 126) / 300)}
                        className="transition-all duration-1000 ease-out"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-display font-black text-white">
                        {syncData?.weather.aqi || 126}
                      </span>
                      <span className={`text-[11px] font-bold tracking-wide uppercase mt-1 ${aqiStyles.color}`}>
                        {aqiStyles.label}
                      </span>
                    </div>
                  </div>

                  <span className="text-[11px] text-slate-400 mt-4 text-center leading-normal max-w-[200px]">
                    Air quality is sensitive for vulnerable groups. Live-updated now.
                  </span>
                </div>

                {/* Weather telemetry grid items */}
                <div className="md:col-span-7 grid grid-cols-2 gap-4">
                  {/* Temp */}
                  <div className="bg-[#0A0E1A]/40 border border-slate-700/50 p-5 rounded-2xl text-left flex flex-col justify-between shadow-lg hover:border-blue-500/30 transition-all">
                    <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider">
                      Temperature
                    </span>
                    <div className="flex items-center gap-3 my-2">
                      <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center">
                        <Sun className="w-5 h-5 text-orange-400" />
                      </div>
                      <span className="text-2xl font-display font-bold text-white">
                        {syncData?.weather.temp || 26}°C
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">Current thermal sensory level</span>
                  </div>

                  {/* Wind */}
                  <div className="bg-[#0A0E1A]/40 border border-slate-700/50 p-5 rounded-2xl text-left flex flex-col justify-between shadow-lg hover:border-blue-500/30 transition-all">
                    <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider">
                      Wind Velocity
                    </span>
                    <div className="flex items-center gap-3 my-2">
                      <div className="w-9 h-9 rounded-xl bg-sky-500/10 flex items-center justify-center">
                        <Wind className="w-5 h-5 text-sky-400" />
                      </div>
                      <span className="text-2xl font-display font-bold text-white">
                        {syncData?.weather.wind || 12} km/h
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">Particulate dispersal factor</span>
                  </div>

                  {/* Humidity */}
                  <div className="bg-[#0A0E1A]/40 border border-slate-700/50 p-5 rounded-2xl text-left flex flex-col justify-between shadow-lg hover:border-blue-500/30 transition-all">
                    <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider">
                      Relative Humidity
                    </span>
                    <div className="flex items-center gap-3 my-2">
                      <div className="w-9 h-9 rounded-xl bg-teal-500/10 flex items-center justify-center">
                        <Droplets className="w-5 h-5 text-teal-400" />
                      </div>
                      <span className="text-2xl font-display font-bold text-white">
                        {syncData?.weather.humidity || 64}%
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">Moisture retention coefficient</span>
                  </div>

                  {/* Sky condition */}
                  <div className="bg-[#0A0E1A]/40 border border-slate-700/50 p-5 rounded-2xl text-left flex flex-col justify-between shadow-lg hover:border-blue-500/30 transition-all">
                    <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider">
                      Sky Atmosphere
                    </span>
                    <div className="flex items-center gap-3 my-2">
                      <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center">
                        <Cloud className="w-5 h-5 text-violet-400" />
                      </div>
                      <span className="text-lg font-display font-bold text-white truncate max-w-[120px]">
                        {syncData?.weather.sky || "Cloudy"}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">Overhead atmospheric filter</span>
                  </div>
                </div>
              </div>

              {/* SECOND MODULE ROW: NEARBY AIR QUALITY & GEOSPATIAL MAP SIM */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                {/* Neighborhood Sectors lists */}
                <div className="md:col-span-5 bg-slate-800/40 border border-slate-700/50 p-5 rounded-3xl flex flex-col gap-4 text-left shadow-lg">
                  <div className="flex flex-col">
                    <h4 className="text-sm font-semibold text-slate-200">Nearby Air Quality</h4>
                    <span className="text-[9px] text-slate-500 font-mono">SECTOR SENSOR NETWORKS</span>
                  </div>

                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                    {syncData?.sectors.map((sec) => (
                      <div key={sec.id} className="p-3 bg-[#0A0E1A]/60 border border-slate-800/60 rounded-xl flex items-center justify-between text-xs hover:border-blue-500/25 transition-all">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-slate-200">{sec.name}</span>
                          <span className="text-[10px] text-slate-500">{sec.description}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-slate-300">{sec.aqi}</span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            sec.aqi > 150 ? "bg-red-500/10 text-red-400" : sec.aqi > 100 ? "bg-orange-500/10 text-orange-400" : "bg-emerald-500/10 text-emerald-400"
                          }`}>
                            {sec.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Interactive map simulation (Geospatial Heatzones) */}
                <div className="md:col-span-7 bg-slate-800/40 border border-slate-700/50 p-5 rounded-3xl flex flex-col gap-4 text-left relative overflow-hidden min-h-[300px] shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <h4 className="text-sm font-semibold text-slate-200">Live Heatzones</h4>
                      <span className="text-[9px] text-slate-500 font-mono">GEOSPATIAL INCIDENT OVERLAYS</span>
                    </div>
                    <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 font-mono text-[9px] font-bold rounded-full">
                      4 ACTIVE ZONES
                    </span>
                  </div>

                  {/* Simulated Map wireframe visualization */}
                  <div className="flex-1 bg-[#0A0E1A]/80 rounded-xl relative overflow-hidden flex items-center justify-center border border-slate-800/85">
                    {/* Simulated contour circles representing heating spikes */}
                    <div className="absolute top-16 left-20 w-16 h-16 rounded-full bg-red-500/20 blur-md animate-pulse" />
                    <div className="absolute top-16 left-20 w-8 h-8 rounded-full bg-red-500/30 blur-sm" />

                    <div className="absolute bottom-20 right-32 w-24 h-24 rounded-full bg-amber-500/15 blur-lg animate-pulse" />
                    <div className="absolute bottom-24 right-40 w-10 h-10 rounded-full bg-amber-500/20 blur-xs" />

                    {/* Vector Grid line overlays */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(56,189,248,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.05)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

                    {/* Custom simulated landmarks */}
                    <div className="absolute top-16 left-28 text-[9px] font-mono text-red-400 font-bold bg-[#0A0E1A]/90 px-1.5 py-0.5 rounded border border-red-500/20 shadow">
                      🚨 FIRE - SECTOR 1
                    </div>
                    <div className="absolute bottom-24 right-20 text-[9px] font-mono text-amber-400 font-bold bg-[#0A0E1A]/90 px-1.5 py-0.5 rounded border border-amber-500/20 shadow">
                      ⚠️ DUST - KOEL ROAD
                    </div>

                    <span className="text-[10px] text-slate-600 font-mono absolute bottom-3 right-3 select-none">
                      AIS GIS CANVAS INTERFACE
                    </span>
                  </div>
                </div>
              </div>

              {/* THIRD MODULE ROW: ACTIVE INCIDENTS */}
              <div className="flex flex-col gap-4 text-left">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <h4 className="font-display font-bold text-base text-white">Active Incidents Nearby</h4>
                    <span className="text-[10px] text-slate-500 font-mono">NEIGHBORHOOD HAZARDS REALTIME CORRELATION</span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    {syncData?.incidents.length} listed
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {syncData?.incidents.map((inc) => (
                    <div key={inc.id} className="p-4 bg-slate-800/40 border border-slate-700/50 rounded-3xl flex flex-col justify-between gap-3 hover:border-blue-500/25 transition-all shadow-md">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[9px] font-bold text-slate-500 font-mono uppercase">
                            {inc.category}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                            inc.severity === "High" ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400"
                          }`}>
                            {inc.severity} Severity
                          </span>
                        </div>
                        <h5 className="font-semibold text-slate-200 text-sm mt-1">{inc.title}</h5>
                        <p className="text-xs text-slate-400 font-mono">{inc.location}</p>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-2 border-t border-slate-800/40 mt-1">
                        <span>{inc.distance}</span>
                        <span>{inc.timestamp}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: REPORTS PANEL */}
          {currentTab === "Reports" && (
            <motion.div
              key="tab-reports"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* METRIC COUNTERS ROW */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-800/40 border border-slate-700/50 p-4 rounded-2xl text-left shadow-md">
                  <span className="text-[9px] font-bold text-slate-500 font-mono uppercase">Total Reports</span>
                  <div className="text-2xl font-display font-black text-white mt-1">
                    {syncData?.userProfile.stats.reports || 42}
                  </div>
                </div>
                <div className="bg-slate-800/40 border border-slate-700/50 p-4 rounded-2xl text-left shadow-md">
                  <span className="text-[9px] font-bold text-slate-500 font-mono uppercase">Verified by AI</span>
                  <div className="text-2xl font-display font-black text-emerald-400 mt-1">
                    {syncData?.userProfile.stats.verified || 36}
                  </div>
                </div>
                <div className="bg-slate-800/40 border border-slate-700/50 p-4 rounded-2xl text-left shadow-md">
                  <span className="text-[9px] font-bold text-slate-500 font-mono uppercase">Under Review</span>
                  <div className="text-2xl font-display font-black text-orange-400 mt-1">
                    {syncData?.userProfile.stats.active || 4}
                  </div>
                </div>
                <div className="bg-slate-800/40 border border-slate-700/50 p-4 rounded-2xl text-left shadow-md">
                  <span className="text-[9px] font-bold text-slate-500 font-mono uppercase">Resolved Problems</span>
                  <div className="text-2xl font-display font-black text-sky-400 mt-1">
                    {syncData?.userProfile.stats.resolved || 32}
                  </div>
                </div>
              </div>

              {/* DYNAMIC ANALYTICS CHARTS SECTION */}
              <div className="space-y-3">
                <div className="text-left">
                  <h4 className="font-display font-extrabold text-lg text-white">Monthly Analytics</h4>
                  <p className="text-xs text-slate-500">Aggregate parameters and complaint distributions</p>
                </div>
                <AnalyticsCharts currentAqi={syncData?.weather.aqi} currentTemp={syncData?.weather.temp} />
              </div>

              {/* REPORT LOGS LIST PANEL */}
              <div className="space-y-4 text-left pt-2">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="flex flex-col">
                    <h4 className="font-display font-extrabold text-lg text-white">My Submissions</h4>
                    <span className="text-[10px] text-slate-500 font-mono">TRACKING THE ENVIRONMENTAL LEGACY</span>
                  </div>

                  {/* Filter Submissions */}
                  <div className="flex items-center gap-1.5 bg-[#0A0E1A]/80 p-1 rounded-xl border border-slate-700/50">
                    {(["All", "Pending", "Verified", "Resolved"] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setReportsFilter(type)}
                        className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                          reportsFilter === type
                            ? "bg-slate-800 text-blue-400"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {filteredIncidents.length > 0 ? (
                      filteredIncidents.map((inc) => (
                        <motion.div
                          key={inc.id}
                          layout
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="bg-slate-800/40 border border-slate-700/50 p-5 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md"
                        >
                          <div className="flex items-start gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                              <Compass className="w-5 h-5 text-blue-400" />
                            </div>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-200 text-sm">{inc.title}</span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/20">
                                  AI Match: {inc.matchRate}
                                </span>
                              </div>
                              <span className="text-xs text-slate-400 mt-1 font-mono">{inc.location}</span>
                              <p className="text-xs text-slate-500 mt-1 leading-normal max-w-xl">
                                {inc.description || `Environmental monitoring logs submitted. Citizen reports hazardous particulates detected nearby.`}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col sm:items-end gap-1.5 shrink-0 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold text-center ${
                              inc.status === "Resolved"
                                ? "bg-sky-500/15 text-sky-400"
                                : inc.status === "Under Verification"
                                ? "bg-orange-500/15 text-orange-400"
                                : "bg-teal-500/15 text-teal-400"
                            }`}>
                              {inc.status}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                              {inc.timestamp} • {inc.distance}
                            </span>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="py-12 bg-slate-800/20 border border-dashed border-slate-700/60 rounded-3xl text-center p-6 flex flex-col items-center justify-center">
                        <span className="text-slate-500 text-sm font-semibold">No incident reports found</span>
                        <p className="text-xs text-slate-600 mt-1">Adjust your filter options or submit a new environmental report.</p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: ALERTS/NOTIFICATIONS PANEL */}
          {currentTab === "Alerts" && (
            <motion.div
              key="tab-alerts"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              {syncData && (
                <NotificationsDrawer
                  alerts={syncData.alerts}
                  aiBriefing={aiBriefing || {
                    lastUpdated: "Just now",
                    aqiStatus: "Good Conditions",
                    recommendation: "Perfect air quality index. Rest comfortable.",
                    generalAqi: 54,
                    generalWeather: "Weather - 26°C • Humidity 64%"
                  }}
                  onRefreshBriefing={fetchAIBriefing}
                  onArchiveAlert={handleArchiveAlert}
                />
              )}
            </motion.div>
          )}

          {/* TAB 4: PROFILE/IMPACT PANEL */}
          {currentTab === "Profile" && syncData && (
            <motion.div
              key="tab-profile"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6 text-left"
            >
              {/* Hero Banner header block */}
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-lg">
                <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${syncData.userProfile.avatarColor} flex items-center justify-center shadow-lg`}>
                    <span className="text-xl font-bold text-slate-950 font-display">AB</span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 justify-center sm:justify-start">
                      <h3 className="font-display font-extrabold text-xl text-white">
                        {syncData.userProfile.name}
                      </h3>
                      <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[9px] font-bold rounded-full">
                        LEVEL {syncData.userProfile.level}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-mono mt-1">
                      Role: {syncData.userProfile.role} • Joined {syncData.userProfile.joined}
                    </span>
                  </div>
                </div>

                {/* Score Dial widget */}
                <div className="bg-[#0A0E1A]/80 p-4 rounded-2xl border border-slate-800/80 flex items-center gap-4 shadow-inner">
                  <div className="relative w-12 h-12 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90">
                      <circle cx="24" cy="24" r="20" stroke="#1e293b" strokeWidth="4" fill="transparent" />
                      <circle
                        cx="24"
                        cy="24"
                        r="20"
                        stroke="#10b981"
                        strokeWidth="4"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 20}
                        strokeDashoffset={(2 * Math.PI * 20) * (1 - syncData.userProfile.impactScore / 100)}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute font-mono font-bold text-xs text-emerald-400">
                      {syncData.userProfile.impactScore}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-500 font-mono font-bold uppercase">Green Impact Score</span>
                    <span className="text-xs text-slate-300 font-medium">Eco Guardian rank #4</span>
                  </div>
                </div>
              </div>

              {/* Achievements Badges Grid */}
              <div className="space-y-3">
                <div className="flex flex-col">
                  <h4 className="font-display font-extrabold text-base text-white">Achievement Badges</h4>
                  <span className="text-[10px] text-slate-500 font-mono">EARNED ENVIRONMENTAL LEGACY MILESTONES</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {syncData.userProfile.achievements.map((ach) => (
                    <div key={ach.id} className="p-3 bg-slate-800/40 border border-slate-700/50 rounded-2xl flex items-start gap-3 hover:border-blue-500/25 transition-all shadow-md">
                      <div className="text-2xl shrink-0 p-1 bg-slate-950/40 rounded-lg">
                        {ach.icon}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-xs text-slate-200 truncate">{ach.title}</span>
                        <span className="text-[9px] text-slate-500 mt-0.5 line-clamp-2">{ach.description}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activity Heatmap contribution calendar */}
              <div className="space-y-3">
                <div className="flex flex-col">
                  <h4 className="font-display font-extrabold text-base text-white">Rourkela Activity Heatmap</h4>
                  <span className="text-[10px] text-slate-500 font-mono">4-WEEK COMPLAINTS AND MONITORING ENGAGEMENT FREQUENCY</span>
                </div>

                <div className="bg-slate-800/40 border border-slate-700/50 p-4 rounded-3xl shadow-lg">
                  {/* Heatmap grid */}
                  <div className="grid grid-cols-7 gap-2">
                    {syncData.userProfile.heatmap.map((day) => {
                      let bg = "bg-[#0A0E1A]/80 border border-slate-800/50";
                      if (day.reportsCount === 1) bg = "bg-blue-950/40 text-blue-400 border border-blue-900/20";
                      if (day.reportsCount === 2) bg = "bg-blue-900/60 text-blue-300 border border-blue-800/30 shadow-sm";
                      if (day.reportsCount >= 3) bg = "bg-blue-500 text-slate-950 font-bold shadow-[0_0_10px_rgba(59,130,246,0.5)]";

                      return (
                        <div
                          key={day.day}
                          className={`h-9 rounded-lg flex items-center justify-center text-xs font-mono transition-all duration-300 relative group cursor-pointer ${bg}`}
                        >
                          {day.day}
                          {/* tooltip */}
                          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg text-[9px] tracking-wide whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-10">
                            Day {day.day}: {day.reportsCount} actions
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Core Settings list section */}
              <div className="space-y-3">
                <div className="flex flex-col">
                  <h4 className="font-display font-extrabold text-base text-white">System Settings</h4>
                  <span className="text-[10px] text-slate-500 font-mono">PREFERENCES AND AUTHORIZATIONS</span>
                </div>

                <div className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-5 divide-y divide-slate-700/30 text-xs shadow-lg">
                  {/* Dark Mode */}
                  <div className="flex items-center justify-between py-3">
                    <div className="flex flex-col text-left">
                      <span className="font-semibold text-slate-200">Aesthetic Dark Theme</span>
                      <span className="text-slate-500 text-[10px] font-mono mt-0.5">Toggle interface luminance</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={syncData.userProfile.settings.darkMode}
                      onChange={(e) => handleUpdateSettings("darkMode", e.target.checked)}
                      className="rounded accent-blue-500 bg-[#0A0E1A] border-slate-700 w-9 h-5 cursor-pointer"
                    />
                  </div>

                  {/* Language */}
                  <div className="flex items-center justify-between py-3">
                    <div className="flex flex-col text-left">
                      <span className="font-semibold text-slate-200">UI Translation Language</span>
                      <span className="text-slate-500 text-[10px] font-mono mt-0.5">Select local linguistic target</span>
                    </div>
                    <div className="relative">
                      <Languages className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-blue-400" />
                      <select
                        value={syncData.userProfile.settings.language}
                        onChange={(e) => handleUpdateSettings("language", e.target.value)}
                        className="pl-8 pr-3 py-1 bg-[#0A0E1A]/80 border border-slate-700/50 rounded-xl text-slate-200 focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
                      >
                        <option value="English">English</option>
                        <option value="Assamese">অসমীয়া (Assamese)</option>
                        <option value="Bengali">বাংলা (Bengali)</option>
                        <option value="Bodo">बर' (Bodo)</option>
                        <option value="Dogri">डोगरी (Dogri)</option>
                        <option value="Gujarati">ગુજરાતી (Gujarati)</option>
                        <option value="Hindi">हिंदी (Hindi)</option>
                        <option value="Kannada">ಕನ್ನಡ (Kannada)</option>
                        <option value="Kashmiri">कॉशुर (Kashmiri)</option>
                        <option value="Konkani">कोंकणी (Konkani)</option>
                        <option value="Maithili">मैथिली (Maithili)</option>
                        <option value="Malayalam">മലയാളം (Malayalam)</option>
                        <option value="Manipuri">ꯃꯩꯇꯩꯂꯣꯟ (Manipuri)</option>
                        <option value="Marathi">मराठी (Marathi)</option>
                        <option value="Nepali">नेपाली (Nepali)</option>
                        <option value="Odia">ଓଡ଼ିଆ (Odia)</option>
                        <option value="Punjabi">ਪੰਜਾਬੀ (Punjabi)</option>
                        <option value="Sanskrit">संस्कृतम् (Sanskrit)</option>
                        <option value="Santali">ᱥᱟᱱᱛᱟᱲᱤ (Santali)</option>
                        <option value="Sindhi">सिन्धी (Sindhi)</option>
                        <option value="Tamil">தமிழ் (Tamil)</option>
                        <option value="Telugu">తెలుగు (Telugu)</option>
                        <option value="Urdu">اردو (Urdu)</option>
                      </select>
                    </div>
                  </div>

                  {/* Push notifications permission */}
                  <div className="flex items-center justify-between py-3">
                    <div className="flex flex-col text-left">
                      <span className="font-semibold text-slate-200">Push Notifications Chime</span>
                      <span className="text-slate-500 text-[10px] font-mono mt-0.5">Activate background telemetry signals</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={syncData.userProfile.settings.notifications}
                      onChange={(e) => handleUpdateSettings("notifications", e.target.checked)}
                      className="rounded accent-blue-500 bg-[#0A0E1A] border-slate-700 w-9 h-5 cursor-pointer"
                    />
                  </div>

                  {/* Live Location GPS */}
                  <div className="flex items-center justify-between py-3">
                    <div className="flex flex-col text-left">
                      <span className="font-semibold text-slate-200">GPS Live Location Geotags</span>
                      <span className="text-slate-500 text-[10px] font-mono mt-0.5">Automate coordinates acquisition</span>
                    </div>
                    <button
                      onClick={() => {
                        const nextLoc = syncData.userProfile.settings.liveLocation === "granted" ? "denied" : "granted";
                        handleUpdateSettings("liveLocation", nextLoc);
                      }}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                        syncData.userProfile.settings.liveLocation === "granted"
                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/25"
                          : "bg-red-500/10 text-red-400 border border-red-500/25"
                      }`}
                    >
                      {syncData.userProfile.settings.liveLocation === "granted" ? "Granted" : "Denied"}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* FLOATING NAVIGATION BENTO-BAR (FOOTER MENU) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-md w-[calc(100%-2rem)]">
        <div className="bg-[#0A0E1A]/90 border border-slate-700/50 p-2.5 rounded-3xl shadow-2xl backdrop-blur-md flex items-center justify-between gap-2">
          {/* Tab Button: Home */}
          <button
            onClick={() => setCurrentTab("Home")}
            className={`flex-1 py-2 flex flex-col items-center justify-center gap-1.5 rounded-2xl transition-all cursor-pointer ${
              currentTab === "Home" ? "text-blue-400 bg-slate-800/50" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <HomeIcon className="w-5 h-5" />
            <span className="text-[9px] font-semibold tracking-wider uppercase font-mono">Home</span>
          </button>

          {/* Tab Button: Reports */}
          <button
            onClick={() => setCurrentTab("Reports")}
            className={`flex-1 py-2 flex flex-col items-center justify-center gap-1.5 rounded-2xl transition-all cursor-pointer ${
              currentTab === "Reports" ? "text-blue-400 bg-slate-800/50" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <ClipboardList className="w-5 h-5" />
            <span className="text-[9px] font-semibold tracking-wider uppercase font-mono">Reports</span>
          </button>

          {/* Tab Button: Central Plus button */}
          <button
            onClick={() => setShowReportModal(true)}
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-blue-500/20 active:scale-95 transition-all cursor-pointer shrink-0 -translate-y-4 border-4 border-[#0A0E1A]"
            title="Log Pollution Spot"
          >
            <Plus className="w-7 h-7 text-white stroke-[3]" />
          </button>

          {/* Tab Button: Alerts */}
          <button
            onClick={() => setCurrentTab("Alerts")}
            className={`flex-1 py-2 flex flex-col items-center justify-center gap-1.5 rounded-2xl transition-all cursor-pointer relative ${
              currentTab === "Alerts" ? "text-blue-400 bg-slate-800/50" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <Bell className="w-5 h-5" />
            {syncData && syncData.alerts.length > 0 && (
              <span className="absolute top-1 right-6 w-2 h-2 rounded-full bg-red-500 border border-slate-950 animate-ping" />
            )}
            <span className="text-[9px] font-semibold tracking-wider uppercase font-mono">Alerts</span>
          </button>

          {/* Tab Button: Profile */}
          <button
            onClick={() => setCurrentTab("Profile")}
            className={`flex-1 py-2 flex flex-col items-center justify-center gap-1.5 rounded-2xl transition-all cursor-pointer ${
              currentTab === "Profile" ? "text-blue-400 bg-slate-800/50" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <UserIcon className="w-5 h-5" />
            <span className="text-[9px] font-semibold tracking-wider uppercase font-mono">Profile</span>
          </button>
        </div>
      </div>

      {/* POLLUTION REPORTING OVERLAY MODAL */}
      {showReportModal && (
        <ReportModal
          onClose={() => setShowReportModal(false)}
          onSubmitReport={handleReportSubmit}
        />
      )}
    </div>
  );
}
