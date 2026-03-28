"use client";

/**
 * AdminAttendanceAnalytics
 *
 * Displays attendance analytics for a specific course.
 * Fetches from GET /api/admin/attendance/analytics/[courseId].
 * Uses pure CSS bar charts — no external chart library needed.
 */
import { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  Users,
  TrendingUp,
  Clock,
  BarChart2,
  Medal,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface DailyStat {
  readonly date: string;
  readonly count: number;
  readonly avgDurationMinutes: number | null;
}

interface TopStudent {
  readonly studentId: string;
  readonly studentName: string;
  readonly checkIns: number;
  readonly totalMinutes: number;
}

interface AnalyticsData {
  readonly totalCheckIns: number;
  readonly uniqueStudents: number;
  readonly enrolledStudents: number;
  readonly attendanceRate: number;
  readonly avgDurationMinutes: number | null;
  readonly daily: ReadonlyArray<DailyStat>;
  readonly topStudents: ReadonlyArray<TopStudent>;
}

interface AdminAttendanceAnalyticsProps {
  readonly courseId: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatDuration(minutes: number | null): string {
  if (minutes === null) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatShortDate(isoDate: string): string {
  const d = new Date(isoDate + "T00:00:00");
  return d.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly label: string;
  readonly value: string;
  readonly sub?: string;
  readonly color: "blue" | "green" | "amber" | "purple";
}) {
  const colorMap = {
    blue: { bg: "bg-blue-100", text: "text-blue-600" },
    green: { bg: "bg-green-100", text: "text-green-600" },
    amber: { bg: "bg-amber-100", text: "text-amber-600" },
    purple: { bg: "bg-purple-100", text: "text-purple-600" },
  };
  const c = colorMap[color];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
      <div className={`${c.bg} rounded-lg p-2.5 shrink-0`}>
        <Icon className={`h-5 w-5 ${c.text}`} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-gray-900 leading-tight">
          {value}
        </p>
        <p className="text-xs text-gray-500">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function DailyBarChart({
  data,
}: {
  readonly data: ReadonlyArray<DailyStat>;
}) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-6">
        No data in the last 30 days.
      </p>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  // Show last 14 items for readability
  const visible = data.slice(-14);

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-1 h-32">
        {visible.map((d) => {
          const pct = Math.round((d.count / maxCount) * 100);
          return (
            <div
              key={d.date}
              className="flex-1 flex flex-col items-center gap-1 group"
            >
              {/* Tooltip */}
              <div className="relative">
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10 pointer-events-none">
                  <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                    {d.count} check-in{d.count !== 1 ? "s" : ""}
                    {d.avgDurationMinutes !== null && (
                      <> · avg {formatDuration(d.avgDurationMinutes)}</>
                    )}
                  </div>
                </div>
              </div>
              {/* Bar */}
              <div className="w-full flex flex-col justify-end h-24">
                <div
                  className="bg-blue-500 rounded-t hover:bg-blue-600 transition-colors"
                  style={{ height: `${pct}%`, minHeight: d.count > 0 ? "4px" : "0" }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* X-axis labels */}
      <div className="flex gap-1">
        {visible.map((d) => (
          <div
            key={d.date}
            className="flex-1 text-center text-xs text-gray-400 truncate"
          >
            {formatShortDate(d.date)}
          </div>
        ))}
      </div>
    </div>
  );
}

function TopStudentsTable({
  students,
}: {
  readonly students: ReadonlyArray<TopStudent>;
}) {
  if (students.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-6">
        No data yet.
      </p>
    );
  }

  const maxCheckIns = Math.max(...students.map((s) => s.checkIns), 1);

  return (
    <div className="space-y-2">
      {students.map((s, idx) => (
        <div key={s.studentId} className="flex items-center gap-3">
          {/* Rank */}
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              idx === 0
                ? "bg-amber-100 text-amber-700"
                : idx === 1
                  ? "bg-gray-200 text-gray-600"
                  : idx === 2
                    ? "bg-orange-100 text-orange-700"
                    : "bg-gray-100 text-gray-500"
            }`}
          >
            {idx + 1}
          </span>

          {/* Name + bar */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-sm font-medium text-gray-900 truncate">
                {s.studentName}
              </span>
              <span className="text-xs text-gray-500 ml-2 shrink-0">
                {s.checkIns} × · {formatDuration(s.totalMinutes)}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full ${idx === 0 ? "bg-amber-400" : "bg-blue-400"}`}
                style={{ width: `${(s.checkIns / maxCheckIns) * 100}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function AdminAttendanceAnalytics({
  courseId,
}: AdminAttendanceAnalyticsProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/attendance/analytics/${encodeURIComponent(courseId)}`,
      );
      const json = await res.json();
      if (json.success) {
        setData(json.data as AnalyticsData);
        setError(null);
      } else {
        setError(json.error ?? "Failed to load analytics");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 gap-2 text-gray-400">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading analytics…
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
        {error}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard
          icon={Users}
          label="Attendance Rate"
          value={`${data.attendanceRate}%`}
          sub={`${data.uniqueStudents} of ${data.enrolledStudents} enrolled`}
          color="green"
        />
        <KpiCard
          icon={TrendingUp}
          label="Total Check-ins"
          value={String(data.totalCheckIns)}
          sub="last 30 days"
          color="blue"
        />
        <KpiCard
          icon={Clock}
          label="Avg Session"
          value={formatDuration(data.avgDurationMinutes)}
          sub="per check-in"
          color="amber"
        />
        <KpiCard
          icon={Medal}
          label="Active Students"
          value={String(data.uniqueStudents)}
          sub="unique this period"
          color="purple"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily check-ins bar chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="h-4 w-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900">
              Daily Check-ins (last 30 days)
            </h3>
          </div>
          <DailyBarChart data={data.daily} />
        </div>

        {/* Top students */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Medal className="h-4 w-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900">
              Top Students by Attendance
            </h3>
          </div>
          <TopStudentsTable students={data.topStudents} />
        </div>
      </div>
    </div>
  );
}
