"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Rocket,
  RefreshCw,
  Loader2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  BarChart3,
  Users,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/*  Types (mirror server-side AutomationInsights)                      */
/* ------------------------------------------------------------------ */

interface DropoutRiskStudent {
  readonly studentId: string;
  readonly studentName: string;
  readonly courseTitle: string;
  readonly riskScore: number;
  readonly riskFactors: ReadonlyArray<string>;
  readonly suggestedAction: string;
}

interface CompletionPrediction {
  readonly courseTitle: string;
  readonly predictedCompletionRate: number;
  readonly currentCompletionRate: number;
  readonly trend: "improving" | "stable" | "declining";
}

interface AutomationSuggestion {
  readonly trigger: string;
  readonly action: string;
  readonly priority: "high" | "medium" | "low";
  readonly affectedStudents: number;
}

interface AutomationInsightsData {
  readonly summary: string;
  readonly dropoutRiskStudents: ReadonlyArray<DropoutRiskStudent>;
  readonly completionPredictions: ReadonlyArray<CompletionPrediction>;
  readonly automationSuggestions: ReadonlyArray<AutomationSuggestion>;
  readonly generatedAt: string;
}

/* ------------------------------------------------------------------ */
/*  Skeleton loader                                                    */
/* ------------------------------------------------------------------ */

function SkeletonBlock({ className = "" }: { readonly className?: string }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded-lg ${className}`}
    />
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Summary skeleton */}
      <SkeletonBlock className="h-32 w-full" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonBlock className="h-64 w-full" />
        <SkeletonBlock className="h-64 w-full" />
      </div>

      <SkeletonBlock className="h-48 w-full" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Risk score bar                                                     */
/* ------------------------------------------------------------------ */

function RiskScoreBar({ score }: { readonly score: number }) {
  const getColor = (value: number): string => {
    if (value >= 80) return "bg-red-500";
    if (value >= 60) return "bg-orange-500";
    return "bg-yellow-500";
  };

  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${getColor(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-gray-700 w-8">
        {score}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Priority badge                                                     */
/* ------------------------------------------------------------------ */

function PriorityBadge({
  priority,
}: {
  readonly priority: "high" | "medium" | "low";
}) {
  const styles: Record<string, string> = {
    high: "bg-red-100 text-red-700",
    medium: "bg-yellow-100 text-yellow-700",
    low: "bg-green-100 text-green-700",
  };

  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[priority]}`}
    >
      {priority}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Trend indicator                                                    */
/* ------------------------------------------------------------------ */

function TrendIndicator({
  trend,
}: {
  readonly trend: "improving" | "stable" | "declining";
}) {
  const config: Record<
    string,
    { readonly icon: React.ReactNode; readonly color: string; readonly label: string }
  > = {
    improving: {
      icon: <TrendingUp className="h-4 w-4" />,
      color: "text-green-600",
      label: "Improving",
    },
    stable: {
      icon: <Minus className="h-4 w-4" />,
      color: "text-gray-500",
      label: "Stable",
    },
    declining: {
      icon: <TrendingDown className="h-4 w-4" />,
      color: "text-red-600",
      label: "Declining",
    },
  };

  const { icon, color, label } = config[trend] ?? config.stable;

  return (
    <div className={`flex items-center gap-1 ${color}`}>
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Completion bar (inline)                                            */
/* ------------------------------------------------------------------ */

function CompletionBar({
  label,
  value,
  color,
}: {
  readonly label: string;
  readonly value: number;
  readonly color: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-500">{label}</span>
        <span className="font-medium text-gray-700">{value}%</span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function ControlTowerDashboard() {
  const [data, setData] = useState<AutomationInsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/control-tower");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        setError(null);
      } else {
        setError(json.error ?? "Failed to load control tower data");
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
      const res = await fetch("/api/admin/control-tower", { method: "POST" });
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

  /* ---- Loading state ---- */
  if (loading) {
    return <LoadingSkeleton />;
  }

  /* ---- Error state (no data) ---- */
  if (error && !data) {
    return (
      <div className="bg-red-50 rounded-xl border border-red-200 p-6 text-center">
        <p className="text-red-600">{error}</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={fetchData}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 rounded-lg p-2">
            <Rocket className="h-5 w-5 text-indigo-700" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">
              Automation Insights
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
          {refreshing ? "Analyzing..." : "Refresh Analysis"}
        </Button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* AI Summary */}
      <div className="bg-gradient-to-r from-indigo-700 to-blue-800 rounded-xl p-6 text-white">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="h-5 w-5 text-indigo-200" />
          <h3 className="font-semibold">Platform Health Summary</h3>
        </div>
        <p className="text-sm text-indigo-100 leading-relaxed">
          {data.summary}
        </p>
      </div>

      {/* Dropout Risk Students */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <ShieldAlert className="h-5 w-5 text-red-500" />
          <h3 className="font-semibold text-gray-900">
            Dropout Risk Students
          </h3>
          {data.dropoutRiskStudents.length > 0 && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full ml-auto">
              {data.dropoutRiskStudents.length} flagged
            </span>
          )}
        </div>

        {data.dropoutRiskStudents.length > 0 ? (
          <div className="space-y-3">
            {data.dropoutRiskStudents.map((student) => (
              <div
                key={student.studentId}
                className="bg-red-50 rounded-lg p-4 border border-red-100"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {student.studentName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {student.courseTitle}
                    </p>
                  </div>
                  <RiskScoreBar score={student.riskScore} />
                </div>

                {/* Risk factors */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {student.riskFactors.map((factor, i) => (
                    <span
                      key={i}
                      className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full"
                    >
                      {factor}
                    </span>
                  ))}
                </div>

                {/* Suggested action */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-2 mt-2">
                  <p className="text-xs text-yellow-800">
                    <span className="font-semibold">Suggested action:</span>{" "}
                    {student.suggestedAction}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <Users className="h-8 w-8 text-green-400 mx-auto mb-2" />
            <p className="text-sm text-green-600 font-medium">
              No students at risk of dropping out
            </p>
          </div>
        )}
      </div>

      {/* Completion Predictions */}
      {data.completionPredictions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">
              Completion Predictions
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.completionPredictions.map((prediction) => (
              <div
                key={prediction.courseTitle}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-900 truncate pr-2">
                    {prediction.courseTitle}
                  </h4>
                  <TrendIndicator trend={prediction.trend} />
                </div>

                <div className="space-y-2">
                  <CompletionBar
                    label="Current"
                    value={prediction.currentCompletionRate}
                    color="bg-blue-500"
                  />
                  <CompletionBar
                    label="Predicted"
                    value={prediction.predictedCompletionRate}
                    color="bg-indigo-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Automation Suggestions */}
      {data.automationSuggestions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-5 w-5 text-amber-600" />
            <h3 className="font-semibold text-gray-900">
              Automation Suggestions
            </h3>
          </div>

          <div className="space-y-3">
            {data.automationSuggestions.map((suggestion, i) => (
              <div
                key={i}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <PriorityBadge priority={suggestion.priority} />
                  <span className="text-xs text-gray-500">
                    <AlertTriangle className="h-3 w-3 inline-block mr-1" />
                    {suggestion.affectedStudents} student
                    {suggestion.affectedStudents !== 1 ? "s" : ""}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-medium text-gray-900">Trigger:</span>{" "}
                  {suggestion.trigger}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-gray-900">Action:</span>{" "}
                  {suggestion.action}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
