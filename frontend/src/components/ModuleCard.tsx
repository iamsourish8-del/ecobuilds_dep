import React from "react";
import clsx from "clsx";

export const ModuleCard = ({ title, status, primary, secondary, detail, onClick }: any) => {
  return (
    <button
      onClick={onClick}
      className="text-left flex flex-col justify-between w-full h-32 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 transition-all hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-sm"
    >
      <div className="flex w-full items-start justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {title}
        </span>
        <span
          className={clsx(
            "w-2 h-2 rounded-full mt-1",
            status === "online" || status === "active" || status === "green"
              ? "bg-emerald-500"
              : status === "warning" || status === "yellow"
                ? "bg-amber-500"
                : "bg-emerald-500"
          )}
        />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{primary}</p>
        {secondary && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{secondary}</p>}
        {detail && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{detail}</p>}
      </div>
    </button>
  );
};