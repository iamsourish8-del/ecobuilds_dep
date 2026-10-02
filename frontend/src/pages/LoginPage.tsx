import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Zap, Eye, EyeOff, Sun, Moon, ShieldCheck, UserCheck, Building } from "lucide-react";

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("facility@demo.com");
  const [password, setPassword] = useState("demo123");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Dark mode state for login page
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("ecobuilds-theme");
    return saved === "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
      localStorage.setItem("ecobuilds-theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("ecobuilds-theme", "light");
    }
  }, [isDarkMode]);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const autofill = (type: "tenant" | "facility" | "admin") => {
    if (type === "tenant") {
      setEmail("tenant@demo.com");
      setPassword("demo123");
    } else if (type === "facility") {
      setEmail("facility@demo.com");
      setPassword("demo123");
    } else if (type === "admin") {
      setEmail("admin@demo.com");
      setPassword("admin123");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 transition-colors duration-300 relative">
      {/* Top Right Dark Mode Toggle */}
      <button
        onClick={() => setIsDarkMode(!isDarkMode)}
        className="absolute top-6 right-6 p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-sm"
        title="Toggle Theme"
      >
        {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
      </button>

      <div className="max-w-md w-full space-y-8 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-emerald-100 dark:border-slate-800 shadow-xl transition-all">

        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20">
            <Zap className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">EcoBuilds</h1>
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mt-1 uppercase tracking-wider">Building Energy Intelligence Platform</p>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Energy · Comfort · Grid · Operations</p>
        </div>

        {/* Profile Quick-Fill Buttons */}
        <div className="space-y-2">
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center">Quick Profile Demo Fill</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => autofill("tenant")}
              className="flex flex-col items-center justify-center p-2.5 rounded-2xl border border-emerald-100 dark:border-slate-800 bg-emerald-50/40 dark:bg-slate-800/50 hover:bg-emerald-100/60 dark:hover:bg-slate-800 text-emerald-900 dark:text-emerald-300 text-xs font-medium transition cursor-pointer"
            >
              <UserCheck className="w-4 h-4 mb-1 text-emerald-600 dark:text-emerald-400" />
              Tenant
            </button>
            <button
              type="button"
              onClick={() => autofill("facility")}
              className="flex flex-col items-center justify-center p-2.5 rounded-2xl border border-emerald-100 dark:border-slate-800 bg-emerald-50/40 dark:bg-slate-800/50 hover:bg-emerald-100/60 dark:hover:bg-slate-800 text-emerald-900 dark:text-emerald-300 text-xs font-medium transition cursor-pointer"
            >
              <Building className="w-4 h-4 mb-1 text-emerald-600 dark:text-emerald-400" />
              Manager
            </button>
            <button
              type="button"
              onClick={() => autofill("admin")}
              className="flex flex-col items-center justify-center p-2.5 rounded-2xl border border-amber-100 dark:border-amber-900/30 bg-amber-50/40 dark:bg-amber-900/20 hover:bg-amber-100/60 dark:hover:bg-amber-900/30 text-amber-900 dark:text-amber-300 text-xs font-medium transition cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 mb-1 text-amber-600 dark:text-amber-400" />
              Super Admin
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Email address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition"
              placeholder="name@company.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white px-3.5 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-50 text-white font-medium py-3 text-sm transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? "Signing in..." : "Sign in to EcoBuilds"}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[11px] text-slate-400">
            Yuva Yodha Energy Tech Hackathon · Schneider Electric · Challenge 02
          </p>
        </div>

      </div>
    </div>
  );
};