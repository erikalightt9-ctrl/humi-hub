"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, LogOut, CalendarDays, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnalyticsCard } from "@/components/admin/AnalyticsCard";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface AttendanceRow {
  readonly id: string;
  readonly studentName: string;
  readonly courseTitle: string;
  readonly clockIn: string;
  readonly clockOut: string | null;
  readonly isActive: boolean;
}

interface AttendanceSummary {
  readonly presentNow: number;
  readonly clockedOutToday: number;
  readonly totalToday: number;
  readonly records: ReadonlyArray<AttendanceRow>;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(clockIn: string, clockOut: string | null): string {
  const end = clockOut ? new Date(clockOut).getTime() : Date.now();
  const diffMs = end - new Date(clockIn).getTime();
  const totalMinutes = Math.max(0, Math.floor(diffMs / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function toDateInputValue(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const REFRESH_INTERVAL_MS = 30_000;

export function AttendanceLiveTable() {
  const [date, setDate] = useState(() => toDateInputValue(new Date()));
  const [data, setData] = useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isToday = date === toDateInputValue(new Date());

  const fetchData = useCallback(
    async (showRefreshing = false) => {
      if (showRefreshing) setRefreshing(true);
      try {
        const res = await fetch(`/api/admin/attendance?date=${date}`);
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch {
        /* silent */
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [date],
  );

  /* Initial load + date change */
  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  /* Auto-refresh every 30s when viewing today */
  useEffect(() => {
    if (!isToday) return;
    const interval = setInterval(() => fetchData(), REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isToday, fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-ds-muted" />
      </div>
    );
  }

  return (
    <>
      {/* Date picker + refresh */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-ds-muted" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-ds-surface border border-ds-border text-ds-text rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ds-primary/50"
          />
          {isToday && (
            <span className="text-xs bg-emerald-900/40 text-emerald-400 border border-emerald-800 rounded-full px-2 py-0.5 font-medium">
              Live
            </span>
          )}
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => fetchData(true)}
          disabled={refreshing}
        >
          <RefreshCw
            className={`h-4 w-4 mr-1.5 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Summary cards */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <AnalyticsCard
            title="Present Now"
            value={data.presentNow}
            icon={Users}
            colorClass="text-emerald-400 bg-emerald-900/40"
            subtitle="Currently clocked in"
          />
          <AnalyticsCard
            title="Clocked Out"
            value={data.clockedOutToday}
            icon={LogOut}
            colorClass="text-ds-muted bg-ds-surface"
            subtitle="Completed for today"
          />
          <AnalyticsCard
            title="Total Records"
            value={data.totalToday}
            icon={CalendarDays}
            colorClass="text-blue-400 bg-blue-900/40"
            subtitle={isToday ? "Today" : date}
          />
        </div>
      )}

      {/* Attendance table */}
      <div className="bg-ds-card rounded-xl border border-ds-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-ds-surface border-b border-ds-border">
                <th className="text-left px-4 py-3 font-medium text-ds-muted">
                  Student
                </th>
                <th className="text-left px-4 py-3 font-medium text-ds-muted">
                  Course
                </th>
                <th className="text-left px-4 py-3 font-medium text-ds-muted">
                  Clock In
                </th>
                <th className="text-left px-4 py-3 font-medium text-ds-muted">
                  Clock Out
                </th>
                <th className="text-left px-4 py-3 font-medium text-ds-muted">
                  Duration
                </th>
                <th className="text-left px-4 py-3 font-medium text-ds-muted">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {data && data.records.length > 0 ? (
                data.records.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-ds-border hover:bg-ds-surface/50"
                  >
                    <td className="px-4 py-3 font-medium text-ds-text">
                      {row.studentName}
                    </td>
                    <td className="px-4 py-3 text-ds-muted">
                      {row.courseTitle}
                    </td>
                    <td className="px-4 py-3 text-ds-text">
                      {formatTime(row.clockIn)}
                    </td>
                    <td className="px-4 py-3 text-ds-text">
                      {row.clockOut ? formatTime(row.clockOut) : "—"}
                    </td>
                    <td className="px-4 py-3 text-ds-text font-mono text-xs">
                      {formatDuration(row.clockIn, row.clockOut)}
                    </td>
                    <td className="px-4 py-3">
                      {row.isActive ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-900/40 border border-emerald-800 rounded-full px-2.5 py-0.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          Present
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ds-muted bg-ds-surface border border-ds-border rounded-full px-2.5 py-0.5">
                          Completed
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-ds-muted"
                  >
                    No attendance records for this date
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
