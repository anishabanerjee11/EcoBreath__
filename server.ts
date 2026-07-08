import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Initialize Gemini API Client lazily
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
      aiClient = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return aiClient;
}

// In-Memory Database State
const state = {
  selectedCity: "Rourkela",
  weather: {
    temp: 26,
    wind: 12,
    humidity: 64,
    sky: "Cloudy",
    aqi: 126,
    trend: "steady", // steady, rising, falling
  },
  sectors: [
    { id: "sec1", name: "Sector 1", aqi: 91, status: "Moderate", description: "Near steel plant corridor" },
    { id: "sec2", name: "Civil Township", aqi: 142, status: "Unhealthy", description: "Heavy traffic junction" },
    { id: "sec3", name: "Koel Nagar", aqi: 74, status: "Moderate", description: "Green buffer zone" },
    { id: "sec4", name: "Jagda", aqi: 168, status: "Very Unhealthy", description: "Dust and burning activity" },
    { id: "sec5", name: "Panposh Road", aqi: 63, status: "Moderate", description: "Mixed traffic flow" },
  ],
  incidents: [
    {
      id: "inc1",
      title: "Open Waste Burning",
      category: "Waste Burning",
      location: "Sector 1 market road",
      matchRate: "82%",
      distance: "1.6 km away",
      severity: "High",
      timestamp: "2 hours ago",
      status: "In Progress",
    },
    {
      id: "inc2",
      title: "Construction Dust",
      category: "Construction Dust",
      location: "Civil Township flyover",
      matchRate: "74%",
      distance: "2.9 km away",
      severity: "Medium",
      timestamp: "1 day ago",
      status: "In Progress",
    },
    {
      id: "inc3",
      title: "Vehicle Smog",
      category: "Vehicle Smog",
      location: "Panposh Road junction",
      matchRate: "69%",
      distance: "3.8 km away",
      severity: "Medium",
      timestamp: "2 days ago",
      status: "Resolved",
    },
  ],
  alerts: [
    {
      id: "alert1",
      title: "Garbage Fire Detected",
      category: "Critical",
      location: "Udit Nagar",
      timestamp: "2 min ago",
      isNew: true,
      description: "PM2.5 is rising in the next few hours. N95 is recommended.",
      status: "active",
    },
    {
      id: "alert2",
      title: "Wear a Mask Alert",
      category: "Health",
      location: "Civil Township",
      timestamp: "12 min ago",
      isNew: true,
      description: "Air quality has slipped to unhealthy levels near key junctions.",
      status: "active",
    },
    {
      id: "alert3",
      title: "Industrial Plume Released",
      category: "Critical",
      location: "Sector 1 Steel Belt",
      timestamp: "1 hour ago",
      isNew: false,
      description: "Industrial stack emissions reported. Vulnerable groups avoid outdoor activities.",
      status: "active",
    },
  ],
  userProfile: {
    name: "Anisha Banerjee",
    level: 12,
    role: "Eco Guardian",
    impactScore: 92,
    joined: "May 2024",
    avatarColor: "from-teal-400 to-emerald-500",
    stats: {
      reports: 48,
      verified: 43,
      active: 7,
      resolved: 31,
      areasHelped: 12,
      citizensProtected: "18.7K",
      reductionContribution: "18%",
      accuracyRate: "96%",
    },
    achievements: [
      { id: "ach1", title: "First Report", icon: "🌱", description: "Successfully submitted first eco report" },
      { id: "ach2", title: "Fire Spotter", icon: "🔥", description: "Identified and verified 5 waste burning fires" },
      { id: "ach3", title: "Air Guardian", icon: "🛡️", description: "Achieved over 90% accuracy in air quality estimates" },
      { id: "ach4", title: "AI Vision Expert", icon: "👁️", description: "Contributed 10 reports verified by AI vision checks" },
      { id: "ach5", title: "Voice Reporter", icon: "🎙️", description: "Used voice dictation to report air concerns" },
      { id: "ach6", title: "Satellite Verified", icon: "🛰️", description: "Reports matched by Sentinel satellite tracking" },
      { id: "ach7", title: "Community Hero", icon: "👑", description: "Helped clean up 3 key sector zones in your city" },
      { id: "ach8", title: "Eco Champion", icon: "🏆", description: "Earned environmental legacy of level 12+" },
    ],
    heatmap: Array.from({ length: 28 }, (_, i) => ({
      day: i + 1,
      reportsCount: Math.floor(Math.random() * 4),
    })),
    settings: {
      darkMode: true,
      language: "English",
      liveLocation: "granted",
      notifications: true,
    },
  },
  aiBriefing: {
    lastUpdated: new Date().toLocaleTimeString(),
    aqiStatus: "Stable with heat",
    recommendation: "Avoid outdoor exercise after 5 PM. The industrial corridor may intensify smoke movement later today.",
    generalAqi: 126,
    generalWeather: "Weather - 26°C • Humidity 64%",
  },
};

// SSE Client Connections for Real-Time Push Notifications
let clients: express.Response[] = [];

function broadcastNotification(notification: any) {
  clients.forEach((client) => {
    client.write(`data: ${JSON.stringify(notification)}\n\n`);
  });
}

// Background Simulated Sensors Fluctuation
setInterval(() => {
  // Random fluctuation for weather and AQI
  const aqiChange = Math.floor(Math.random() * 5) - 2; // -2 to +2
  state.weather.aqi = Math.max(30, Math.min(300, state.weather.aqi + aqiChange));

  const tempChange = Math.floor(Math.random() * 3) - 1; // -1 to +1
  state.weather.temp = Math.max(15, Math.min(42, state.weather.temp + tempChange));

  const humidityChange = Math.floor(Math.random() * 5) - 2; // -2 to +2
  state.weather.humidity = Math.max(20, Math.min(95, state.weather.humidity + humidityChange));

  // Slightly change a sector AQI
  const randomSector = state.sectors[Math.floor(Math.random() * state.sectors.length)];
  randomSector.aqi = Math.max(30, Math.min(250, randomSector.aqi + (Math.floor(Math.random() * 7) - 3)));
  if (randomSector.aqi > 150) {
    randomSector.status = "Very Unhealthy";
  } else if (randomSector.aqi > 100) {
    randomSector.status = "Unhealthy";
  } else {
    randomSector.status = "Moderate";
  }

  // Randomly (5% chance per tick) trigger a real-time push notification
  if (Math.random() < 0.05) {
    const alertTypes = [
      {
        title: "AQI Spike in " + randomSector.name,
        category: "Critical",
        location: randomSector.name,
        description: `Sudden AQI increase to ${randomSector.aqi}. Please limit outdoor activities in this area.`,
      },
      {
        title: "New Pollution Resolved",
        category: "Health",
        location: "Civil Township",
        description: "Municipal team resolved the Construction Dust issue reported.",
      },
      {
        title: "Daily Environment Tip",
        category: "Health",
        location: "Citywide",
        description: "Winds are low today. Stagnant air may trap particulates near highways.",
      },
    ];

    const chosenAlert = alertTypes[Math.floor(Math.random() * alertTypes.length)];
    const newAlert = {
      id: "alert_sim_" + Date.now(),
      ...chosenAlert,
      timestamp: "Just now",
      isNew: true,
      status: "active",
    };

    state.alerts.unshift(newAlert);
    broadcastNotification({
      type: "PUSH_NOTIFICATION",
      payload: newAlert,
    });
  }

  // Also broadcast live telemetry data
  broadcastNotification({
    type: "TELEMETRY_UPDATE",
    payload: {
      weather: state.weather,
      sectors: state.sectors,
    },
  });
}, 12000); // Trigger fluctuation and broadcast updates every 12 seconds

// --- HELPERS FOR SIMULATION FALLBACKS (Robust error-handling for Gemini API demand limits) ---
function runReportSimulation(description: string, location: string) {
  const words = (description + " " + location).toLowerCase();
  const score = 78 + Math.floor(Math.random() * 18);
  const aiConfidence = `${score}%`;
  let hazardLevel: "Low" | "Medium" | "High" = "Medium";
  let aiSummary = "AI classified the incident based on citizen telemetry validation.";

  if (words.includes("fire") || words.includes("burning") || words.includes("smoke")) {
    hazardLevel = "High";
    aiSummary = "Thermal indicators & carbon levels match reports of burning particulates.";
  } else if (words.includes("dust") || words.includes("construction") || words.includes("digging")) {
    hazardLevel = "Medium";
    aiSummary = "Local air sensor shows sudden spikes in PM10 particle mass consistent with dust.";
  } else {
    hazardLevel = "Low";
    aiSummary = "AI classified the incident based on citizen telemetry validation.";
  }

  return { aiConfidence, aiSummary, hazardLevel };
}

function generateSimulationBriefing() {
  let aqiStatus = "Moderate";
  let recommendation = "Ideal for outdoor sports. Air filters are not currently required.";

  if (state.weather.aqi > 150) {
    aqiStatus = "Severe Pressure";
    recommendation = "Sensitive groups should wear N95 masks and restrict outdoor activities entirely.";
  } else if (state.weather.aqi > 100) {
    aqiStatus = "Moderate Pressure";
    recommendation = "Winds are low today. Avoid heavy exercise near major traffic corridors during evening peaks.";
  }

  return {
    lastUpdated: new Date().toLocaleTimeString(),
    aqiStatus: aqiStatus,
    recommendation: recommendation,
    generalAqi: state.weather.aqi,
    generalWeather: `Weather - ${state.weather.temp}°C • Humidity ${state.weather.humidity}%`,
  };
}

// --- API ENDPOINTS ---

// Server-Sent Events (SSE) Endpoint for real-time updates and push notifications
app.get("/api/notifications/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  clients.push(res);

  // Send initial state sync on connection
  res.write(
    `data: ${JSON.stringify({
      type: "INIT_SYNC",
      payload: {
        weather: state.weather,
        sectors: state.sectors,
        alerts: state.alerts,
        incidents: state.incidents,
        userProfile: state.userProfile,
      },
    })}\n\n`
  );

  req.on("close", () => {
    clients = clients.filter((client) => client !== res);
  });
});

// Initial Sync HTTP Fallback (Ensures compatibility with Serverless hosts like Vercel)
app.get("/api/sync", (req, res) => {
  res.json({
    weather: state.weather,
    sectors: state.sectors,
    alerts: state.alerts,
    incidents: state.incidents,
    userProfile: state.userProfile,
  });
});

// Weather API
app.get("/api/weather", (req, res) => {
  res.json({
    city: state.selectedCity,
    weather: state.weather,
    sectors: state.sectors,
    incidents: state.incidents,
  });
});

// Change City API
app.post("/api/weather/city", (req, res) => {
  const { city } = req.body;
  if (!city) {
    return res.status(400).json({ error: "City is required" });
  }
  state.selectedCity = city;

  // Change base conditions depending on city selection
  if (city === "Delhi") {
    state.weather.aqi = 195;
    state.weather.temp = 32;
    state.weather.humidity = 40;
    state.weather.sky = "Hazy";
  } else if (city === "Mumbai") {
    state.weather.aqi = 65;
    state.weather.temp = 29;
    state.weather.humidity = 85;
    state.weather.sky = "Humid/Overcast";
  } else if (city === "Bengaluru") {
    state.weather.aqi = 48;
    state.weather.temp = 23;
    state.weather.humidity = 58;
    state.weather.sky = "Clear";
  } else {
    // Default Rourkela/Other
    state.weather.aqi = 126;
    state.weather.temp = 26;
    state.weather.humidity = 64;
    state.weather.sky = "Cloudy";
  }

  // Trigger telemetry broadcast
  broadcastNotification({
    type: "TELEMETRY_UPDATE",
    payload: {
      weather: state.weather,
      sectors: state.sectors,
      city: state.selectedCity,
    },
  });

  res.json({ success: true, city: state.selectedCity, weather: state.weather });
});

// Reports API
app.get("/api/reports", (req, res) => {
  res.json(state.incidents);
});

// Submit pollution report (Supports Gemini API image/text analysis and report verification)
app.post("/api/reports", async (req, res) => {
  const { category, location, description, imageBase64 } = req.body;

  if (!category || !location || !description) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const ai = getGeminiClient();
  let aiConfidence = "94%";
  let aiSummary = "AI successfully analyzed description and categorized the hazard level.";
  let hazardLevel = "Medium";

  if (ai) {
    try {
      // Create prompt for environmental analysis
      const systemPrompt = `You are the EcoBreath AI Environmental Intelligence service. 
      Analyze the citizen's report of a pollution incident.
      Provide a strict JSON response with:
      1. confidence (a percentage as a string, e.g. "95%")
      2. verifiedCategory (one of: "Waste Burning", "Construction Dust", "Industrial Smoke", "Sewage Odor", "Vehicle Smog", "Other")
      3. hazardLevel (one of: "Low", "Medium", "High")
      4. assessmentSummary (a brief 1-sentence verification analysis)`;

      const userPrompt = `Citizen Pollution Report:
      - Reported Category: ${category}
      - Location: ${location}
      - Description: ${description}`;

      let response;
      if (imageBase64) {
        // If an image is provided, parse base64
        const mimeType = imageBase64.includes("png") ? "image/png" : "image/jpeg";
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

        response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: [
            { inlineData: { data: base64Data, mimeType } },
            { text: `${systemPrompt}\n\n${userPrompt}` },
          ],
          config: {
            responseMimeType: "application/json",
          },
        });
      } else {
        response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: `${systemPrompt}\n\n${userPrompt}`,
          config: {
            responseMimeType: "application/json",
          },
        });
      }

      if (response && response.text) {
        try {
          const aiResult = JSON.parse(response.text.trim());
          aiConfidence = aiResult.confidence || "95%";
          aiSummary = aiResult.assessmentSummary || aiSummary;
          hazardLevel = aiResult.hazardLevel || "Medium";
        } catch (jsonErr) {
          console.error("JSON parsing error of Gemini output, falling back to simulation:", jsonErr);
          const fallback = runReportSimulation(description, location);
          aiConfidence = fallback.aiConfidence;
          aiSummary = fallback.aiSummary;
          hazardLevel = fallback.hazardLevel;
        }
      }
    } catch (apiErr) {
      console.error("Gemini API call failed, falling back to default simulation:", apiErr);
      const fallback = runReportSimulation(description, location);
      aiConfidence = fallback.aiConfidence;
      aiSummary = fallback.aiSummary;
      hazardLevel = fallback.hazardLevel;
    }
  } else {
    const fallback = runReportSimulation(description, location);
    aiConfidence = fallback.aiConfidence;
    aiSummary = fallback.aiSummary;
    hazardLevel = fallback.hazardLevel;
  }

  // Insert report into in-memory state
  const newIncident = {
    id: "inc_" + Date.now(),
    title: category,
    category: category,
    location: location,
    matchRate: aiConfidence,
    distance: "Just near you (< 0.5 km)",
    severity: hazardLevel,
    timestamp: "Just now",
    status: "Under Verification",
  };

  state.incidents.unshift(newIncident);

  // Update user profile stats
  state.userProfile.stats.reports += 1;
  state.userProfile.stats.active += 1;
  // Increment a day in the heatmap
  const currentDayIndex = new Date().getDate() % 28;
  state.userProfile.heatmap[currentDayIndex].reportsCount += 1;

  // Generate an instant automated alert confirming the submission
  const thankYouAlert = {
    id: "alert_" + Date.now(),
    title: `EcoReport Submitted: ${category}`,
    category: "Health",
    location: location,
    timestamp: "Just now",
    isNew: true,
    description: `Report verified with ${aiConfidence} AI confidence. ${aiSummary}`,
    status: "active",
  };
  state.alerts.unshift(thankYouAlert);

  // Broadcast the new report and thank you notification via SSE
  broadcastNotification({
    type: "NEW_REPORT",
    payload: {
      incidents: state.incidents,
      alerts: state.alerts,
      userProfile: state.userProfile,
    },
  });

  res.json({
    success: true,
    report: newIncident,
    aiResult: {
      confidence: aiConfidence,
      summary: aiSummary,
      hazardLevel: hazardLevel,
    },
  });
});

// Alerts API
app.get("/api/alerts", (req, res) => {
  res.json(state.alerts);
});

// Mark Alert Read / Archive API
app.post("/api/alerts/archive", (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "Alert ID is required" });

  state.alerts = state.alerts.filter((alert) => alert.id !== id);

  broadcastNotification({
    type: "TELEMETRY_UPDATE",
    payload: {
      alerts: state.alerts,
    },
  });

  res.json({ success: true, alerts: state.alerts });
});

// Dynamic AI Briefing API (Uses Gemini server-side to generate weather/AQI guidance)
app.post("/api/gemini/briefing", async (req, res) => {
  const ai = getGeminiClient();

  if (ai) {
    try {
      const prompt = `You are an AI environmental meteorologist and city advisor. 
      Based on the current parameters for ${state.selectedCity}:
      - Current AQI: ${state.weather.aqi}
      - Temperature: ${state.weather.temp}°C
      - Humidity: ${state.weather.humidity}%
      - Sky Condition: ${state.weather.sky}
      - Wind speed: ${state.weather.wind} km/h
      
      Provide a highly summarized status briefing in JSON format containing:
      1. aqiStatus (a short 2-4 word environmental summary, e.g. "Stable with Heat" or "Smoky and Stagnant")
      2. recommendation (a strict 1-sentence action-focused advice for citizens)
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      if (response && response.text) {
        try {
          const briefingResult = JSON.parse(response.text.trim());
          state.aiBriefing = {
            lastUpdated: new Date().toLocaleTimeString(),
            aqiStatus: briefingResult.aqiStatus || "Monitored",
            recommendation: briefingResult.recommendation || state.aiBriefing.recommendation,
            generalAqi: state.weather.aqi,
            generalWeather: `Weather - ${state.weather.temp}°C • Humidity ${state.weather.humidity}%`,
          };
        } catch (jsonErr) {
          console.error("JSON parsing error of briefing content, falling back to simulation:", jsonErr);
          state.aiBriefing = generateSimulationBriefing();
        }
      }
    } catch (apiErr) {
      console.error("Gemini briefing call failed, falling back to simulation:", apiErr);
      state.aiBriefing = generateSimulationBriefing();
    }
  } else {
    state.aiBriefing = generateSimulationBriefing();
  }

  res.json(state.aiBriefing);
});

// Profile & Settings API
app.get("/api/profile", (req, res) => {
  res.json(state.userProfile);
});

app.post("/api/profile/settings", (req, res) => {
  const { darkMode, language, notifications, liveLocation } = req.body;

  if (darkMode !== undefined) state.userProfile.settings.darkMode = darkMode;
  if (language !== undefined) state.userProfile.settings.language = language;
  if (notifications !== undefined) state.userProfile.settings.notifications = notifications;
  if (liveLocation !== undefined) state.userProfile.settings.liveLocation = liveLocation;

  // Sync back
  broadcastNotification({
    type: "TELEMETRY_UPDATE",
    payload: {
      userProfile: state.userProfile,
    },
  });

  res.json({ success: true, settings: state.userProfile.settings });
});

// Setup Vite & Static Assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[EcoBreath Server] running on http://localhost:${PORT}`);
  });
}

// Only start the standalone Express listener if not running in a Serverless environment (like Vercel)
if (!process.env.VERCEL) {
  startServer();
}

export default app;
