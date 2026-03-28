"use client";

/**
 * TrainerAttendanceTable
 *
 * Live view of attendance for a specific course.
 * Polls /api/trainer/attendance/[courseId] every 30 seconds.
 * Shows all attendees (active + completed) with duration.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Loader2,
  RefreshCw,
  Users,
  Clock,
  CheckCircle2,
  Wifi,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface AttendanceRow {
  readonly id: string;
  readonly studentId: string;
  readonly studentName: string;
  readonly clockIn: string;
  readonly clockOut: string | null;
  readonly durationMinutes: number | null;
  readonly isActive: boolean;
}

interface TrainerAttendanceTableProps {
  readonly courseId: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const POLL_INTERVAL_MS = 30_000;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDuration(minutes: number | null): string {
  if (minutes === null) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function LiveTimer({ clockInIso }: { readonly clockInIso: string }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const update = () =>
      setElapsed(
        Math.floor((Date.now() - new Date(clockInIso).getTime()) / 60_000),
      );
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [clockInIso]);

  const h = Math.floor(elapsed / 60);
  const m = elapsed % 60;
  const label = h > 0 ? `${h}h ${m}m` : `${m}m`;

  return (
    <span className="tabular-nums text-emerald-400 font-medium">{label}</span>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function TrainerAttendanceTable({
  courseId,
}: TrainerAttendanceTableProps) {
  const [rows, setRows] = useState<ReadonlyArray<AttendanceRow>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(
    async (silent = false) => {
      if (!silent) setRefreshing(true);
      try {
        const res = await fetch(
          `/api/trainer/attendance/${encodeURIComponent(courseId)}`,
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (json.success) {
          setRows(json.data as ReadonlyArray<AttendanceRow>);
          setLastUpdated(new Date());
          setError(null);
        } else {
          setError(json.error ?? "Failed to load attendance");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Network error");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [courseId],
  );

  /* Initial load + polling */
  useEffect(() => {
    void fetchData(false);
    intervalRef.current = setInterval(() => void fetchData(true), POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  const activeRows = rows.filter((r) => r.isActive);
  const completedRows = rows.filter((r) => !r.isActive);

  /* ── Render ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 gap-2 text-ds-muted">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading attendance…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium text-ds-text">
              {activeRows.length}
            </span>
            <span className="text-ds-muted">present now</span>
          </div>
          <div className="text-sm text-ds-muted">
            {rows.length} total today
          </div>
        </div>

        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="flex items-center gap-1 text-xs text-ds-muted">
              <Wifi className="h-3 w-3" />
              {lastUpdated.toLocaleTimeString("en-PH", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
          <button
            onClick={() => void fetchData(false)}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs text-ds-muted hover:text-blue-400 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="text-sm text-red-400 bg-red-900/40 border border-red-800 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-ds-muted gap-2">
          <Users className="h-8 w-8 opacity-40" />
          <p className="text-sm">No students have clocked in yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Currently present */}
          {activeRows.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-ds-muted uppercase tracking-wider mb-2">
                Currently Present ({activeRows.length})
              </h4>
              <div className="rounded-lg border border-ds-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-ds-surface border-b border-ds-border">
                    <tr>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-ds-muted">
                        Student
                      </th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-ds-muted">
                        Clocked In
                      </th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-ds-muted">
                        Duration
                      </th>
                      <th className="text-right px-4 py-2.5 text-xs font-medium text-ds-muted">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ds-border">
                    {activeRows.map((row) => (
                      <tr key={row.id} className="hover:bg-ds-surface/50">
                        <td className="px-4 py-3 font-medium text-ds-text">
                          {row.studentName}
                        </td>
                        <td className="px-4 py-3 text-ds-muted">
                          {formatTime(row.clockIn)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-emerald-400" />
                            <LiveTimer clockInIso={row.clockIn} />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-900/40 text-emerald-400 border border-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Completed sessions */}
          {completedRows.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-ds-muted uppercase tracking-wider mb-2">
                Completed ({completedRows.length})
              </h4>
              <div className="rounded-lg border border-ds-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-ds-surface border-b border-ds-border">
                    <tr>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-ds-muted">
                        Student
                      </th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-ds-muted">
                        In
                      </th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-ds-muted">
                        Out
                      </th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-ds-muted">
                        Duration
                      </th>
                      <th className="text-right px-4 py-2.5 text-xs font-medium text-ds-muted">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ds-border">
                    {completedRows.map((row) => (
                      <tr key={row.id} className="hover:bg-ds-surface/50">
                        <td className="px-4 py-3 font-medium text-ds-text">
                          {row.studentName}
                        </td>
                        <td className="px-4 py-3 text-ds-muted">
                          {formatTime(row.clockIn)}
                        </td>
                        <td className="px-4 py-3 text-ds-muted">
                          {row.clockOut ? formatTime(row.clockOut) : "—"}
                        </td>
                        <td className="px-4 py-3 text-ds-text">
                          {formatDuration(row.durationMinutes)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-ds-surface text-ds-muted border border-ds-border">
                            <CheckCircle2 className="h-3 w-3" />
                            Done
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Polling indicator */}
      <p className="text-xs text-ds-muted text-right">
        Auto-refreshes every 30 seconds
      </p>
    </div>
  );
}
