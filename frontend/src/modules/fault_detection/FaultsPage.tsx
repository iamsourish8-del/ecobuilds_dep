import React, { useEffect, useState } from "react";
import { useBuilding } from "../../contexts/BuildingContext";
import { useAuth } from "../../contexts/AuthContext";
import { apiFetch } from "../../services/apiClient";
import { AlertTriangle, CheckCircle2, Wrench, Loader2, Activity, Zap, Info, Hash, Calendar, ShieldCheck, Tag, Phone, Mail } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

export default function FaultsPage() {
  const { activeBuilding } = useBuilding();
  const { user } = useAuth();
  const isMaintenance = user?.role === "maintenance";

  const [healthData, setHealthData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [selectedEqId, setSelectedEqId] = useState<string | null>(null);
  const [trendData, setTrendData] = useState<any>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const loadData = async () => {
    if (!activeBuilding) return;
    try {
      const data = await apiFetch(`/faults/${activeBuilding}/health`);
      setHealthData(data);

      if (data.equipment.length > 0 && !selectedEqId) {
        const faulty = data.equipment.find((e: any) => e.status !== "green");
        setSelectedEqId(faulty ? faulty.equipment_id : data.equipment[0].equipment_id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [activeBuilding]);

  useEffect(() => {
    if (!activeBuilding || !selectedEqId) return;
    apiFetch(`/faults/${activeBuilding}/equipment/${selectedEqId}/trend`)
      .then(setTrendData).catch(console.error);
  }, [activeBuilding, selectedEqId]);

  const handleDiagnoseAndFix = async () => {
    if (!isMaintenance || !selectedEqId) return;
    setResolvingId(selectedEqId);
    try {
      await apiFetch(`/faults/${activeBuilding}/equipment/${selectedEqId}/resolve`, { method: "POST" });
      await loadData();
      const newTrend = await apiFetch(`/faults/${activeBuilding}/equipment/${selectedEqId}/trend`);
      setTrendData(newTrend);
    } catch (e) {
      alert("Failed to resolve equipment issue.");
    } finally {
      setResolvingId(null);
    }
  };

  if (loading || !healthData) return <div className="flex h-[80vh] items-center justify-center text-slate-500"><Loader2 className="w-6 h-6 animate-spin text-emerald-500" /></div>;

  const selectedEq = healthData.equipment.find((e: any) => e.equipment_id === selectedEqId);

  return (
    <div className="max-w-[90rem] mx-auto space-y-4 pb-8 p-4">

      {/* COMPACT HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-500" /> Equipment Health & Diagnostics
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-xs">
            Real-time anomaly detection and telemetry for mechanical assets.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <div>
              <span className="block text-sm font-bold text-emerald-700 dark:text-emerald-400 leading-none">{healthData.healthy_count}</span>
              <span className="text-[9px] uppercase font-bold text-emerald-600/70 dark:text-emerald-400/70">Healthy</span>
            </div>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg ${healthData.warning_count > 0 ? "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20" : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"}`}>
            <AlertTriangle className={`w-4 h-4 ${healthData.warning_count > 0 ? "text-amber-500" : "text-slate-400"}`} />
            <div>
              <span className={`block text-sm font-bold leading-none ${healthData.warning_count > 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-500"}`}>{healthData.warning_count}</span>
              <span className={`text-[9px] uppercase font-bold ${healthData.warning_count > 0 ? "text-amber-600/70 dark:text-amber-400/70" : "text-slate-500"}`}>Warnings</span>
            </div>
          </div>
        </div>
      </div>

      {/* SPLIT PANE LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 h-full">

        {/* LEFT PANE */}
        <div className="lg:col-span-1 space-y-2 overflow-y-auto pr-1 max-h-[750px] custom-scrollbar">
          {healthData.equipment.map((eq: any) => (
            <button
              key={eq.equipment_id}
              onClick={() => setSelectedEqId(eq.equipment_id)}
              className={`w-full text-left p-3 rounded-xl border transition-all duration-200 group ${selectedEqId === eq.equipment_id
                ? "bg-slate-900 border-slate-700 shadow-lg shadow-slate-900/10 ring-1 ring-emerald-500/30 dark:bg-slate-800 dark:border-slate-600"
                : "bg-white border-slate-200 hover:border-emerald-300 dark:bg-slate-900 dark:border-slate-800 dark:hover:border-slate-700"
                }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className={`font-semibold text-xs ${selectedEqId === eq.equipment_id ? "text-white" : "text-slate-900 dark:text-white"}`}>{eq.name}</span>
                <div className={`w-2 h-2 rounded-full mt-1 shadow-sm ${eq.status === "yellow" ? "bg-amber-500 shadow-amber-500/50 animate-pulse" : "bg-emerald-500"}`} />
              </div>
              <p className={`text-[10px] uppercase font-medium tracking-wide ${selectedEqId === eq.equipment_id ? "text-slate-400" : "text-slate-500"}`}>{eq.type.replace('_', ' ')}</p>

              {eq.status === "yellow" && (
                <p className="text-[10px] font-bold text-amber-500 mt-2 flex items-center gap-1">
                  <Activity className="w-3 h-3" /> +{eq.deviation_pct}% DEVIATION
                </p>
              )}
            </button>
          ))}
        </div>

        {/* RIGHT PANE */}
        {selectedEq && (
          <div className="lg:col-span-3 flex flex-col gap-4">

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Hash className="w-3.5 h-3.5 text-slate-400" />
                <div>
                  <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Asset ID</p>
                  <p className="text-[11px] font-mono text-slate-900 dark:text-white mt-0.5">{selectedEq.equipment_id.toUpperCase()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <div>
                  <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Make / Model</p>
                  <p className="text-[11px] font-semibold text-slate-900 dark:text-white mt-0.5">Carrier 30XV Series</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <div>
                  <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Last Serviced</p>
                  <p className="text-[11px] font-semibold text-slate-900 dark:text-white mt-0.5">{selectedEq.last_service || "2025-11-04"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <div>
                  <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Warranty</p>
                  <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">Active (Exp. 2029)</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1 flex items-center gap-1.5"><Zap className="w-3 h-3 text-emerald-500" /> Power Draw</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{selectedEq.power_draw_kw} <span className="text-xs font-medium text-slate-400">kW</span></p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Baseline</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{selectedEq.baseline_kw} <span className="text-xs font-medium text-slate-400">kW</span></p>
              </div>
              <div className={`p-4 rounded-xl border shadow-sm flex flex-col justify-center ${selectedEq.status === "yellow" ? "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"}`}>
                <p className={`text-[10px] uppercase font-bold tracking-wider mb-1 ${selectedEq.status === "yellow" ? "text-amber-700 dark:text-amber-400" : "text-slate-500"}`}>Deviation</p>
                <p className={`text-xl font-bold ${selectedEq.status === "yellow" ? "text-amber-600 dark:text-amber-400" : "text-emerald-500"}`}>
                  {selectedEq.deviation_pct > 0 ? "+" : ""}{selectedEq.deviation_pct}%
                </p>
              </div>
            </div>

            {selectedEq.status === "yellow" && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex gap-3 items-start">
                  <div className="p-1.5 bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 rounded-md shrink-0 mt-0.5">
                    <Info className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-amber-900 dark:text-amber-200 text-xs">Anomaly: {selectedEq.suspected_cause}</h4>
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">{selectedEq.recommended_action}</p>
                  </div>
                </div>

                {isMaintenance ? (
                  <button
                    onClick={handleDiagnoseAndFix}
                    disabled={resolvingId === selectedEq.equipment_id}
                    className="shrink-0 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
                  >
                    {resolvingId === selectedEq.equipment_id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wrench className="w-3.5 h-3.5" />}
                    Diagnose & Resolve
                  </button>
                ) : (
                  <span className="shrink-0 px-3 py-1.5 bg-white/50 dark:bg-slate-900/50 text-amber-700 dark:text-amber-400 text-[10px] font-bold uppercase rounded-md border border-amber-200/50 dark:border-amber-900/50">
                    Maintenance Alerted
                  </span>
                )}
              </div>
            )}

            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm min-h-[280px] flex flex-col">
              <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-wider">7-Day Telemetry Trend (kW)</h3>

              {trendData ? (
                <div className="w-full h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData.points} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.3} />
                      <XAxis
                        dataKey="ts"
                        tickFormatter={(val) => {
                          const date = new Date(val);
                          return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:00`;
                        }}
                        stroke="#64748b"
                        fontSize={9}
                        tickMargin={8}
                        minTickGap={40}
                      />
                      <YAxis stroke="#64748b" fontSize={9} domain={['auto', 'auto']} tickMargin={8} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#f8fafc', fontSize: '10px' }}
                        itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                        labelFormatter={(val) => new Date(val).toLocaleString()}
                      />
                      <ReferenceLine y={trendData.baseline} stroke="#3b82f6" strokeDasharray="3 3" label={{ position: 'top', value: 'Baseline', fill: '#3b82f6', fontSize: 9 }} />
                      {trendData.anomaly_threshold && (
                        <ReferenceLine y={trendData.anomaly_threshold} stroke="#f59e0b" strokeDasharray="3 3" opacity={0.5} />
                      )}
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke={selectedEq.status === "yellow" ? "#f59e0b" : "#10b981"}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: "#fff", stroke: selectedEq.status === "yellow" ? "#f59e0b" : "#10b981", strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
              )}
            </div>

          </div>
        )}
      </div>

      {/* NEW BOTTOM SECTION: Gated Dynamic Contacts */}
      {(user?.role === "facility_manager" || user?.role === "super_admin") && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm mt-6">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-emerald-500" /> Assigned Maintenance & Consulting Teams
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Map Database Maintenance Accounts */}
            {healthData.maintenance_contacts?.length > 0 ? (
              healthData.maintenance_contacts.map((contact: any, idx: number) => (
                <div key={idx} className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1">On-Site Maintenance</span>
                  <p className="font-semibold text-sm text-slate-900 dark:text-white">{contact.name}</p>
                  <div className="mt-2 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                    <p className="flex items-center gap-1.5"><Mail className="w-3 h-3" /> {contact.email}</p>
                    <p className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> {contact.phone}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 italic col-span-2">No maintenance personnel assigned yet.</p>
            )}

            {/* External Audit Flavor Profile (Always Visible to FM) */}
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 block mb-1">ECBC Compliance Auditor</span>
              <p className="font-semibold text-sm text-slate-900 dark:text-white">Dr. R. K. Sen (Principal Auditor)</p>
              <div className="mt-2 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                <p className="flex items-center gap-1.5"><Mail className="w-3 h-3" /> rk.sen@greenaudit.org</p>
                <p className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> +91 (033) 2473-1122</p>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}