import React, { useEffect, useState } from "react";
import { useBuilding } from "../../contexts/BuildingContext";
import { apiFetch } from "../../services/apiClient";
import { ExplanationTooltip } from "../../components/ExplanationTooltip";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Activity, AlertTriangle, CheckCircle } from "lucide-react";
import clsx from "clsx";

export default function FaultsPage() {
  const { activeBuilding } = useBuilding();
  const [health, setHealth] = useState<any>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [trend, setTrend] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeBuilding) return;
    setLoading(true);
    apiFetch(`/faults/${activeBuilding}/health`)
      .then((d) => {
        setHealth(d);
        if (d.equipment?.length) setSelected(d.equipment[0].equipment_id);
      })
      .finally(() => setLoading(false));
  }, [activeBuilding]);

  useEffect(() => {
    if (!activeBuilding || !selected) return;
    apiFetch(`/faults/${activeBuilding}/equipment/${selected}/trend`).then(setTrend);
  }, [activeBuilding, selected]);

  if (loading) return <div className="py-20 text-center text-slate-400">Loading equipment health…</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">Equipment Health</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Early fault detection for chillers, AHUs and pumps</p>
      </div>

      <div className="flex flex-wrap gap-4">
        <StatusPill icon={<CheckCircle className="w-4 h-4" />} label="Healthy" count={health?.healthy_count} color="emerald" />
        <StatusPill icon={<AlertTriangle className="w-4 h-4" />} label="Warning" count={health?.warning_count} color="amber" />
        <StatusPill icon={<Activity className="w-4 h-4" />} label="Critical" count={health?.critical_count} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-2">
          {health?.equipment?.map((eq: any) => (
            <button
              key={eq.equipment_id}
              onClick={() => setSelected(eq.equipment_id)}
              className={clsx(
                "w-full text-left rounded-xl border p-4 transition",
                selected === eq.equipment_id
                  ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-900/30"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-800 dark:text-slate-200 text-sm">{eq.name}</span>
                <span className={clsx("w-2.5 h-2.5 rounded-full", eq.status === "green" && "bg-emerald-500", eq.status === "yellow" && "bg-amber-500", eq.status === "red" && "bg-red-500")} />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 capitalize">{eq.type}</p>
              {eq.deviation_pct > 5 && (
                <p className="text-xs text-amber-700 dark:text-amber-500 mt-2">+{eq.deviation_pct}% vs baseline</p>
              )}
            </button>
          ))}
        </div>

        <div className="lg:col-span-2 space-y-4">
          {selected && health && (
            <>
              {(() => {
                const eq = health.equipment.find((e: any) => e.equipment_id === selected);
                if (!eq) return null;
                return (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">{eq.name}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">{eq.type}</p>
                      </div>
                      {eq.suspected_cause && (
                        <ExplanationTooltip plainEnglish={eq.suspected_cause} topFeatures={[{ feature: "power_deviation", contribution: 0.55 }, { feature: "trend_slope", contribution: 0.30 }]} />
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Power draw</p>
                        <p className="font-medium dark:text-slate-200">{eq.power_draw_kw} kW</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Baseline</p>
                        <p className="font-medium dark:text-slate-200">{eq.baseline_kw} kW</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Deviation</p>
                        <p className={clsx("font-medium", eq.deviation_pct > 10 ? "text-amber-700 dark:text-amber-500" : "text-slate-800 dark:text-slate-200")}>
                          {eq.deviation_pct > 0 ? "+" : ""}{eq.deviation_pct}%
                        </p>
                      </div>
                    </div>
                    {eq.recommended_action && (
                      <div className="mt-4 rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800 px-3 py-2 text-sm text-amber-900 dark:text-amber-200">
                        {eq.recommended_action}
                      </div>
                    )}
                  </div>
                );
              })()}
              {trend && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
                  <h3 className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-3">Power trend (7 days)</h3>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trend.points}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="ts" tick={{ fontSize: 10, fill: "#64748b" }} tickFormatter={(v) => v.slice(5, 10)} />
                        <YAxis tick={{ fontSize: 11, fill: "#64748b" }} unit=" kW" />
                        <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #334155", backgroundColor: "#1e293b", color: "#f8fafc", fontSize: 12 }} />
                        <ReferenceLine y={trend.baseline} stroke="#94a3b8" strokeDasharray="4 4" />
                        <ReferenceLine y={trend.anomaly_threshold} stroke="#f59e0b" strokeDasharray="4 4" />
                        <Line type="monotone" dataKey="value" stroke="#059669" strokeWidth={2} dot={false} name="Power (kW)" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusPill({ icon, label, count, color }: { icon: React.ReactNode; label: string; count: number; color: string }) {
  const colors: Record<string, string> = {
    emerald: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50",
    amber: "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-800/50",
    red: "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-100 dark:border-red-800/50",
  };
  return (
    <div className={clsx("inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm", colors[color])}>
      {icon}<span>{label}</span><span className="font-semibold">{count}</span>
    </div>
  );
}