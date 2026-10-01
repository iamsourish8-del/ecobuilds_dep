import React from "react";
import { Zap, Wind, Droplets, Leaf, LayoutGrid } from "lucide-react";

export const PerformancePillarsStrip = ({ metrics }: any) => {
  const pillars = [
    { id: "energy", icon: Zap, title: "ENERGY", subtitle: "Efficiency & peak", label: metrics.energy_label },
    { id: "iaq", icon: Wind, title: "INDOOR AIR", subtitle: "Comfort & IAQ", label: metrics.iaq_label },
    { id: "water", icon: Droplets, title: "WATER", subtitle: "Cooling systems", label: metrics.water_label },
    { id: "carbon", icon: Leaf, title: "CARBON", subtitle: "Operations footprint", label: metrics.carbon_label },
    { id: "space", icon: LayoutGrid, title: "SPACE", subtitle: "Occupancy & daylight", label: metrics.space_label },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
      {pillars.map((p) => (
        <div key={p.id} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3.5 flex flex-col transition-colors">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            <p.icon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />
            {p.title}
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-2.5">{p.subtitle}</p>
          <p className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-snug">{p.label}</p>
        </div>
      ))}
    </div>
  );
};