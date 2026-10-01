import React, { useEffect, useState } from "react";
import { useBuilding } from "../../contexts/BuildingContext";
import { apiFetch } from "../../services/apiClient";
import { MessageSquare, Sparkles, Send } from "lucide-react";

export default function XaiPage() {
  const { activeBuilding } = useBuilding();
  const [explanations, setExplanations] = useState<any[]>([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<any>(null);
  const [asking, setAsking] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeBuilding) return;
    setLoading(true);
    apiFetch(`/xai/${activeBuilding}/explanations/recent`)
      .then((d) => setExplanations(d.explanations || []))
      .finally(() => setLoading(false));
  }, [activeBuilding]);

  const ask = async () => {
    if (!question.trim() || !activeBuilding) return;
    setAsking(true);
    setAnswer(null);
    try {
      const res = await apiFetch("/xai/nlq", {
        method: "POST",
        body: JSON.stringify({ question, building_id: activeBuilding }),
      });
      setAnswer(res);
    } catch (e: any) {
      setAnswer({ answer: e.message, sources: [] });
    } finally {
      setAsking(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
          Explainable AI & Ask the Building
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
          Every automated decision explained in plain English + natural-language queries
        </p>
      </div>

      {/* NLQ chat */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-sm font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wide mb-4 flex items-center gap-2">
          <MessageSquare className="w-4 h-4" /> Ask the Building
        </h2>

        <div className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ask()}
            placeholder='e.g. "Why did Floor 3 energy spike yesterday?"'
            className="flex-1 rounded-xl bg-transparent border border-slate-200 dark:border-slate-700 dark:text-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
          <button
            onClick={ask}
            disabled={asking || !question.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2.5 text-sm font-medium transition"
          >
            <Send className="w-4 h-4" />
            {asking ? "…" : "Ask"}
          </button>
        </div>

        {/* Suggested questions */}
        <div className="flex flex-wrap gap-2 mt-3">
          {[
            "Why did Floor 3 energy spike yesterday?",
            "How much have we saved this week?",
            "Which equipment needs attention?",
          ].map((q) => (
            <button
              key={q}
              onClick={() => setQuestion(q)}
              className="text-xs rounded-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 px-3 py-1 text-slate-600 dark:text-slate-300 transition"
            >
              {q}
            </button>
          ))}
        </div>

        {answer && (
          <div className="mt-5 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 p-4">
            <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">{answer.answer}</p>
            {answer.sources?.length > 0 && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Sources: {answer.sources.join(" · ")}
              </p>
            )}
          </div>
        )}
      </section>

      {/* Recent explanations */}
      <section>
        <h2 className="text-sm font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wide mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4" /> Recent automated decisions
        </h2>

        {loading ? (
          <p className="text-slate-400 text-sm">Loading…</p>
        ) : (
          <div className="space-y-3">
            {explanations.map((ex) => (
              <div
                key={ex.decision_id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {ex.decision_type.replace(/_/g, " ")}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {/* The date formatting you requested without seconds */}
                    {new Date(ex.timestamp).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                  {ex.plain_english}
                </p>
                {ex.top_features?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {ex.top_features.map((f: any) => (
                      <span
                        key={f.feature}
                        className="inline-flex items-center gap-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-full px-2.5 py-1 text-slate-600 dark:text-slate-400"
                      >
                        <span className="capitalize">{f.feature.replace(/_/g, " ")}</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {(f.contribution * 100).toFixed(0)}%
                        </span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}