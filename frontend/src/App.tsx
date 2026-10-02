/**
 * Root App — providers + router.
 * The Shell is the persistent frame; modules are lazy-loaded routes inside it.
 */

import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { BuildingProvider } from "./contexts/BuildingContext";
import { Shell } from "./modules/shell/Shell";
import { LoginPage } from "./pages/LoginPage";

// Lazy-load each module so the initial shell stays light
const OccupancyPage = lazy(() => import("./modules/occupancy_hvac/OccupancyPage"));
const DigitalTwinPage = lazy(() => import("./modules/digital_twin/DigitalTwinPage"));
const FaultsPage = lazy(() => import("./modules/fault_detection/FaultsPage"));
const GridSolarPage = lazy(() => import("./modules/grid_solar/GridSolarPage"));
const XaiPage = lazy(() => import("./modules/xai_nlq/XaiPage"));
const TenantPage = lazy(() => import("./modules/tenant_gamification/TenantPage"));

// NEW: Lazy load the admin page
const AdminPage = lazy(() => import("./pages/AdminPage"));

const PageLoader = () => (
  <div className="flex items-center justify-center py-24 text-slate-400">
    Loading module…
  </div>
);

// NEW: Interceptor to automatically route users to their correct starting page
const RoleBasedRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "tenant") return <Navigate to="/tenant" replace />;
  return <Navigate to="/dashboard" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <BuildingProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            {/* Everything under Shell requires auth (enforced inside Shell) */}
            <Route path="/" element={<Shell />}>
              {/* Replaced hardcoded dashboard redirect with the Role-Based Interceptor */}
              <Route index element={<RoleBasedRedirect />} />
              <Route path="dashboard" element={null} /> {/* CommandCenter rendered by Shell when path is /dashboard */}

              <Route
                path="admin"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <AdminPage />
                  </Suspense>
                }
              />

              <Route
                path="occupancy"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <OccupancyPage />
                  </Suspense>
                }
              />
              <Route
                path="digital-twin"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <DigitalTwinPage />
                  </Suspense>
                }
              />
              <Route
                path="faults"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <FaultsPage />
                  </Suspense>
                }
              />
              <Route
                path="grid-solar"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <GridSolarPage />
                  </Suspense>
                }
              />
              <Route
                path="xai"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <XaiPage />
                  </Suspense>
                }
              />
              <Route
                path="tenant"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <TenantPage />
                  </Suspense>
                }
              />
            </Route>

            {/* Catch-all route now utilizes the interceptor to safely redirect */}
            <Route path="*" element={<RoleBasedRedirect />} />
          </Routes>
        </BrowserRouter>
      </BuildingProvider>
    </AuthProvider>
  );
}