"use client";

import { useState, useEffect } from "react";
import { History, TrendingDown, TrendingUp, Loader2 } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PriceHistoryEntry {
  readonly id: string;
  readonly tier: string;
  readonly oldPrice: number;
  readonly newPrice: number;
  readonly updatedAt: string;
}

interface CoursePriceHistoryPanelProps {
  readonly courseId: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const TIER_LABELS: Readonly<Record<string, string>> = {
  BASIC: "Basic",
  PROFESSIONAL: "Professional",
  ADVANCED: "Advanced",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function CoursePriceHistoryPanel({ courseId }: CoursePriceHistoryPanelProps) {
  const [history, setHistory] = useState<ReadonlyArray<PriceHistoryEntry>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchHistory() {
      try {
        const res = await fetch(`/api/admin/courses/${courseId}/price-history`);
        if (!res.ok) {
          if (!cancelled) setError(`Failed to load history (${res.status})`);
          return;
        }
        const json = await res.json();
        if (!cancelled) {
          if (json.success) {
            setHistory(json.data);
          } else {
            setError(json.error ?? "Failed to load history");
          }
        }
      } catch {
        if (!cancelled) setError("Network error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchHistory();
    return () => { cancelled = true; };
  }, [courseId]);

  return (
    <div className="border border-gray-200 rounded-lg p-4 mt-2">
      <div className="flex items-center gap-2 mb-3">
        <History className="h-4 w-4 text-gray-500" />
        <h4 className="text-sm font-semibold text-gray-700">Price Change History</h4>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-4 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading history…
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {!loading && !error && history.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">
          No price changes recorded yet.
        </p>
      )}

      {!loading && history.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 uppercase tracking-wide">
                <th className="pb-2 pr-4">Tier</th>
                <th className="pb-2 pr-4">Old Price</th>
                <th className="pb-2 pr-4">New Price</th>
                <th className="pb-2 pr-4">Change</th>
                <th className="pb-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry) => {
                const diff = entry.newPrice - entry.oldPrice;
                const isIncrease = diff > 0;
                return (
                  <tr key={entry.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-2 pr-4 font-medium text-gray-700">
                      {TIER_LABELS[entry.tier] ?? entry.tier}
                    </td>
                    <td className="py-2 pr-4 text-gray-500">
                      ₱{entry.oldPrice.toLocaleString()}
                    </td>
                    <td className="py-2 pr-4 font-semibold text-gray-900">
                      ₱{entry.newPrice.toLocaleString()}
                    </td>
                    <td className="py-2 pr-4">
                      <span
                        className={`inline-flex items-center gap-1 font-medium ${
                          isIncrease ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {isIncrease ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {isIncrease ? "+" : ""}₱{Math.abs(diff).toLocaleString()}
                      </span>
                    </td>
                    <td className="py-2 text-gray-400">{formatDate(entry.updatedAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
