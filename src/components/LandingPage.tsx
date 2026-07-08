import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Leaf, ArrowRight, User, Mail, ShieldAlert, Sparkles, MapPin, Eye, EyeOff } from "lucide-react";

interface LandingPageProps {
  onOnboardComplete: (userData: { name: string; city: string }) => void;
}

export default function LandingPage({ onOnboardComplete }: LandingPageProps) {
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form Fields
  const [fullName, setFullName] = useState("Full Name");
  const [email, setEmail] = useState("YourEmail@gmail.com");
  const [mobile, setMobile] = useState("+91----------");
  const [city, setCity] = useState("Rourkela");
  const [password, setPassword] = useState("••••••••");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onOnboardComplete({
      name: isSignUp ? fullName : "User",
      city: city || "Rourkela",
    });
  };

  const handleGuestLogin = () => {
    onOnboardComplete({
      name: "Guest Explorer",
      city: "Rourkela",
    });
  };

  return (
    <div id="landing-container" className="min-h-screen bg-[#0A0E1A] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#111827] via-[#0A0E1A] to-[#05070f] text-slate-100 flex flex-col font-sans overflow-hidden relative">
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

      {/* Header Bar */}
      <header className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between z-10">
        <div id="logo-brand" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/15">
            <Leaf className="w-6 h-6 text-[#0A0E1A] stroke-[2.5]" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
            ECOBREATH
          </span>
        </div>

        {/* Desktop Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
          <a href="#impact" className="hover:text-blue-400 transition-colors">Impact</a>
          <a href="#ai" className="hover:text-blue-400 transition-colors flex items-center gap-1">
            <Sparkles className="w-4 h-4 text-blue-400" /> AI
          </a>
          <a href="#community" className="hover:text-blue-400 transition-colors">Community</a>
        </nav>

        <button
          onClick={() => {
            setIsSignUp(false);
            setShowAuthForm(true);
          }}
          className="px-5 py-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-sm font-medium rounded-xl transition-all duration-200 cursor-pointer"
        >
          Login
        </button>
      </header>

      {/* Main Hero & Split Content Grid */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center py-8 z-10">
        <AnimatePresence mode="wait">
          {!showAuthForm ? (
            /* HERO PROMO MODE */
            <motion.div
              key="hero-mode"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-7 flex flex-col items-start gap-6 text-left"
            >
              {/* AI Environmental Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/60 border border-blue-500/20 text-blue-400 text-xs font-semibold tracking-wide shadow-inner shadow-blue-500/5">
                <Sparkles className="w-3.5 h-3.5" />
                AI ENVIRONMENTAL INTELLIGENCE
              </div>

              {/* Title */}
              <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.1] text-white">
                Clean air starts <br />
                <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-400 bg-clip-text text-transparent">
                  with one report.
                </span>
              </h1>

              {/* Slogan details */}
              <p className="text-slate-400 text-base sm:text-lg max-w-xl leading-relaxed">
                ECOBREATH turns citizen reports into trusted environmental signals, helping communities detect pollution faster, track realtime micro-weather, and build healthier cities together.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto mt-2">
                <button
                  onClick={() => {
                    setIsSignUp(true);
                    setShowAuthForm(true);
                  }}
                  className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.98] transition-all cursor-pointer"
                >
                  Create account <ArrowRight className="w-5 h-5" />
                </button>

                <button
                  onClick={() => {
                    setIsSignUp(false);
                    setShowAuthForm(true);
                  }}
                  className="px-6 py-3.5 bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 text-white font-semibold rounded-xl flex items-center justify-center gap-2 hover:text-blue-400 active:scale-[0.98] transition-all cursor-pointer"
                >
                  Login to dashboard
                </button>
              </div>

              {/* Footer Trust badging */}
              <div className="flex items-center gap-6 mt-8 pt-8 border-t border-slate-800/80 w-full text-xs text-slate-500 font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  REALTIME TELEMETRY
                </div>
                <div>•</div>
                <div className="flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-sky-400" />
                  PUSH NOTIFICATIONS
                </div>
                <div>•</div>
                <div>LOCAL AUTHENTICATION</div>
              </div>
            </motion.div>
          ) : (
            /* AUTHENTICATION FORM MODE */
            <motion.div
              key="auth-form-mode"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-6 lg:col-start-4 w-full max-w-lg bg-[#0A0E1A]/95 border border-slate-700/50 p-8 rounded-3xl shadow-2xl relative"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Leaf className="w-5 h-5 text-blue-400" />
                  <span className="font-display font-semibold tracking-wide text-xs text-blue-400 uppercase">
                    ECOBREATH Auth
                  </span>
                </div>
                <button
                  onClick={() => setShowAuthForm(false)}
                  className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                >
                  ← Go back
                </button>
              </div>

              <div className="flex bg-[#05070f] p-1.5 rounded-xl border border-slate-700/30 mb-6">
                <button
                  type="button"
                  onClick={() => setIsSignUp(false)}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                    !isSignUp ? "bg-slate-800 text-white shadow" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => setIsSignUp(true)}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                    isSignUp ? "bg-slate-800 text-white shadow" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Sign Up
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="font-display font-bold text-2xl text-white">
                  {isSignUp ? "Join ECOBREATH" : "Welcome Back"}
                </h3>
                <p className="text-slate-400 text-xs mb-4">
                  {isSignUp
                    ? "Become part of a community using AI to build healthier and cleaner neighborhoods."
                    : "Sign in to continue protecting your community and helping cities breathe cleaner."}
                </p>

                {isSignUp && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        placeholder="John Doe"
                        className="w-full pl-11 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-200"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="you@example.com"
                      className="w-full pl-11 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-200"
                    />
                  </div>
                </div>

                {isSignUp && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">Mobile Number</label>
                      <input
                        type="text"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        placeholder="+91 XXXXX XXXXX"
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5">City Target</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <select
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-200 appearance-none"
                        >
                          <option value="Rourkela">Rourkela</option>
                          <option value="Delhi">Delhi</option>
                          <option value="Mumbai">Mumbai</option>
                          <option value="Bengaluru">Bengaluru</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-semibold text-slate-400">Password</label>
                    {!isSignUp && (
                      <a href="#forgot" className="text-xs text-blue-400 hover:underline">Forgot Password?</a>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                </div>

                {!isSignUp && (
                  <div className="flex items-center gap-2 py-1">
                    <input
                      type="checkbox"
                      id="remember"
                      defaultChecked
                      className="rounded accent-blue-500 bg-slate-950 border-slate-800 w-4 h-4"
                    />
                    <label htmlFor="remember" className="text-xs text-slate-400 select-none">
                      Remember me
                    </label>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-500/10 active:scale-[0.98]"
                >
                  {isSignUp ? "Sign Up" : "Login"} <ArrowRight className="w-4.5 h-4.5 stroke-[2.5]" />
                </button>
              </form>

              <div className="flex items-center gap-3 my-5 text-slate-600 text-xs font-semibold">
                <div className="flex-1 h-[1px] bg-slate-850" />
                <span>OR</span>
                <div className="flex-1 h-[1px] bg-slate-850" />
              </div>

              <div className="space-y-2.5">
                <button
                  onClick={handleGuestLogin}
                  className="w-full py-2.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-200 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Continue as Guest
                </button>
                <button
                  onClick={handleGuestLogin}
                  className="w-full py-2.5 bg-transparent hover:bg-slate-850 border border-dashed border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Continue with Google
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* HERO IMAGE CONTAINER (Right Splitting Grid) */}
        {!showAuthForm && (
          <div className="lg:col-span-5 h-[380px] lg:h-[480px] w-full flex items-center justify-center relative">
            {/* Pulsing visual circles */}
            <div className="absolute w-[240px] h-[240px] rounded-full bg-blue-500/5 animate-[ping_3s_infinite_linear]" />
            <div className="absolute w-[340px] h-[340px] rounded-full bg-indigo-500/5 animate-[ping_5s_infinite_linear]" />

            {/* Simulated environmental layout */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
              className="relative z-10 w-full max-w-[320px] h-[320px] bg-gradient-to-b from-[#0f172a]/80 to-[#0a0e1a]/90 border border-slate-700/40 rounded-[40px] shadow-2xl p-6 flex flex-col items-center justify-between overflow-hidden"
            >
              {/* Dynamic decorative leaf floats */}
              <div className="absolute top-8 right-10 text-blue-400 opacity-60 animate-bounce">🌱</div>
              <div className="absolute bottom-16 left-8 text-sky-400 opacity-40 animate-pulse text-sm">☁️</div>

              {/* Eco Logo Header */}
              <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/25 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-[10px] font-bold text-blue-400 tracking-wider uppercase font-mono">
                  Live Eco Tree
                </span>
              </div>

              {/* Beautiful Vector Tree Design with glowing segments */}
              <div className="relative w-40 h-40 flex items-center justify-center">
                {/* Tree foliage glows */}
                <div className="absolute top-2 w-32 h-32 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600/80 shadow-lg shadow-blue-500/20 flex items-center justify-center overflow-hidden">
                  {/* Styled internal branch nodes */}
                  <div className="absolute w-12 h-12 bg-blue-300/30 rounded-full blur-xs top-4 left-6" />
                  <div className="absolute w-8 h-8 bg-indigo-300/20 rounded-full blur-xs bottom-6 right-8" />
                </div>
                {/* Tree trunk */}
                <div className="absolute bottom-[-10px] w-6 h-16 bg-amber-800/80 rounded-t-lg shadow" />
                <div className="absolute bottom-[-10px] w-2 h-14 bg-amber-950/40 rounded-t-lg left-[calc(50%+2px)]" />
              </div>

              {/* Environmental Metrics mini-banner */}
              <div className="w-full bg-slate-950/80 border border-slate-800/60 p-2.5 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex flex-col items-start">
                  <span className="text-slate-500 font-medium text-[9px] font-mono">CURRENT AQI</span>
                  <span className="text-blue-400 font-display font-bold text-sm">54 - Good</span>
                </div>
                <div className="h-6 w-[1px] bg-slate-800" />
                <div className="flex flex-col items-end">
                  <span className="text-slate-500 font-medium text-[9px] font-mono">STATUS</span>
                  <span className="text-sky-400 font-bold text-[11px] uppercase">Stable</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </main>

      {/* Landing Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-4 border-t border-slate-800/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 z-10 font-mono mt-auto">
        <span>© 2026 ECOBREATH environmental intelligence. All rights reserved.</span>
        <div className="flex items-center gap-4">
          <a href="#terms" className="hover:text-slate-300">Terms of Use</a>
          <span>•</span>
          <a href="#privacy" className="hover:text-slate-300">Privacy Policy</a>
        </div>
      </footer>
    </div>
  );
}
