import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useBuilding } from "../../contexts/BuildingContext";
import { apiFetch } from "../../services/apiClient";
import { Sun, Moon, Bell, LogOut, Building2, Clock, CheckCircle, AlertTriangle } from "lucide-react";

export const TopBar: React.FC = () => {
  const { user, logout } = useAuth();
  const { activeBuilding, setActiveBuilding } = useBuilding() as any;

  const [buildingList, setBuildingList] = useState<any[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem("ecobuilds-theme") === "dark");
  const [currentTime, setCurrentTime] = useState(new Date());

  // Notification Drawer State
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: "Chiller Anomaly Detected", desc: "Chiller-1 power draw is +14% above baseline.", time: "10m ago", read: false, type: "warning" },
    { id: 2, title: "ECBC Audit Passed", desc: "Aspiria Campus successfully verified.", time: "2h ago", read: false, type: "success" },
  ]);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadBuildings = async () => {
      if (!user) return;
      try {
        const data = await apiFetch("/admin/buildings");
        if (Array.isArray(data)) {
          setBuildingList(data);
          if (!activeBuilding && data.length > 0) {
            setActiveBuilding(data[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch building list.", err);
      }
    };
    loadBuildings();
  }, [user, activeBuilding, setActiveBuilding]);

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

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Close notifications on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;
  const activeBldgObj = buildingList.find((b: any) => b.id === activeBuilding) || buildingList[0];

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 sticky top-0 z-50 transition-colors duration-300 shadow-sm">

      {/* LEFT COLUMN: Dropdown */}
      <div className="flex-1 flex justify-start">
        {user?.role !== "tenant" && (
          <div className="relative w-72">
            <select
              value={activeBuilding || ""}
              onChange={(e) => setActiveBuilding(e.target.value)}
              className="w-full appearance-none bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer shadow-sm transition-colors"
            >
              {user?.role === "super_admin" && <option value="">Global View (All Buildings)</option>}
              {buildingList.map((b: any) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        )}
      </div>

      {/* CENTER COLUMN: Tenant Badge */}
      <div className="flex-1 flex justify-center">
        {user?.role === "tenant" && (
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-bold text-sm bg-slate-100 dark:bg-slate-800/60 px-5 py-1.5 rounded-full border border-slate-200 dark:border-slate-700/80 shadow-sm">
            <Building2 className="w-4 h-4 text-emerald-500" />
            {buildingList.length > 0 ? activeBldgObj?.name : "Loading Facility..."}
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Controls, Beautified Clock, Notifications & Profile */}
      <div className="flex-1 flex items-center justify-end gap-4">

        {/* BEAUTIFIED CLOCK */}
        <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-slate-50 to-emerald-50/30 dark:from-slate-800/60 dark:to-emerald-950/20 border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-inner">
          <Clock className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
          <span>{currentTime.toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
            {currentTime.toLocaleTimeString("en-US", { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })}
          </span>
        </div>

        <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 transition-colors cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* INTERACTIVE NOTIFICATION BELL & DRAWER */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-400 hover:text-emerald-500 transition-colors relative cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 animate-bounce"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl py-3 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">Notifications</span>
                <button
                  onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))}
                  className="text-[10px] text-emerald-600 hover:underline font-semibold"
                >
                  Mark all read
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.length > 0 ? notifications.map(n => (
                  <div key={n.id} className={`p-3 transition-colors ${n.read ? 'opacity-60 bg-transparent' : 'bg-emerald-50/40 dark:bg-emerald-950/10'}`}>
                    <div className="flex items-start gap-2.5">
                      {n.type === 'warning' ? <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" /> : <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />}
                      <div className="flex-1">
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{n.title}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{n.desc}</p>
                        <span className="text-[9px] text-slate-400 mt-1 block">{n.time}</span>
                      </div>
                    </div>
                  </div>
                )) : (
                  <p className="text-xs text-slate-400 text-center py-4">No notifications.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Logout */}
        <div className="flex items-center gap-4 pl-4 border-l border-slate-200 dark:border-slate-700">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">{user?.full_name || "EcoBuilds User"}</p>
            <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold uppercase mt-1 tracking-widest">{user?.role?.replace("_", " ")}</p>
          </div>
          <button onClick={logout} className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors bg-slate-50 hover:bg-red-50 dark:bg-slate-800/80 dark:hover:bg-red-500/10 rounded-lg cursor-pointer" title="Sign Out">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

    </header>
  );
};