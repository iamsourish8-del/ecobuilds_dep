import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBuilding } from "../../contexts/BuildingContext";
import { fetchDashboardSummary } from "../../services/bffApi";
import { ModuleCard } from "../../components/ModuleCard";
import { AlertBanner } from "../../components/AlertBanner";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Leaf, IndianRupee, Zap, Users, AlertTriangle, Sun } from "lucide-react";
import { PerformancePillarsStrip } from "../../components/PerformancePillarsStrip";
import { BuildingMap } from "../../components/BuildingMap";

export const CommandCenter: React.FC = () => {
  const { activeBuilding } = useBuilding();
  const [summary, setSummary] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!activeBuilding) return;
    let cancelled = false;
    fetchDashboardSummary(activeBuilding)
      .then((d) => { if (!cancelled) setSummary(d); })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [activeBuilding]);

  if (error) return <div className="rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 p-4 text-red-700 dark:text-red-400 text-sm">{error}</div>;
  if (!summary) return <div className="py-16 text-center text-slate-400">Loading building intelligence…</div>;

  const k = summary.kpis || {};
  const m = summary.modules || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">{summary.building_name}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {summary.city} · {summary.area_m2?.toLocaleString()} m² · {summary.floors} floors · Live building overview
        </p>
      </div>

      <div>
        <h2 className="text-xs font-medium text-emerald-800/60 dark:text-emerald-400/60 uppercase tracking-wide mb-2">Performance pillars</h2>
        <PerformancePillarsStrip
          metrics={{
            energy_label: `Solar + peak shave · ${k.savings_pct_week ?? 30}% week cut`,
            iaq_label: "IAQ OK · CO2 dilution on demand",
            water_label: "Cooling tower aware · greywater ready",
            carbon_label: `${k.co2_avoided_kg ?? 338} kg CO2 avoided today`,
            space_label: `${k.occupied_pct ?? 58}% zone use · daylight harvest`,
          }}
        />
        <p className="text-[10px] text-slate-400 mt-2">Aligned with ECBC commercial baselines, occupant comfort, and measurable kWh reduction.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <Kpi icon={<Zap className="w-4 h-4" />} label="Today energy" value={`${k.energy_today_kwh} kWh`} />
        <Kpi icon={<Leaf className="w-4 h-4" />} label="Saved today" value={`${k.savings_today_kwh} kWh`} accent />
        <Kpi icon={<IndianRupee className="w-4 h-4" />} label="INR saved today" value={`₹${k.savings_today_inr?.toLocaleString()}`} accent />
        <Kpi icon={<Users className="w-4 h-4" />} label="Occupied" value={`${k.occupied_pct}%`} />
        <Kpi icon={<Sun className="w-4 h-4" />} label="Self-consumption" value={`${k.self_consumption_pct}%`} />
        <Kpi icon={<AlertTriangle className="w-4 h-4" />} label="Open faults" value={k.open_faults} warn={k.open_faults > 0} />
      </div>

      {summary.active_alerts?.length > 0 && (
        <div className="space-y-2">
          {summary.active_alerts.map((a: any) => (
            <AlertBanner key={a.id} severity={a.severity} message={a.message} module={a.module} />
          ))}
        </div>
      )}

      <div>
        <h2 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Modules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <ModuleCard title="Occupancy HVAC" status={m.occupancy_hvac?.status} primary={m.occupancy_hvac?.label} onClick={() => navigate("/occupancy")} />
          <ModuleCard title="ECBC Digital Twin" status={m.digital_twin?.status} primary={`EPI ${m.digital_twin?.epi}`} secondary={`Target ${m.digital_twin?.target_epi}`} detail={m.digital_twin?.label} onClick={() => navigate("/digital-twin")} />
          <ModuleCard title="Fault Detection" status={m.fault_detection?.status} primary={m.fault_detection?.label} onClick={() => navigate("/faults")} />
          <ModuleCard title="Solar & Grid" status={m.grid_solar?.status} primary={`${m.grid_solar?.self_consumption_pct}% self-use`} secondary={`Battery ${m.grid_solar?.battery_soc_pct}%`} onClick={() => navigate("/grid-solar")} />
          <ModuleCard title="Explainable AI" status={m.xai?.status} primary={m.xai?.label} onClick={() => navigate("/xai")} />
          <ModuleCard title="Tenant Hub" status={m.tenant?.status} primary={m.tenant?.label} onClick={() => navigate("/tenant")} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <h2 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Building location</h2>
          <BuildingMap buildingId={activeBuilding} height="240px" />
        </div>
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          <h2 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">Today load profile (kWh/h)</h2>
          <div className="h-52">
            {summary.hourly_load ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={summary.hourly_load}>
                  <defs>
                    <linearGradient id="loadG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#059669" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#059669" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #334155", backgroundColor: "#1e293b", color: "#f8fafc", fontSize: 12 }} />
                  <Area type="monotone" dataKey="kwh" stroke="#059669" fill="url(#loadG)" strokeWidth={2} name="kWh" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-sm text-slate-400 flex items-center justify-center h-full">No load data</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function Kpi({ icon, label, value, accent, warn }: { icon: React.ReactNode; label: string; value: string | number; accent?: boolean; warn?: boolean; }) {
  return (
    <div className={`rounded-xl border p-3.5 ${warn ? "bg-amber-50/60 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
      : accent ? "bg-emerald-50/50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/50"
        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
      }`}>
      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] mb-1">{icon}<span>{label}</span></div>
      <p className={`text-lg font-semibold tracking-tight ${warn ? "text-amber-800 dark:text-amber-400" : accent ? "text-emerald-800 dark:text-emerald-400" : "text-slate-900 dark:text-white"
        }`}>{value}</p>
    </div>
  );
}