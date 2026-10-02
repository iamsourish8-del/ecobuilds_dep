import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, LogOut, ChevronDown, Zap, Sun, Moon, Clock } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useBuilding } from "../../contexts/BuildingContext";
import { apiFetch } from "../../services/apiClient";

export const TopBar: React.FC = () => {
  const { user, logout } = useAuth();
  const { activeBuilding, setActiveBuilding } = useBuilding();
  const navigate = useNavigate();

  const [showNotifications, setShowNotifications] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState<string>("");
  const [dynamicBuildingNames, setDynamicBuildingNames] = useState<Record<string, string>>({});

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem("ecobuilds-theme");
    if (!savedTheme) {
      localStorage.setItem("ecobuilds-theme", "light");
      return false;
    }
    return savedTheme === "dark";
  });

  useEffect(() => {
    if (user) {
      apiFetch("/bff/buildings/lookup")
        .then((data: any[]) => {
          const mapping: Record<string, string> = {};
          data.forEach(b => mapping[b.id] = b.name);
          setDynamicBuildingNames(mapping);
        })
        .catch(console.error);
    }
  }, [user]);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const optionsDate: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric" };
      const optionsTime: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit", hour12: true };
      setCurrentDateTime(`${now.toLocaleDateString("en-US", optionsDate)} • ${now.toLocaleTimeString("en-US", optionsTime)}`);
    };
    updateClock();
    const timer = setInterval(updateClock, 30000);
    return () => clearInterval(timer);
  }, []);

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

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-emerald-100 dark:border-slate-800 transition-colors duration-200">
      <div className="h-16 px-4 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">

        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <span className="md:hidden inline-flex items-center gap-1 text-sm font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap flex-shrink-0">
            <Zap className="w-4 h-4" /> EcoBuilds
          </span>
          {user && (user.building_ids.length > 0 || user.role === "super_admin") && (
            <div className="relative min-w-0">
              <select
                value={activeBuilding || ""}
                onChange={(e) => setActiveBuilding(e.target.value)}
                className="appearance-none bg-emerald-50/80 dark:bg-slate-800 border border-emerald-100 dark:border-slate-700 rounded-lg pl-3 pr-8 py-2 text-sm font-medium text-emerald-950 dark:text-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer max-w-[150px] sm:max-w-[260px] truncate shadow-sm transition-colors"
              >
                {/* SUPER ADMIN GLOBAL ALL BUILDINGS OPTION */}
                {user.role === "super_admin" && (
                  <option value="ALL">🌐 All Buildings (Global View)</option>
                )}
                {user.building_ids.map((id) => (
                  <option key={id} value={id}>
                    {dynamicBuildingNames[id] || id}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600/60 pointer-events-none" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
          {currentDateTime && (
            <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 bg-emerald-100/50 dark:bg-slate-800/80 border border-emerald-200/60 dark:border-slate-600 shadow-sm rounded-xl text-sm font-semibold text-emerald-950 dark:text-emerald-100 transition-all">
              <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="tracking-wide">{currentDateTime}</span>
            </div>
          )}

          <button onClick={() => setIsDarkMode(p => !p)} className="p-1.5 sm:p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none">
            {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
          </button>

          <div className="relative">
            <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-1.5 sm:p-2 rounded-xl text-emerald-700/70 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 focus:outline-none transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
            </button>
          </div>

          <div className="hidden sm:flex flex-col items-end border-l border-slate-200 dark:border-slate-700 pl-4">
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight">{user?.full_name}</span>
            <span className="text-xs font-medium text-emerald-700/70 dark:text-emerald-400/80 capitalize">{user?.role?.replace("_", " ")}</span>
          </div>

          <button onClick={() => { logout(); navigate("/login"); }} className="p-1.5 sm:p-2 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};