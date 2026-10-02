import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { LayoutDashboard, Activity, Cpu, AlertTriangle, Sun, Brain, Trophy, ShieldAlert, Zap } from "lucide-react";
import clsx from "clsx";

export const Sidebar: React.FC = () => {
  const { user } = useAuth();

  const navItems = [
    { label: "Command Center", path: "/dashboard", icon: LayoutDashboard, roles: ["super_admin", "facility_manager", "maintenance"] },
    { label: "Occupancy HVAC", path: "/occupancy", icon: Activity, roles: ["super_admin", "facility_manager", "maintenance", "tenant"] },
    { label: "ECBC Digital Twin", path: "/digital-twin", icon: Cpu, roles: ["super_admin", "facility_manager", "maintenance", "tenant"] },
    { label: "Fault Detection", path: "/faults", icon: AlertTriangle, roles: ["super_admin", "facility_manager", "maintenance", "tenant"] },
    { label: "Solar & Grid", path: "/grid", icon: Sun, roles: ["super_admin", "facility_manager", "maintenance", "tenant"] },
    { label: "Explainable AI", path: "/xai", icon: Brain, roles: ["super_admin", "facility_manager", "tenant"] },
    { label: "Tenant Engagement", path: "/tenant", icon: Trophy, roles: ["super_admin", "facility_manager", "tenant"] },
    { label: "Admin Portal", path: "/admin", icon: ShieldAlert, roles: ["super_admin"] },
  ];

  const filteredNavItems = navItems.filter((item) => user && item.roles.includes(user.role));

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-screen sticky top-0 transition-colors duration-300">
      <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
          <Zap className="w-5 h-5" />
        </div>
        <div>
          {/* Text toggles between dark slate and white based on theme */}
          <span className="font-bold text-slate-900 dark:text-white tracking-tight transition-colors">EcoBuilds</span>
          <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-medium uppercase tracking-wider">Smart Buildings</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    // Inactive links now support light mode hover states
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                )
              }
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};