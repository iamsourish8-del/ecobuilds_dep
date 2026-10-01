import React, { useEffect, useState } from "react";
import { useBuilding } from "../../contexts/BuildingContext";
import { apiFetch } from "../../services/apiClient";
import { Trophy, Award, Lightbulb, TrendingDown, Leaf, Loader2, CheckCircle2 } from "lucide-react";

const FALLBACK_ME = {
  kwh_this_week: 42.5, energy_saved_kwh: 15.1, co2_avoided_kg: 12.4, vs_building_avg_pct: -18, points: 1280,
  rank_on_floor: 2, rank_in_building: 7,
  badges: [{ id: "b1", name: "Early Bird" }, { id: "b2", name: "Setback Star" }, { id: "b3", name: "Week Warrior" }, { id: "b4", name: "Green Streak" }],
  streak_days: 12,
  challenges: [{ id: "c1", title: "Friday Floor Challenge", points: 50, status: "active" }, { id: "c2", title: "Phantom Load Hunt", points: 30, status: "active" }],
};

const FALLBACK_BOARD = {
  entries: [
    { rank: 1, name: "Sneha K.", energy_saved_kwh: 18.2, points: 1450 },
    { rank: 2, name: "Arjun Mehta", energy_saved_kwh: 15.1, points: 1280 },
    { rank: 3, name: "Ravi P.", energy_saved_kwh: 12.4, points: 1105 },
  ],
};

const FALLBACK_NUDGES = [
  { id: "n1", text: "Turn off AC 15 min before leaving — save ~1.2 kWh", potential_points: 30 },
  { id: "n2", text: "Enable auto-dim after 7 PM in your zone", potential_points: 20 },
  { id: "n3", text: "Report empty meeting rooms", potential_points: 15 },
];

export default function TenantPage() {
  const { activeBuilding } = useBuilding();
  const [me, setMe] = useState<any>(FALLBACK_ME);
  const [board, setBoard] = useState<any>(FALLBACK_BOARD);
  const [nudges, setNudges] = useState<any[]>(FALLBACK_NUDGES);
  const [loading, setLoading] = useState(true);
  const [logging, setLogging] = useState(false);
  const [logMsg, setLogMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!activeBuilding) { setLoading(false); return; }
    setLoading(true);
    Promise.all([
      apiFetch(`/tenant/${activeBuilding}/me`).catch(() => null),
      apiFetch(`/tenant/${activeBuilding}/leaderboard`).catch(() => null),
      apiFetch(`/tenant/${activeBuilding}/nudges`).catch(() => null),
    ]).then(([m, b, n]) => {
      if (m) setMe({ ...FALLBACK_ME, ...m, badges: Array.isArray(m.badges) ? m.badges : FALLBACK_ME.badges, challenges: Array.isArray(m.challenges) ? m.challenges : FALLBACK_ME.challenges });
      if (b) setBoard({ ...FALLBACK_BOARD, ...b, entries: Array.isArray(b.entries) ? b.entries : FALLBACK_BOARD.entries });
      if (n && Array.isArray(n.nudges)) setNudges(n.nudges); else if (Array.isArray(n)) setNudges(n);
    }).finally(() => setLoading(false));
  }, [activeBuilding]);

  const logEcoAction = async (action: string, points = 50) => {
    if (!activeBuilding) return;
    setLogging(true);
    setLogMsg(null);
    try {
      const res = await apiFetch(`/tenant/${activeBuilding}/actions/log`, { method: "POST", body: JSON.stringify({ action, points, building_id: activeBuilding }) });
      setMe((prev: any) => ({ ...prev, points: (prev.points || 0) + (res.points_awarded || points), energy_saved_kwh: (prev.energy_saved_kwh || 0) + 0.5 }));
      setLogMsg(res.message || `+${res.points_awarded || points} green credits`);
    } catch (e: any) {
      setMe((prev: any) => ({ ...prev, points: (prev.points || 0) + points }));
      setLogMsg(`+${points} green credits (saved locally)`);
    } finally { setLogging(false); }
  };

  const badges = Array.isArray(me?.badges) ? me.badges : [];
  const entries = Array.isArray(board?.entries) ? board.entries : [];
  const nudgeList = Array.isArray(nudges) ? nudges : [];
  const challenges = Array.isArray(me?.challenges) ? me.challenges : [];

  if (loading) return <div className="py-20 text-center text-emerald-700/50">Loading your habitat impact…</div>;

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-emerald-950 dark:text-emerald-50 tracking-tight">Your Energy Impact</h1>
        <p className="text-emerald-800/60 dark:text-emerald-200/60 mt-1 text-sm">See your usage, earn badges, climb the leaderboard</p>
      </div>

      <div className="bg-white/90 dark:bg-slate-900/90 rounded-2xl border border-emerald-100 dark:border-emerald-800/50 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">This week</p>
            <p className="text-3xl font-semibold text-slate-900 dark:text-white mt-1">{me.kwh_this_week ?? "—"} kWh</p>
            <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-1 flex items-center gap-1">
              <TrendingDown className="w-4 h-4" />{Math.abs(me.vs_building_avg_pct ?? 0)}% below building average
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Saved {me.energy_saved_kwh ?? 0} kWh · {me.co2_avoided_kg ?? 0} kg CO₂ avoided</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500 dark:text-slate-400">Green credits</p>
            <p className="text-3xl font-semibold text-emerald-700 dark:text-emerald-400">{me.points ?? 0}</p>
            <p className="text-xs text-slate-400 mt-1">Rank #{me.rank_on_floor ?? "—"} on floor · #{me.rank_in_building ?? "—"} building</p>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1">
            <Award className="w-3.5 h-3.5" /> Badges
          </p>
          <div className="flex flex-wrap gap-2">
            {badges.map((b: any) => (
              <span key={b.id || b.name} className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800/50 px-3 py-1 text-xs font-medium text-emerald-800 dark:text-emerald-300">
                <Award className="w-3 h-3" />{typeof b === "string" ? b : b.name}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-emerald-50 dark:border-emerald-800/30">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1">
            <Leaf className="w-3.5 h-3.5" /> Log eco-action
          </p>
          <div className="flex flex-wrap gap-2">
            <button disabled={logging} onClick={() => logEcoAction("setback_support", 50)} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-medium px-4 py-2 transition inline-flex items-center gap-1.5">
              {logging ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Leaf className="w-3.5 h-3.5" />}Support setback (+50)
            </button>
            <button disabled={logging} onClick={() => logEcoAction("lights_off", 30)} className="rounded-xl bg-white dark:bg-slate-800 border border-emerald-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-slate-700 text-emerald-800 dark:text-emerald-400 text-xs font-medium px-4 py-2 transition">
              Lights off (+30)
            </button>
          </div>
          {logMsg && <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> {logMsg}</p>}
        </div>
      </div>

      {challenges.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wide mb-3">Active challenges</h2>
          <div className="space-y-2">
            {challenges.map((c: any) => (
              <div key={c.id || c.title} className="rounded-xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-800/50 px-4 py-3 flex justify-between items-center text-sm">
                <div>
                  <p className="font-medium text-slate-800 dark:text-slate-200">{c.title}</p>
                  {c.description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{c.description}</p>}
                </div>
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">+{c.points} pts</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {nudgeList.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4" /> Suggested actions
          </h2>
          <div className="space-y-2">
            {nudgeList.map((n: any) => (
              <div key={n.id || n.text} className="flex items-center justify-between rounded-xl bg-amber-50/50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 px-4 py-3 text-sm">
                <span className="text-slate-800 dark:text-slate-200">{n.text}</span>
                <span className="text-xs font-medium text-amber-700 dark:text-amber-400 whitespace-nowrap ml-3">+{n.potential_points ?? n.points ?? 0} pts</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="bg-white/90 dark:bg-slate-900/90 rounded-2xl border border-emerald-100 dark:border-emerald-800/50 p-5">
        <h2 className="text-sm font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wide mb-4 flex items-center gap-2">
          <Trophy className="w-4 h-4" /> Floor leaderboard — this week
        </h2>
        <ul className="space-y-2">
          {entries.map((e: any) => (
            <li key={e.rank} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-emerald-50/50 dark:hover:bg-slate-800/50 transition">
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${e.rank === 1 ? "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-400" : e.rank === 2 ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300" : e.rank === 3 ? "bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400" : "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400"}`}>
                {e.rank}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{e.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {e.energy_saved_kwh ?? e.kwh_saved ?? 0} kWh saved
                  {e.co2_avoided_kg != null ? ` · ${e.co2_avoided_kg} kg CO₂` : ""}
                </p>
              </div>
              <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{e.points}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}