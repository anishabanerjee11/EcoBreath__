export interface WeatherTelemetry {
  temp: number;
  wind: number;
  humidity: number;
  sky: string;
  aqi: number;
  trend: "steady" | "rising" | "falling";
}

export interface SectorAqi {
  id: string;
  name: string;
  aqi: number;
  status: string;
  description: string;
}

export interface IncidentReport {
  id: string;
  title: string;
  category: string;
  location: string;
  matchRate: string;
  distance: string;
  severity: "Low" | "Medium" | "High";
  timestamp: string;
  status: "Under Verification" | "In Progress" | "Resolved" | "Rejected";
  description?: string;
  imageBase64?: string;
}

export interface AlertLog {
  id: string;
  title: string;
  category: string;
  location: string;
  timestamp: string;
  isNew: boolean;
  description: string;
  status: "active" | "archived";
}

export interface Achievement {
  id: string;
  title: string;
  icon: string;
  description: string;
}

export interface HeatmapDay {
  day: number;
  reportsCount: number;
}

export interface UserSettings {
  darkMode: boolean;
  language: string;
  liveLocation: "granted" | "denied" | "pending";
  notifications: boolean;
}

export interface UserProfile {
  name: string;
  level: number;
  role: string;
  impactScore: number;
  joined: string;
  avatarColor: string;
  stats: {
    reports: number;
    verified: number;
    active: number;
    resolved: number;
    areasHelped: number;
    citizensProtected: string;
    reductionContribution: string;
    accuracyRate: string;
  };
  achievements: Achievement[];
  heatmap: HeatmapDay[];
  settings: UserSettings;
}

export interface AIBriefing {
  lastUpdated: string;
  aqiStatus: string;
  recommendation: string;
  generalAqi: number;
  generalWeather: string;
}

export interface InitSyncData {
  weather: WeatherTelemetry;
  sectors: SectorAqi[];
  alerts: AlertLog[];
  incidents: IncidentReport[];
  userProfile: UserProfile;
}
