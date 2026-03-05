"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Activity,
  Loader2,
  BookOpen,
  Clock,
  Flame,
  CalendarDays,
  Brain,
  CheckCircle2,
  Lightbulb,
  Calendar,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface WeeklyActivity {
  readonly week: string;
  readonly lessons: number;
  readonly quizzes: number;
  readonly attendanceDays: number;
}

interface WorkPaceMetrics {
  readonly lessonsPerWeek: number;
  readonly avgTimeBetweenLessons: number;
  readonly quizAttemptsPerWeek: number;
  readonly attendanceRate: number;
  readonly currentStreak: number;
  readonly longestStreak: number;
  readonly totalActiveDays: number;
  readonly daysSinceLastActivity: number;
  readonly weeklyTrend: ReadonlyArray<WeeklyActivity>;
}

interface CourseContext {
  readonly courseTitle: string;
  readonly courseSlug: string;
  readonly totalLessons: number;
  readonly lessonsCompleted: number;
  readonly courseDurationWeeks: number;
  readonly weeksSinceEnrollment: number;
  readonly studentName: string;
}

interface WorkPaceAnalysis {
  readonly pace: "ahead" | "on_track" | "behind" | "at_risk";
  readonly summary: string;
  readonly strengths: ReadonlyArray<string>;
  readonly suggestions: ReadonlyArray<string>;
  readonly recommendedSchedule: string;
  readonly projectedCompletionDate: string;
}

interface MetricsResponse {
  readonly metrics: WorkPaceMetrics;
  readonly courseContext: CourseContext;
  readonly canRefresh: boolean;
}

interface AnalysisResponse {
  readonly metrics: WorkPaceMetrics;
  readonly analysis: WorkPaceAnalysis;
}

/* ------------------------------------------------------------------ */
/*  Pace badge helpers                                                 */
/* ------------------------------------------------------------------ */

const PACE_CONFIG = {
  ahead: {
    label: "Ahead",
    bg: "bg-green-100",
    text: "text-green-700",
    border: "border-green-300",
    dot: "bg-green-500",
  },
  on_track: {
    label: "On Track",
    bg: "bg-blue-100",
    text: "text-blue-700",
    border: "border-blue-300",
    dot: "bg-blue-500",
  },
  behind: {
    label: "Behind",
    bg: "bg-yellow-100",
    text: "text-yellow-700",
    border: "border-yellow-300",
    dot: "bg-yellow-500",
  },
  at_risk: {
    label: "At Risk",
    bg: "bg-red-100",
    text: "text-red-700",
    border: "border-red-300",
    dot: "bg-red-500",
  },
} as const;

/* ------------------------------------------------------------------ */
/*  Stat Card                                                          */
/* ------------------------------------------------------------------ */

function StatCard({
  icon,
  label,
  value,
  subtitle,
}: {
  readonly icon: React.ReactNode;
  readonly label: string;
  readonly value: string | number;
  readonly subtitle?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {subtitle && (
        <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Weekly Trend Bar Chart (CSS)                                       */
/* ------------------------------------------------------------------ */

function WeeklyTrendChart({
  trend,
}: {
  readonly trend: ReadonlyArray<WeeklyActivity>;
}) {
  const maxActivity = Math.max(
    ...trend.map((w) => w.lessons + w.quizzes + w.attendanceDays),
    1,
  );

  function formatWeekLabel(week: string): string {
    const date = new Date(week + "T00:00:00");
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="h-5 w-5 text-indigo-600" />
        <h3 className="font-semibold text-gray-900">Weekly Activity Trend</h3>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-indigo-500" />
          <span className="text-gray-600">Lessons</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-amber-500" />
          <span className="text-gray-600">Quizzes</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-emerald-500" />
          <span className="text-gray-600">Attendance</span>
        </div>
      </div>

      {/* Bars */}
      <div className="flex items-end gap-2 h-40">
        {trend.map((week) => {
          const total = week.lessons + week.quizzes + week.attendanceDays;
          const heightPercent = maxActivity > 0 ? (total / maxActivity) * 100 : 0;
          const lessonsPercent =
            total > 0 ? (week.lessons / total) * heightPercent : 0;
          const quizzesPercent =
            total > 0 ? (week.quizzes / total) * heightPercent : 0;
          const attendancePercent =
            total > 0 ? (week.attendanceDays / total) * heightPercent : 0;

          return (
            <div
              key={week.week}
              className="flex-1 flex flex-col items-center gap-1"
            >
              <div
                className="w-full flex flex-col justify-end rounded-t-md overflow-hidden"
                style={{ height: "128px" }}
              >
                {total === 0 ? (
                  <div
                    className="w-full bg-gray-100 rounded-t-md"
                    style={{ height: "4px" }}
                  />
                ) : (
                  <>
                    <div
                      className="w-full bg-emerald-500"
                      style={{ height: `${attendancePercent}%` }}
                    />
                    <div
                      className="w-full bg-amber-500"
                      style={{ height: `${quizzesPercent}%` }}
                    />
                    <div
                      className="w-full bg-indigo-500 rounded-t-md"
                      style={{ height: `${lessonsPercent}%` }}
                    />
                  </>
                )}
              </div>
              <span className="text-[10px] text-gray-400 text-center leading-tight">
                {formatWeekLabel(week.week)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function WorkPaceMonitor() {
  const [metricsData, setMetricsData] = useState<MetricsResponse | null>(null);
  const [analysis, setAnalysis] = useState<WorkPaceAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canRefresh, setCanRefresh] = useState(true);

  /* ---- Fetch metrics on mount ---- */
  const fetchMetrics = useCallback(async () => {
    try {
      const res = await fetch("/api/student/work-pace");
      const json = await res.json();

      if (json.success) {
        setMetricsData(json.data);
        setCanRefresh(json.data.canRefresh);
      } else {
        setError(json.error ?? "Failed to load metrics");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  /* ---- Trigger AI analysis ---- */
  const handleAnalyze = useCallback(async () => {
    setAnalyzing(true);
    setError(null);

    try {
      const res = await fetch("/api/student/work-pace", { method: "POST" });
      const json = await res.json();

      if (json.success) {
        const data = json.data as AnalysisResponse;
        setAnalysis(data.analysis);
        setCanRefresh(false);

        // Update metrics with the fresh data from analysis
        setMetricsData((prev) =>
          prev
            ? {
                ...prev,
                metrics: data.metrics,
                canRefresh: false,
              }
            : prev,
        );
      } else {
        setError(json.error ?? "Failed to analyze pace");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  }, []);

  /* ---- Loading state ---- */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  /* ---- Error state (no data at all) ---- */
  if (error && !metricsData) {
    return (
      <div className="bg-red-50 rounded-xl border border-red-200 p-6 text-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  const metrics = metricsData?.metrics;
  const courseCtx = metricsData?.courseContext;

  if (!metrics || !courseCtx) {
    return (
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-10 text-center">
        <Activity className="h-10 w-10 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500">No pace data available yet.</p>
      </div>
    );
  }

  const completionPercent =
    courseCtx.totalLessons > 0
      ? Math.round((courseCtx.lessonsCompleted / courseCtx.totalLessons) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Pace Status Badge (shown when analysis exists) */}
      {analysis && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-lg font-bold ${PACE_CONFIG[analysis.pace].bg} ${PACE_CONFIG[analysis.pace].text} border ${PACE_CONFIG[analysis.pace].border}`}
              >
                <span
                  className={`w-3 h-3 rounded-full ${PACE_CONFIG[analysis.pace].dot}`}
                />
                {PACE_CONFIG[analysis.pace].label}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Your Learning Pace
                </p>
                <p className="text-xs text-gray-500">
                  {courseCtx.lessonsCompleted}/{courseCtx.totalLessons} lessons
                  completed ({completionPercent}%)
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">
                Week {courseCtx.weeksSinceEnrollment} of{" "}
                {courseCtx.courseDurationWeeks}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Progress bar (always visible) */}
      {!analysis && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700">
              Course Progress
            </p>
            <p className="text-sm text-gray-500">
              {courseCtx.lessonsCompleted}/{courseCtx.totalLessons} lessons (
              {completionPercent}%)
            </p>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Week {courseCtx.weeksSinceEnrollment} of{" "}
            {courseCtx.courseDurationWeeks} -- {courseCtx.courseTitle}
          </p>
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<BookOpen className="h-4 w-4 text-indigo-500" />}
          label="Lessons / Week"
          value={metrics.lessonsPerWeek}
          subtitle={`${courseCtx.lessonsCompleted} total completed`}
        />
        <StatCard
          icon={<Brain className="h-4 w-4 text-amber-500" />}
          label="Quizzes / Week"
          value={metrics.quizAttemptsPerWeek}
        />
        <StatCard
          icon={<Flame className="h-4 w-4 text-orange-500" />}
          label="Current Streak"
          value={`${metrics.currentStreak}d`}
          subtitle={`Longest: ${metrics.longestStreak}d`}
        />
        <StatCard
          icon={<CalendarDays className="h-4 w-4 text-emerald-500" />}
          label="Active Days"
          value={metrics.totalActiveDays}
          subtitle={
            metrics.daysSinceLastActivity === 0
              ? "Active today"
              : `${metrics.daysSinceLastActivity}d since last activity`
          }
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4 text-blue-500" />}
          label="Attendance Rate"
          value={`${metrics.attendanceRate}%`}
        />
        <StatCard
          icon={<Clock className="h-4 w-4 text-purple-500" />}
          label="Avg Gap Between Lessons"
          value={
            metrics.avgTimeBetweenLessons > 0
              ? `${metrics.avgTimeBetweenLessons}h`
              : "N/A"
          }
          subtitle="Hours between completions"
        />
      </div>

      {/* Weekly Trend Chart */}
      {metrics.weeklyTrend.length > 0 && (
        <WeeklyTrendChart trend={metrics.weeklyTrend} />
      )}

      {/* AI Analysis Section */}
      {analysis ? (
        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-5 w-5 text-indigo-600" />
              <h3 className="font-semibold text-gray-900">AI Pace Analysis</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              {analysis.summary}
            </p>
          </div>

          {/* Strengths & Suggestions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strengths */}
            {analysis.strengths.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-gray-900">Strengths</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {analysis.strengths.map((strength, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200"
                    >
                      {strength}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {analysis.suggestions.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="h-5 w-5 text-amber-500" />
                  <h3 className="font-semibold text-gray-900">Suggestions</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {analysis.suggestions.map((suggestion, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200"
                    >
                      {suggestion}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Recommended Schedule & Projected Completion */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">
                  Recommended Schedule
                </h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                {analysis.recommendedSchedule}
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold text-gray-900">
                  Projected Completion
                </h3>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatProjectedDate(analysis.projectedCompletionDate)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Based on your current pace
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Analyze CTA */
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="bg-indigo-100 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4">
            <Activity className="h-7 w-7 text-indigo-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Get AI-Powered Pace Analysis
          </h2>
          <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
            Our AI will analyze your learning velocity, identify strengths, and
            suggest an optimal study schedule based on your activity patterns.
          </p>
          <Button
            onClick={handleAnalyze}
            disabled={analyzing || !canRefresh}
            className="gap-2"
          >
            {analyzing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Activity className="h-4 w-4" />
            )}
            {analyzing ? "Analyzing..." : "Analyze My Pace"}
          </Button>
          {!canRefresh && !analyzing && (
            <p className="text-xs text-gray-400 mt-3">
              Analysis available once every 6 hours
            </p>
          )}
          {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatProjectedDate(dateStr: string): string {
  if (!dateStr || dateStr === "Unknown") return "Unknown";

  try {
    const date = new Date(dateStr + "T00:00:00");
    if (isNaN(date.getTime())) return dateStr;

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}
