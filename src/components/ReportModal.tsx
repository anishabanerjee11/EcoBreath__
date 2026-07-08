import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Camera, Upload, AlertTriangle, MapPin, FileText, CheckCircle2, ShieldAlert, RefreshCw, Sparkles } from "lucide-react";

interface ReportModalProps {
  onClose: () => void;
  onSubmitReport: (reportData: {
    category: string;
    location: string;
    description: string;
    imageBase64?: string;
  }) => Promise<any>;
}

const CATEGORIES = [
  "Waste Burning",
  "Construction Dust",
  "Industrial Smoke",
  "Sewage Odor",
  "Vehicle Smog",
  "Other",
];

export default function ReportModal({ onClose, onSubmitReport }: ReportModalProps) {
  const [step, setStep] = useState<"choose" | "camera" | "form" | "analyzing" | "completed">("choose");
  const [category, setCategory] = useState("Waste Burning");
  const [location, setLocation] = useState("Sector 1 market road, Rourkela");
  const [description, setDescription] = useState("");
  const [imageBase64, setImageBase64] = useState<string>("");
  const [cameraActive, setCameraActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Auto-fill location if geolocation is available (simulated)
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // In real life, we would reverse-geocode. We'll use a polished local coordinate string
          const lat = position.coords.latitude.toFixed(4);
          const lng = position.coords.longitude.toFixed(4);
          setLocation(`Sector 1 near coordinate [${lat}, ${lng}]`);
        },
        () => {
          setLocation("Udit Nagar Sector Road, Rourkela");
        }
      );
    }
  }, []);

  // Simulate taking a photo by drawing a pollution scene on an HTML canvas
  const startCamera = () => {
    setStep("camera");
    setCameraActive(true);
  };

  const capturePhoto = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Clear canvas
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw sky
        ctx.fillStyle = "#334155";
        ctx.fillRect(0, 0, canvas.width, canvas.height - 80);

        // Draw industrial ground / road
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(0, canvas.height - 80, canvas.width, 80);

        // Draw smoky clouds (pollution source)
        const gradient = ctx.createRadialGradient(
          canvas.width / 2, canvas.height / 2 - 20, 10,
          canvas.width / 2, canvas.height / 2 - 40, 80
        );
        gradient.addColorStop(0, "rgba(239, 68, 68, 0.4)"); // Orange fire center
        gradient.addColorStop(0.3, "rgba(100, 116, 139, 0.8)"); // Thick grey smoke
        gradient.addColorStop(1, "rgba(30, 41, 59, 0)"); // Fading out

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2 - 30, 80, 0, Math.PI * 2);
        ctx.fill();

        // Draw some mock flame flares at center
        ctx.fillStyle = "#f97316"; // Orange
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2 - 20, canvas.height - 80);
        ctx.quadraticCurveTo(canvas.width / 2, canvas.height - 130, canvas.width / 2 + 10, canvas.height - 85);
        ctx.quadraticCurveTo(canvas.width / 2 + 30, canvas.height - 110, canvas.width / 2 + 40, canvas.height - 80);
        ctx.closePath();
        ctx.fill();

        // Draw HUD overlay text
        ctx.fillStyle = "#10b981";
        ctx.font = "bold 12px monospace";
        ctx.fillText("ECOBREATH SENSORY CAMERA v1.2", 15, 30);
        ctx.fillText(`GEO-TAG: ${location.substring(0, 24)}...`, 15, 50);
        ctx.fillText(`TIMESTAMP: ${new Date().toLocaleTimeString()}`, 15, 70);

        // Frame bounding box
        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = 2;
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

        // Save as base64 jpeg
        const base64 = canvas.toDataURL("image/jpeg", 0.8);
        setImageBase64(base64);
        setCameraActive(false);
        setStep("form");
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result as string);
        setStep("form");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep("analyzing");
    try {
      const result = await onSubmitReport({
        category,
        location,
        description: description || `Simulated report of ${category} observed at ${location}. Urgent assessment requested.`,
        imageBase64,
      });
      setAiAnalysisResult(result.aiResult);
      setStep("completed");
    } catch (err) {
      console.error(err);
      setStep("form");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div id="modal-content-card" className="w-full max-w-xl bg-[#0A0E1A] border border-slate-700/50 rounded-3xl shadow-2xl overflow-hidden relative">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-700/30">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold tracking-wider text-blue-400 font-mono uppercase">
              CITIZEN POLLUTION HOTSPOT LOG
            </span>
            <h3 className="font-display font-bold text-lg text-white">Quick Report Pollution</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Inner Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {/* STEP 1: CHOOSE PHOTO OR UPLOAD */}
            {step === "choose" && (
              <motion.div
                key="step-choose"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <p className="text-slate-300 text-sm leading-relaxed">
                  Help keep your neighborhood clean and breathable. Reporting pollution takes under 30 seconds and alerts city authorities immediately.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Option 1: Take Photo */}
                  <button
                    onClick={startCamera}
                    className="flex flex-col items-center justify-center text-center p-6 bg-slate-800/30 border-2 border-dashed border-blue-500/20 hover:border-blue-400/80 rounded-3xl group transition-all duration-200 cursor-pointer hover:shadow-lg hover:shadow-blue-500/5 active:scale-[0.98]"
                  >
                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Camera className="w-6 h-6 text-blue-400" />
                    </div>
                    <span className="font-semibold text-slate-200 text-sm">Take Photo</span>
                    <span className="text-[11px] text-slate-500 mt-1 max-w-[150px] leading-tight">
                      Capture smoke, fire, or dust in real-time.
                    </span>
                  </button>

                  {/* Option 2: Upload Saved Image */}
                  <label className="flex flex-col items-center justify-center text-center p-6 bg-slate-800/30 border-2 border-dashed border-slate-800 hover:border-sky-500/50 rounded-3xl group transition-all duration-200 cursor-pointer hover:shadow-lg hover:shadow-sky-500/5 active:scale-[0.98]">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div className="w-12 h-12 rounded-full bg-sky-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6 text-sky-400" />
                    </div>
                    <span className="font-semibold text-slate-200 text-sm">Upload Image</span>
                    <span className="text-[11px] text-slate-500 mt-1 max-w-[150px] leading-tight">
                      Attach a geotagged photo from your gallery.
                    </span>
                  </label>
                </div>

                {/* AI Note Banner */}
                <div className="p-3.5 bg-blue-500/5 border border-blue-500/20 rounded-2xl flex gap-3">
                  <ShieldAlert className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-slate-400 leading-normal">
                    <strong className="text-blue-400">AI Environmental Intelligence:</strong> Our built-in Gemini analyzer instantly cross-checks reports using image features, geographic sensor grids, and humidity patterns.
                  </p>
                </div>
              </motion.div>
            )}

            {/* STEP 2: SIMULATED VIEW FINDER */}
            {step === "camera" && (
              <motion.div
                key="step-camera"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4"
              >
                {/* Simulated Viewfinder Canvas */}
                <div className="w-full h-[240px] bg-slate-950 rounded-2xl border-2 border-blue-500/40 relative overflow-hidden flex items-center justify-center">
                  <canvas
                    ref={canvasRef}
                    width={480}
                    height={240}
                    className="w-full h-full object-cover rounded-xl"
                  />
                  {cameraActive && (
                    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4">
                      {/* Grid lines layout */}
                      <div className="absolute inset-0 border border-blue-500/10 grid grid-cols-3 grid-rows-3 pointer-events-none">
                        <div className="border-r border-b border-blue-500/10" />
                        <div className="border-r border-b border-blue-500/10" />
                        <div className="border-b border-blue-500/10" />
                        <div className="border-r border-b border-blue-500/10" />
                        <div className="border-r border-b border-blue-500/10" />
                        <div className="border-b border-blue-500/10" />
                      </div>
                      {/* Scanning line */}
                      <div className="w-full h-0.5 bg-blue-500/30 shadow shadow-blue-400/80 animate-bounce absolute top-1/2 left-0" />
                    </div>
                  )}
                </div>

                <div className="w-full text-left space-y-2.5">
                  <h4 className="font-semibold text-sm text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-400" /> Image Quality Guidelines:
                  </h4>
                  <ul className="grid grid-cols-2 gap-1.5 text-slate-400 text-xs font-mono">
                    <li className="flex items-center gap-1">✅ Visible & Centered</li>
                    <li className="flex items-center gap-1">✅ High-Contrast Lighting</li>
                    <li className="flex items-center gap-1">✅ Surroundings Captured</li>
                    <li className="flex items-center gap-1">✅ Minimal Blur</li>
                  </ul>
                </div>

                <div className="flex gap-3 w-full mt-2">
                  <button
                    onClick={() => setStep("choose")}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={capturePhoto}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/15 cursor-pointer"
                  >
                    Capture Hazard Image
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: SUBMIT FORM */}
            {step === "form" && (
              <motion.form
                key="step-form"
                onSubmit={handleSubmit}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Photo Mini-Preview */}
                {imageBase64 && (
                  <div className="relative w-full h-[120px] bg-slate-950 border border-slate-700/50 rounded-xl overflow-hidden flex items-center justify-center">
                    <img src={imageBase64} className="w-full h-full object-cover" alt="Captured" />
                    <button
                      type="button"
                      onClick={() => setImageBase64("")}
                      className="absolute top-2 right-2 p-1 bg-slate-950/80 hover:bg-slate-950 rounded-full text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Grid layout fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Category select */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Pollution Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0A0E1A]/90 border border-slate-700/50 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer appearance-none"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Location input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-sky-400" /> Location / Landmark
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      required
                      placeholder="Street, District"
                      className="w-full px-3 py-2 bg-[#0A0E1A]/90 border border-slate-700/50 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>

                {/* Description Textarea */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-blue-400" /> Detailed Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    rows={3}
                    placeholder="Describe the severity, scope of dust/waste burning, and nearby impacted populations..."
                    className="w-full px-3 py-2 bg-[#0A0E1A]/90 border border-slate-700/50 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep("choose")}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/10 cursor-pointer"
                  >
                    Submit Report to AI Validation
                  </button>
                </div>
              </motion.form>
            )}

            {/* STEP 4: ANALYZING LOADER */}
            {step === "analyzing" && (
              <motion.div
                key="step-analyzing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-10 gap-4"
              >
                <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-blue-500 animate-spin flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-blue-400 animate-pulse" />
                </div>
                <div className="text-center space-y-1">
                  <h4 className="font-display font-bold text-base text-white">AI Environmental Diagnostics Active</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Gemini is processing your imagery alongside localized humidity patterns to catalog environmental hazards...
                  </p>
                </div>
              </motion.div>
            )}

            {/* STEP 5: COMPLETED CONFIRMATION */}
            {step === "completed" && (
              <motion.div
                key="step-completed"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center text-center gap-5 py-4"
              >
                <div className="w-14 h-14 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-blue-400" />
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-display font-extrabold text-xl text-white">Report Logged & Verified!</h4>
                  <p className="text-xs text-slate-400 leading-normal max-w-sm mx-auto">
                    Thank you! Your environmental snapshot has been added to our shared neighborhood telemetry database.
                  </p>
                </div>

                {/* AI Summary card feedback */}
                {aiAnalysisResult && (
                  <div className="w-full bg-[#0A0E1A]/90 border border-slate-700/50 p-4 rounded-2xl space-y-2.5 text-left shadow-inner">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-blue-400 font-mono tracking-wider uppercase">
                        GEMINI AUDIT CARD
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20">
                        AI Match: {aiAnalysisResult.confidence}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 font-sans leading-relaxed">
                      {aiAnalysisResult.summary}
                    </p>
                    <div className="flex gap-6 text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-700/30">
                      <div>HAZARD: <strong className="text-amber-400">{aiAnalysisResult.hazardLevel}</strong></div>
                      <div>STATUS: <strong className="text-sky-400">Under Verification</strong></div>
                    </div>
                  </div>
                )}

                <button
                  onClick={onClose}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-755 border border-slate-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Return to Eco Dashboard
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
