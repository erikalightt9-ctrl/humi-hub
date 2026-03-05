"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Brain,
  RefreshCw,
  Loader2,
  Trophy,
  AlertTriangle,
  BarChart3,
  Lightbulb,
  Users,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface TopPerformer {
  readonly studentId: string;
  readonly studentName: string;
  readonly courseTitle: string;
  readonly totalPoints: number;
  readonly quizAverage: number;
  readonly badgeCount: number;
}

interface AtRiskStudent {
  readonly studentId: string;
  readonly studentName: string;
  readonly courseTitle: string;
  readonly daysSinceActive: number;
  readonly lessonsCompleted: number;
  readonly totalLessons: number;
  readonly recommendation: string;
}

interface SkillGap {
  readonly courseTitle: string;
  readonly gap: string;
  readonly severity: "low" | "medium" | "high";
}

interface InsightsData {
  readonly platformSummary: string;
  readonly topPerformers: ReadonlyArray<TopPerformer>;
  readonly atRiskStudents: ReadonlyArray<AtRiskStudent>;
  readonly skillGaps: ReadonlyArray<SkillGap>;
  readonly recommendations: ReadonlyArray<string>;
  readonly generatedAt: string;
}

/* ------------------------------------------------------------------ */
/*  Severity badge                                                     */
/* ------------------------------------------------------------------ */

function SeverityBadge({ severity }: { readonly severity: string }) {
  const styles: Record<string, string> = {
    low: "bg-yellow-100 text-yellow-700",
    medium: "bg-orange-100 text-orange-700",
    high: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[severity] ?? styles.low}`}
    >
      {severity}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function AIInsightsDashboard() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/ai-insights");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error ?? "Failed to load insights");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/ai-insights", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error ?? "Failed to refresh insights");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="bg-red-50 rounded-xl border border-red-200 p-6 text-center">
        <p className="text-red-600">{error}</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={fetchData}>
          Retry
        </Button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-purple-100 rounded-lg p-2">
            <Brain className="h-5 w-5 text-purple-700" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">
              AI Performance Insights
            </h2>
            <p className="text-xs text-gray-500">
              Last generated{" "}
              {new Date(data.generatedAt).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          {refreshing ? "Generating..." : "Refresh Insights"}
        </Button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Platform Summary */}
      <div className="bg-gradient-to-r from-purple-700 to-blue-800 rounded-xl p-6 text-white">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="h-5 w-5 text-purple-200" />
          <h3 className="font-semibold">Platform Health</h3>
        </div>
        <p className="text-sm text-purple-100 leading-relaxed">
          {data.platformSummary}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-5 w-5 text-amber-600" />
            <h3 className="font-semibold text-gray-900">Top Performers</h3>
          </div>
          {data.topPerformers.length > 0 ? (
            <div className="space-y-3">
              {data.topPerformers.map((p, i) => (
                <div
                  key={p.studentId}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-400 w-5">
                      #{i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {p.studentName}
                      </p>
                      <p className="text-xs text-gray-500">{p.courseTitle}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {p.totalPoints} pts
                    </p>
                    <p className="text-xs text-gray-500">
                      {p.quizAverage}% avg · {p.badgeCount} badges
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">
              No student data available
            </p>
          )}
        </div>

        {/* At-Risk Students */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <h3 className="font-semibold text-gray-900">At-Risk Students</h3>
          </div>
          {data.atRiskStudents.length > 0 ? (
            <div className="space-y-3">
              {data.atRiskStudents.map((s) => (
                <div
                  key={s.studentId}
                  className="bg-red-50 rounded-lg p-3 border border-red-100"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900">
                      {s.studentName}
                    </p>
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                      {s.daysSinceActive}d inactive
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-1">
                    {s.courseTitle} · {s.lessonsCompleted}/{s.totalLessons}{" "}
                    lessons
                  </p>
                  <p className="text-xs text-gray-600 italic">
                    {s.recommendation}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <Users className="h-8 w-8 text-green-400 mx-auto mb-2" />
              <p className="text-sm text-green-600 font-medium">
                All students are active!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Skill Gaps */}
      {data.skillGaps.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-5 w-5 text-orange-600" />
            <h3 className="font-semibold text-gray-900">Skill Gaps</h3>
          </div>
          <div className="space-y-2">
            {data.skillGaps.map((gap, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50"
              >
                <div>
                  <p className="text-sm text-gray-700">{gap.gap}</p>
                  <p className="text-xs text-gray-500">{gap.courseTitle}</p>
                </div>
                <SeverityBadge severity={gap.severity} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Recommendations */}
      {data.recommendations.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="h-5 w-5 text-yellow-600" />
            <h3 className="font-semibold text-gray-900">
              AI Recommendations
            </h3>
          </div>
          <div className="space-y-3">
            {data.recommendations.map((rec, i) => (
              <div
                key={i}
                className="flex gap-3 py-2 px-3 rounded-lg bg-yellow-50 border border-yellow-100"
              >
                <span className="text-sm font-bold text-yellow-600 shrink-0">
                  {i + 1}.
                </span>
                <p className="text-sm text-gray-700">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
