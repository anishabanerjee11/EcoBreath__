import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from "recharts";

// Mock historic daily data for Rourkela AQI & temperature
const historicData = [
  { day: "Mon", aqi: 110, temp: 24, humidity: 60 },
  { day: "Tue", aqi: 125, temp: 26, humidity: 62 },
  { day: "Wed", aqi: 138, temp: 28, humidity: 65 },
  { day: "Thu", aqi: 115, temp: 25, humidity: 63 },
  { day: "Fri", aqi: 126, temp: 26, humidity: 64 },
  { day: "Sat", aqi: 145, temp: 29, humidity: 68 },
  { day: "Sun", aqi: 120, temp: 27, humidity: 61 }
];

// Mock category distribution data
const categoryData = [
  { name: "Waste Burning", count: 18, color: "#f87171" },
  { name: "Construction Dust", count: 12, color: "#fbbf24" },
  { name: "Vehicle Smog", count: 8, color: "#38bdf8" },
  { name: "Sewage Odor", count: 5, color: "#a78bfa" },
  { name: "Industrial Smoke", count: 7, color: "#f472b6" },
  { name: "Others", count: 2, color: "#94a3b8" }
];

interface AnalyticsChartsProps {
  currentAqi?: number;
  currentTemp?: number;
}

export default function AnalyticsCharts({ currentAqi, currentTemp }: AnalyticsChartsProps) {
  // Dynamically update today's index in historic data if active parameters are supplied
  // We map over historicData to create a new array with cloned objects, avoiding mutating read-only constants.
  const chartData = historicData.map((item, index) => {
    if (index === 4) {
      return {
        ...item,
        aqi: currentAqi !== undefined ? currentAqi : item.aqi,
        temp: currentTemp !== undefined ? currentTemp : item.temp,
      };
    }
    return item;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
      {/* Chart 1: AQI & Temp Trend */}
      <div id="aqi-trend-chart-card" className="bg-slate-800/40 border border-slate-700/50 p-5 rounded-3xl flex flex-col gap-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h4 className="text-sm font-semibold text-slate-200">Weekly AQI & Temperature Trends</h4>
            <span className="text-[10px] text-slate-500 font-mono">LIVE SENSORY METRICS CORRELATION</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 font-medium text-blue-400">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400/20 border border-blue-400" />
              AQI
            </span>
            <span className="flex items-center gap-1.5 font-medium text-sky-400">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400/20 border border-sky-400" />
              Temp (°C)
            </span>
          </div>
        </div>

        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAqi" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
              <XAxis dataKey="day" stroke="#64748b" fontSize={10} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0A0E1A",
                  borderColor: "#334155",
                  borderRadius: "12px",
                  fontSize: "12px",
                  color: "#f8fafc"
                }}
              />
              <Area
                type="monotone"
                dataKey="aqi"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorAqi)"
              />
              <Area
                type="monotone"
                dataKey="temp"
                stroke="#38bdf8"
                strokeWidth={1.5}
                fillOpacity={1}
                fill="url(#colorTemp)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Category Distribution of Reports */}
      <div id="incidents-category-chart-card" className="bg-slate-800/40 border border-slate-700/50 p-5 rounded-3xl flex flex-col gap-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h4 className="text-sm font-semibold text-slate-200">Incident Distribution & Resolution</h4>
            <span className="text-[10px] text-slate-500 font-mono">COMMUNITY COMPLAINTS ANALYTICS</span>
          </div>
          <span className="text-xs bg-slate-900 border border-slate-700/50 px-2.5 py-1 rounded-lg text-slate-300 font-mono">
            42 Total Reports
          </span>
        </div>

        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0A0E1A",
                  borderColor: "#334155",
                  borderRadius: "12px",
                  fontSize: "12px",
                  color: "#f8fafc"
                }}
                cursor={{ fill: "rgba(255,255,255,0.05)" }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
