import React, { useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useBuilding } from "../../contexts/BuildingContext";
import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";
import { CommandCenter } from "./CommandCenter";
import { SkeletonDashboard } from "./SkeletonDashboard";

export const Shell: React.FC = () => {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { activeBuilding, setActiveBuilding } = useBuilding();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate("/login", { replace: true });
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (user?.building_ids?.length && !activeBuilding) {
      const last = localStorage.getItem("lastBuildingId");
      const id = last && user.building_ids.includes(last) ? last : user.building_ids[0];
      setActiveBuilding(id);
    }
  }, [user, activeBuilding, setActiveBuilding]);

  if (authLoading || !isAuthenticated) return <SkeletonDashboard />;

  const isHome = location.pathname === "/" || location.pathname === "/dashboard";

  // Switched bg-slate-50 to bg-emerald-50/50 for the slight green tint
  return (
    <div className="min-h-screen flex flex-col bg-emerald-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <TopBar />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            {isHome ? <CommandCenter /> : <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
};