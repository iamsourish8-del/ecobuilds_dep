import React, { useMemo, useState } from "react";
import { useBuilding } from "../../contexts/BuildingContext";
import { useAuth } from "../../contexts/AuthContext";
import { apiFetch } from "../../services/apiClient";
import { ExplanationTooltip } from "../../components/ExplanationTooltip";
import { Thermometer, Wind, Users, Sliders, Layers, ShieldAlert } from "lucide-react";
import clsx from "clsx";

type LayerMode = "thermal" | "airflow" | "presence";

const ZONES = [
  { id: "z1", name: "Conference A", floor: 1, x: 8, y: 12, w: 28, h: 22, temp: 23.2, co2: 620, cfm: 420, occupied: true, headcount: 6, damper: 65 },
  { id: "z2", name: "Conference B", floor: 1, x: 40, y: 12, w: 28, h: 22, temp: 26.8, co2: 410, cfm: 80, occupied: false, headcount: 0, damper: 15 },
  { id: "z3", name: "Open Office N", floor: 2, x: 8, y: 40, w: 40, h: 28, temp: 24.1, co2: 710, cfm: 980, occupied: true, headcount: 22, damper: 72 },
  { id: "z4", name: "Open Office S", floor: 2, x: 52, y: 40, w: 40, h: 28, temp: 23.8, co2: 690, cfm: 920, occupied: true, headcount: 18, damper: 70 },
  { id: "z5", name: "Meeting 3A", floor: 3, x: 8, y: 72, w: 24, h: 20, temp: 27.1, co2: 400, cfm: 40, occupied: false, headcount: 0, damper: 10 },
  { id: "z6", name: "Board Room", floor: 3, x: 36, y: 72, w: 32, h: 20, temp: 24.5, co2: 550, cfm: 360, occupied: true, headcount: 8, damper: 55 },
];

function tempColor(t: number) {
  if (t < 22) return "bg-cyan-400/70 border-cyan-500";
  if (t <= 25.5) return "bg-emerald-400/70 border-emerald-500";
  if (t <= 27) return "bg-amber-400/70 border-amber-500";
  return "bg-red-400/70 border-red-500";
}

export default function DigitalTwinPage() {
  const { activeBuilding } = useBuilding();
  const { user } = useAuth();

  const [layer, setLayer] = useState<LayerMode>("thermal");
  const [selected, setSelected] = useState<typeof ZONES[0] | null>(null);
  const [heatwave, setHeatwave] = useState(0);
  const [mixedMode, setMixedMode] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);
  const [simLoading, setSimLoading] = useState(false);

  const zones = useMemo(() => {
    return ZONES.map((z) => ({
      ...z,
      temp: +(z.temp + heatwave * (z.occupied ? 0.35 : 0.15)).toFixed(1),
      cfm: mixedMode && z.occupied ? Math.round(z.cfm * 0.7) : z.cfm,
    }));
  }, [heatwave, mixedMode]);

  const chillerKw = useMemo(() => {
    const base = 118;
    return Math.round(base + heatwave * 14 - (mixedMode ? 12 : 0));
  }, [heatwave, mixedMode]);

  const hourlyCost = useMemo(() => Math.round(chillerKw * 7.2), [chillerKw]);

  const runEcbc = async () => {
    if (!activeBuilding) return;
    setSimLoading(true);
    try {
      const data = await apiFetch(`/digital-twin/${activeBuilding}/simulate`, {
        method: "POST",
        body: JSON.stringify({
          city: "Pune", climate_zone: "Composite", total_floor_area_m2: 12500,
          wall_material: "Brick", wall_thickness_mm: 230, window_type: "Single glazed",
          window_to_wall_ratio: 0.35, roof_type: "RCC", ac_tonnage: 220,
          lighting_w_per_m2: 12, daily_operating_hours: 12,
        }),
      });
      setSimResult(data);
    } catch {
      setSimResult(null);
    } finally {
      setSimLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-emerald-950 dark:text-emerald-50 tracking-tight">Digital Twin · Spatial cockpit</h1>
        <p className="text-sm text-emerald-800/60 dark:text-emerald-200/60 mt-1">
          Thermal mesh · airflow demand · true presence · ECBC what-if · adaptive comfort band
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white/90 dark:bg-slate-900/90 rounded-2xl border border-emerald-100 dark:border-emerald-800/50 p-4">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-emerald-700 dark:text-emerald-500" />
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mr-2">Layer</span>
            {([["thermal", "Thermal (Energy)"], ["airflow", "Airflow (IAQ)"], ["presence", "Presence (Space)"]] as const).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setLayer(id)}
                className={clsx(
                  "rounded-full px-3 py-1 text-xs font-medium transition",
                  layer === id ? "bg-emerald-600 text-white" : "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/50"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="relative w-full aspect-[4/3] rounded-xl bg-slate-900/90 overflow-hidden border border-slate-700">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
            {zones.map((z) => (
              <button
                key={z.id}
                onClick={() => setSelected(z)}
                className={clsx(
                  "absolute rounded-lg border-2 transition-all hover:ring-2 hover:ring-white/40",
                  layer === "thermal" && tempColor(z.temp),
                  layer === "airflow" && (z.cfm > 500 ? "bg-sky-400/60 border-sky-300" : z.cfm > 100 ? "bg-sky-500/40 border-sky-400" : "bg-slate-500/40 border-slate-400"),
                  layer === "presence" && (z.occupied ? "bg-violet-400/50 border-violet-300" : "bg-slate-600/40 border-slate-500"),
                  selected?.id === z.id && "ring-2 ring-white"
                )}
                style={{ left: `${z.x}%`, top: `${z.y}%`, width: `${z.w}%`, height: `${z.h}%` }}
              >
                <span className="text-[10px] font-semibold text-white drop-shadow px-1">{z.name}</span>
                {layer === "presence" && z.occupied && (
                  <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="w-8 h-8 rounded-full border-2 border-white/80 animate-ping opacity-40" />
                    <span className="absolute w-3 h-3 rounded-full bg-white" />
                  </span>
                )}
                {layer === "airflow" && z.cfm > 80 && <span className="absolute bottom-1 right-1 text-[9px] text-white/90 font-mono">{z.cfm} CFM</span>}
                {layer === "thermal" && <span className="absolute bottom-1 left-1 text-[9px] text-white font-mono">{z.temp}°</span>}
              </button>
            ))}
            <div className="absolute bottom-2 left-2 text-[10px] text-slate-400 bg-black/40 px-2 py-1 rounded">
              Legend: cyan cool · emerald comfort · amber warm · red hot
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white/90 dark:bg-slate-900/90 rounded-2xl border border-emerald-100 dark:border-emerald-800/50 p-4">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-3">
              <Sliders className="w-4 h-4 text-emerald-700 dark:text-emerald-500" /> What-if sandbox
            </h2>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Outdoor heatwave spike (+°C)</label>
            <input type="range" min={0} max={5} step={0.5} value={heatwave} onChange={(e) => setHeatwave(parseFloat(e.target.value))} className="w-full accent-emerald-600" />
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">+{heatwave}°C ambient stress</p>

            <label className="flex items-center gap-2 mt-4 text-sm text-slate-700 dark:text-slate-300">
              <input type="checkbox" checked={mixedMode} onChange={(e) => setMixedMode(e.target.checked)} className="accent-emerald-600" />
              Mixed-mode ventilation
            </label>

            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800/50 p-2">
                <p className="text-[10px] text-amber-800/70 dark:text-amber-200/70">Chiller load</p>
                <p className="font-semibold text-amber-950 dark:text-amber-100">{chillerKw} kW</p>
              </div>
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800/50 p-2">
                <p className="text-[10px] text-emerald-800/70 dark:text-emerald-200/70">Est. hourly cost</p>
                <p className="font-semibold text-emerald-950 dark:text-emerald-100">₹{hourlyCost}</p>
              </div>
            </div>

            {/* Gate access based on role */}
            {user?.role !== "tenant" ? (
              <button onClick={runEcbc} disabled={simLoading} className="mt-3 w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm py-2 transition disabled:opacity-50">
                {simLoading ? "Running ECBC model…" : "Run ECBC retrofit ranking"}
              </button>
            ) : (
              <div className="mt-3 w-full py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-not-allowed">
                <ShieldAlert className="w-4 h-4" /> Admin Access Required
              </div>
            )}
          </div>

          {selected && (
            <div className="bg-white/90 dark:bg-slate-900/90 rounded-2xl border border-emerald-100 dark:border-emerald-800/50 p-4">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{selected.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Floor {selected.floor} · telemetry drawer</p>
              <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                <li className="flex items-center gap-2"><Thermometer className="w-3.5 h-3.5" /> {selected.temp}°C zone air</li>
                <li className="flex items-center gap-2"><Wind className="w-3.5 h-3.5" /> {selected.cfm} CFM · CO₂ {selected.co2} ppm</li>
                <li className="flex items-center gap-2"><Users className="w-3.5 h-3.5" /> {selected.occupied ? `${selected.headcount} present (mmWave)` : "Vacant — setback eligible"}</li>
                <li className="text-xs text-slate-500 dark:text-slate-400">VAV damper actuation ~{selected.damper}%</li>
              </ul>
              <ExplanationTooltip plainEnglish={selected.occupied ? "Stationary presence held from micro-motion; HVAC stays in comfort band." : "No presence ripple — setback allowed under adaptive comfort rules."} topFeatures={[{ feature: "presence", contribution: 0.5 }, { feature: "co2", contribution: 0.3 }, { feature: "temp_band", contribution: 0.2 }]} />
            </div>
          )}

          {simResult && (
            <div className="bg-white/90 dark:bg-slate-900/90 rounded-2xl border border-emerald-100 dark:border-emerald-800/50 p-4 text-sm">
              <p className="font-medium text-slate-800 dark:text-slate-200">EPI {simResult.calculated_epi} vs baseline {simResult.ecbc_baseline_epi}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Gap {simResult.compliance_gap_pct}% · package ~₹{(simResult.recommended_package_cost / 1e5).toFixed(1)}L</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}