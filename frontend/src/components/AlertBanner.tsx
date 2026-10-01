import React from "react";
import { AlertTriangle, Info } from "lucide-react";
import clsx from "clsx";

export const AlertBanner = ({ severity, message, module }: any) => {
  const isWarn = severity === "warning" || severity === "high" || !severity; // Catch undefined as a warning for demo

  return (
    <div
      className={clsx(
        "flex items-center gap-3 rounded-xl border p-3.5 text-sm transition-colors",
        isWarn
          ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50 text-amber-900 dark:text-amber-200"
          : "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-200"
      )}
    >
      {isWarn ? (
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
      ) : (
        <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0 truncate">
        <span className="font-semibold opacity-80 mr-1.5">[{module}]</span>
        <span className="opacity-90">{message}</span>
      </div>
    </div>
  );
};