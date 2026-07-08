import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertLog, AIBriefing } from "../types";
import { ShieldAlert, Sparkles, RefreshCw, Trash2, CheckCircle2, MessageSquare, Filter, Search } from "lucide-react";

interface NotificationsDrawerProps {
  alerts: AlertLog[];
  aiBriefing: AIBriefing;
  onRefreshBriefing: () => Promise<void>;
  onArchiveAlert: (id: string) => Promise<void>;
}

export default function NotificationsDrawer({
  alerts,
  aiBriefing,
  onRefreshBriefing,
  onArchiveAlert,
}: NotificationsDrawerProps) {
  const [filter, setFilter] = useState<"All" | "Critical" | "Health">("All");
  const [search, setSearch] = useState("");
  const [refreshingBriefing, setRefreshingBriefing] = useState(false);

  const handleRefreshBriefing = async () => {
    setRefreshingBriefing(true);
    await onRefreshBriefing();
    setRefreshingBriefing(false);
  };

  const filteredAlerts = alerts.filter((alert) => {
    // Filter by type
    if (filter === "Critical" && alert.category !== "Critical") return false;
    if (filter === "Health" && alert.category !== "Health") return false;

    // Filter by search query
    if (search) {
      const query = search.toLowerCase();
      return (
        alert.title.toLowerCase().includes(query) ||
        alert.location.toLowerCase().includes(query) ||
        alert.description.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto px-2">
      {/* Search and Filters Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search active signals..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#0A0E1A]/85 border border-slate-700/50 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-2 bg-[#0A0E1A]/85 p-1 rounded-xl border border-slate-700/50">
          {(["All", "Critical", "Health"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                filter === type
                  ? "bg-slate-800 text-blue-400 shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* AI Daily Briefing Panel */}
      <div id="ai-daily-briefing-card" className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-6 relative overflow-hidden flex flex-col gap-4 shadow-lg">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-blue-400 font-mono tracking-wider uppercase">
                Live Environmental Intelligence
              </span>
              <h3 className="font-display font-bold text-base text-white">AI Daily Briefing</h3>
            </div>
          </div>

          <button
            onClick={handleRefreshBriefing}
            disabled={refreshingBriefing}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-[10px] font-semibold text-slate-300 rounded-lg active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 text-blue-400 ${refreshingBriefing ? "animate-spin" : ""}`} />
            Refresh Briefing
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* AQI status widget */}
          <div className="flex items-center gap-4 bg-[#0A0E1A]/85 p-4 rounded-2xl border border-slate-800/65 shadow-inner">
            <div className="text-center shrink-0">
              <div className="text-3xl font-display font-black text-blue-400">
                {aiBriefing.generalAqi}
              </div>
              <div className="text-[8px] text-slate-500 font-mono font-bold tracking-wider">AQI INDEX</div>
            </div>
            <div className="h-10 w-[1px] bg-slate-800" />
            <div className="flex flex-col text-left">
              <span className="text-[10px] text-slate-500 font-mono uppercase">AIR QUALITY STATUS</span>
              <span className="text-slate-200 font-bold text-sm">{aiBriefing.aqiStatus}</span>
              <span className="text-[11px] text-slate-400 mt-0.5">{aiBriefing.generalWeather}</span>
            </div>
          </div>

          {/* AI Recommendation details */}
          <div className="bg-[#0A0E1A]/85 p-4 rounded-2xl border border-slate-800/65 text-left flex flex-col justify-center shadow-inner">
            <span className="text-[10px] text-blue-400 font-mono font-bold uppercase tracking-wider flex items-center gap-1 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> AI RECOMMENDATION
            </span>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {aiBriefing.recommendation}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-2 pt-2 border-t border-slate-800/60">
          <span>SOURCE: GEMINI ENVIRO-INTELLIGENCE CORE</span>
          <span>UPDATED: {aiBriefing.lastUpdated}</span>
        </div>
      </div>

      {/* Priority Signals List */}
      <div className="flex flex-col gap-4 text-left">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h4 className="font-display font-extrabold text-lg text-white">Priority Signals</h4>
            <span className="text-[10px] text-slate-500 font-mono">SWIPE RIGHT OR CLICK TRASH TO ARCHIVE ALERT</span>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {filteredAlerts.length} active
          </span>
        </div>

        <AnimatePresence mode="popLayout">
          {filteredAlerts.length > 0 ? (
            <div className="space-y-3">
              {filteredAlerts.map((alert) => (
                <motion.div
                  key={alert.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 200 }}
                  className={`border p-4 rounded-2xl flex items-start gap-4 transition-all relative group shadow-md ${
                    alert.category === "Critical"
                      ? "bg-red-500/5 border-red-500/20 shadow-lg shadow-red-500/2"
                      : "bg-slate-800/40 border-slate-700/50"
                  }`}
                >
                  {/* Category icon indicators */}
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    alert.category === "Critical"
                      ? "bg-red-500/10 text-red-400"
                      : "bg-blue-500/10 text-blue-400"
                  }`}>
                    {alert.category === "Critical" ? (
                      <ShieldAlert className="w-5 h-5 animate-pulse" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5" />
                    )}
                  </div>

                  <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase font-mono ${
                          alert.category === "Critical"
                            ? "bg-red-500/10 text-red-400"
                            : "bg-blue-500/10 text-blue-400"
                        }`}>
                          {alert.category}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {alert.location}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap">
                        {alert.timestamp}
                      </span>
                    </div>

                    <h5 className="font-semibold text-slate-200 text-sm mt-1.5">{alert.title}</h5>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{alert.description}</p>
                  </div>

                  {/* Archive button */}
                  <button
                    onClick={() => onArchiveAlert(alert.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-all cursor-pointer"
                    title="Archive Signal"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-12 bg-slate-800/20 border border-dashed border-slate-700/60 rounded-3xl flex flex-col items-center justify-center text-center p-6 shadow-inner"
            >
              <div className="w-12 h-12 rounded-full bg-[#0A0E1A]/80 border border-slate-700/50 flex items-center justify-center mb-3">
                <MessageSquare className="w-5 h-5 text-slate-500" />
              </div>
              <h5 className="font-semibold text-slate-300 text-sm">All Clear! No alerts matched</h5>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Check back later or adjust filters to explore environmental telemetry.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
