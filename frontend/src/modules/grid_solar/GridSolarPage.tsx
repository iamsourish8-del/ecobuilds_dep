import React, { useEffect, useState } from "react";
import { useBuilding } from "../../contexts/BuildingContext";
import { apiFetch } from "../../services/apiClient";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Sun, Battery, Zap, Shield, AlertTriangle } from "lucide-react";
import clsx from "clsx";

export default function GridSolarPage() {
  const { activeBuilding } = useBuilding();
  const [solar, setSolar] = useState<any>(null);
  const [dr, setDr] = useState<any>(null);
  const [outage, setOutage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [islanded, setIslanded] = useState(false);
  const [shed, setShed] = useState(false);

  useEffect(() => {
    // FIXED: Drop loading state and return safely if no building is selected (e.g. Global View)
    if (!activeBuilding) {
      setSolar(null);
      setDr(null);
      setOutage(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all([
      apiFetch(`/grid-solar/${activeBuilding}/solar`).catch(() => null),
      apiFetch(`/grid-solar/${activeBuilding}/dr-events`).catch(() => null),
      apiFetch(`/grid-solar/${activeBuilding}/outage-status`).catch(() => null),
    ]).then(([s, d, o]) => {
      setSolar(s); setDr(d); setOutage(o);
    }).finally(() => setLoading(false));
  }, [activeBuilding]);

  const soc = islanded && shed ? Math.max(20, (solar?.battery_soc_pct || 68) - 5) : (solar?.battery_soc_pct || 68);
  const runway = islanded ? +(4.5 * (soc / 68) * (shed ? 1.4 : 0.85)).toFixed(1) : (outage?.estimated_runtime_hours_on_battery || 4.5);

  const simulateBlackout = () => { setIslanded(true); setShed(true); };
  const restoreGrid = () => { setIslanded(false); setShed(false); };

  if (loading) return <div className="py-20 text-center text-emerald-700/50">Loading grid desk…</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-emerald-950 dark:text-emerald-50 tracking-tight">Solar, Grid & Resilience</h1>
          <p className="text-sm text-emerald-800/60 dark:text-emerald-200/60 mt-1">Power-flow vectors · ToD arbitrage · islanding runway</p>
        </div>
        <div className="flex gap-2">
          {!islanded ? (
            <button onClick={simulateBlackout} className="rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 transition flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> Simulate grid blackout
            </button>
          ) : (
            <button onClick={restoreGrid} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 transition">
              Restore utility grid
            </button>
          )}
        </div>
      </div>

      {islanded && (
        <div className="rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/30 px-4 py-3 text-sm text-red-900 dark:text-red-200 flex flex-wrap items-center gap-3">
          <span className="font-semibold">ISLANDED</span>
          <span>Breaker open · utility severed</span>
          {shed && <span className="rounded-full bg-red-100 dark:bg-red-800/60 px-2 py-0.5 text-xs">Non-critical loads shed (Shelly relays)</span>}
          <span className="ml-auto font-mono text-xs">Resilience runway ≈ {runway} h · SOC {soc}%</span>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi icon={<Sun className="w-4 h-4" />} label="Self-consumption" value={`${solar?.self_consumption_pct ?? 74}%`} />
        <Kpi icon={<Battery className="w-4 h-4" />} label="Battery SOC" value={`${soc}%`} />
        <Kpi icon={<Zap className="w-4 h-4" />} label="Today solar" value={`${solar?.today_solar_kwh ?? 612} kWh`} />
        <Kpi icon={<Shield className="w-4 h-4" />} label="Runway on battery" value={`${runway} h`} />
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-700 p-5 text-white">
        <h2 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-4">Power-flow vector grid</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center text-xs">
          <Node title="Rooftop solar" sub={islanded ? "Serving island" : "Surplus → battery"} color="text-amber-300" pulse={!islanded} />
          <Node title="Hybrid inverter" sub="DC bus" color="text-emerald-300" pulse />
          <Node title="Battery pack" sub={islanded ? "Discharging" : "ToD charge/discharge"} color="text-teal-300" pulse />
          <Node title="Utility grid" sub={islanded ? "DISCONNECTED" : "Import / export"} color={islanded ? "text-red-400" : "text-slate-300"} pulse={!islanded} />
          <Node title="Building loads" sub={shed ? "Critical only" : "Full load"} color="text-sky-300" pulse />
        </div>
        <div className="mt-4 h-2 rounded-full bg-slate-800 overflow-hidden flex">
          <div className="h-full bg-amber-400/80 transition-all" style={{ width: islanded ? "35%" : "40%" }} title="Solar" />
          <div className="h-full bg-teal-400/80 transition-all" style={{ width: islanded ? "45%" : "25%" }} title="Battery" />
          <div className="h-full bg-slate-500 transition-all" style={{ width: islanded ? "0%" : "20%" }} title="Grid" />
          <div className="h-full bg-sky-500/60 transition-all" style={{ width: "15%" }} title="Other" />
        </div>
        <p className="text-[10px] text-slate-500 mt-2">Green/amber = clean self-use · teal = storage · slate = grid import · red = islanded deficit path</p>
      </div>

      <div className="bg-white/90 dark:bg-slate-900/90 rounded-2xl border border-emerald-100 dark:border-emerald-800/50 p-5">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Time-of-day tariff arbitrage</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Charge storage on solar surplus and off-peak; discharge through evening peak to cut maximum-demand charges.</p>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800/50 p-3">
            <p className="font-medium text-emerald-900 dark:text-emerald-100">Off-peak / solar noon</p>
            <p className="text-emerald-700/80 dark:text-emerald-400 mt-1">Battery charge preferred</p>
          </div>
          <div className="rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800/50 p-3">
            <p className="font-medium text-amber-900 dark:text-amber-100">Shoulder</p>
            <p className="text-amber-800/80 dark:text-amber-400 mt-1">Balance self-use vs import</p>
          </div>
          <div className="rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800/50 p-3">
            <p className="font-medium text-red-900 dark:text-red-100">Evening peak</p>
            <p className="text-red-800/80 dark:text-red-400 mt-1">Discharge + DR curtail</p>
          </div>
        </div>
      </div>

      {solar?.schedule && (
        <div className="bg-white/90 dark:bg-slate-900/90 rounded-2xl border border-emerald-100 dark:border-emerald-800/50 p-5">
          <h2 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">24-hour dispatch</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={solar.schedule}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} unit=" kW" />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #334155", backgroundColor: "#1e293b", color: "#f8fafc", fontSize: 12 }} />
                <Legend />
                <Area type="monotone" dataKey="solar_kw" stackId="1" stroke="#f59e0b" fill="#fbbf24" name="Solar" />
                <Area type="monotone" dataKey="battery_discharge_kw" stackId="1" stroke="#0d9488" fill="#5eead4" name="Battery" />
                <Area type="monotone" dataKey="grid_import_kw" stackId="1" stroke="#64748b" fill="#94a3b8" name="Grid" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/90 dark:bg-slate-900/90 rounded-2xl border border-emerald-100 dark:border-emerald-800/50 p-5">
          <h2 className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-3">Demand-response history</h2>
          <ul className="space-y-2 text-sm">
            {(Array.isArray(dr?.history) ? dr.history : []).map((e: any) => (
              <li key={e.event_id} className="rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-3">
                <div className="flex justify-between"><span className="font-medium dark:text-slate-200">{e.event_id}</span><span className="text-emerald-700 dark:text-emerald-400">₹{e.incentive_inr}</span></div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Target {e.target_reduction_kw} kW → {e.achieved_reduction_kw} kW</p>
              </li>
            ))}
            {(!dr?.history || dr.history.length === 0) && <p className="text-slate-400 text-sm">No events</p>}
          </ul>
        </div>
        <div className="bg-white/90 dark:bg-slate-900/90 rounded-2xl border border-emerald-100 dark:border-emerald-800/50 p-5">
          <h2 className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-3 flex items-center gap-2"><Shield className="w-4 h-4" /> Critical-load tiers</h2>
          <div className="space-y-2 text-sm">
            <Tier label="Tier 1 — Life safety" items={outage?.critical_load_registry?.tier1_life_safety} color="red" />
            <Tier label="Tier 2 — Business critical" items={outage?.critical_load_registry?.tier2_business} color="amber" />
            <Tier label="Tier 3 — Comfort (shed first)" items={outage?.critical_load_registry?.tier3_comfort} color="slate" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white/90 dark:bg-slate-900/90 rounded-xl border border-emerald-100 dark:border-emerald-800/50 p-3.5">
      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] mb-1">{icon}<span>{label}</span></div>
      <p className="text-lg font-semibold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

function Node({ title, sub, color, pulse }: { title: string; sub: string; color: string; pulse?: boolean }) {
  return (
    <div className={clsx("rounded-xl border border-slate-600 bg-slate-800/80 p-3", pulse && "animate-pulse")}>
      <p className={clsx("font-semibold text-sm", color)}>{title}</p>
      <p className="text-slate-400 mt-1 text-[10px] leading-snug">{sub}</p>
    </div>
  );
}

function Tier({ label, items, color }: { label: string; items?: string[]; color: string }) {
  const bg: Record<string, string> = {
    red: "bg-red-50 dark:bg-red-900/30 border-red-100 dark:border-red-800/50 text-red-900 dark:text-red-200",
    amber: "bg-amber-50 dark:bg-amber-900/30 border-amber-100 dark:border-amber-800/50 text-amber-900 dark:text-amber-200",
    slate: "bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300",
  };
  return (
    <div className={`rounded-lg border px-3 py-2 ${bg[color]}`}>
      <p className="text-xs font-medium mb-1">{label}</p>
      <p className="text-xs opacity-80">{(items || []).join(" · ") || "—"}</p>
    </div>
  );
}