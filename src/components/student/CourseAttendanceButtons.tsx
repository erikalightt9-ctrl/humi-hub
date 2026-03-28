"use client";

/**
 * CourseAttendanceButtons
 *
 * Shown on the student course overview page.
 * Lets the student clock in or clock out for the specific course.
 * Reflects real-time status (active session for this course).
 */
import { useState, useEffect, useCallback } from "react";
import { LogIn, LogOut, Loader2, Clock } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ActiveSession {
  readonly id: string;
  readonly courseId: string | null;
  readonly clockIn: string;
}

interface StatusData {
  readonly isClockedIn: boolean;
  readonly session: ActiveSession | null;
}

interface CourseAttendanceButtonsProps {
  readonly courseId: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatElapsed(clockInIso: string): string {
  const diff = Math.floor(
    (Date.now() - new Date(clockInIso).getTime()) / 1000,
  );
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function CourseAttendanceButtons({
  courseId,
}: CourseAttendanceButtonsProps) {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  /* Fetch current status */
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/student/attendance?courseId=${encodeURIComponent(courseId)}`,
      );
      const json = await res.json();
      if (json.success) {
        setStatus(json.data as StatusData);
        setError(null);
      }
    } catch {
      setError("Failed to load attendance status");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void fetchStatus();
  }, [fetchStatus]);

  /* Tick timer to update elapsed display every second */
  useEffect(() => {
    if (!status?.isClockedIn) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [status?.isClockedIn]);

  /* Clock-in / clock-out action */
  const handleAction = useCallback(
    async (action: "clock-in" | "clock-out") => {
      setActionLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/student/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, courseId }),
        });
        const json = await res.json();
        if (!json.success) {
          setError(json.error ?? "Action failed");
        } else {
          await fetchStatus();
        }
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setActionLoading(false);
      }
    },
    [courseId, fetchStatus],
  );

  /* Render states */
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading attendance…
      </div>
    );
  }

  const isClockedIn = status?.isClockedIn ?? false;
  const session = status?.session ?? null;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Status indicator */}
      {isClockedIn && session ? (
        <div className="flex items-center gap-1.5 text-sm text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <Clock className="h-3.5 w-3.5" />
          {/* tick referenced to trigger re-render */}
          <span className="tabular-nums">
            {formatElapsed(session.clockIn)}
          </span>
          <span className="text-green-600 opacity-0 select-none">{tick}</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-sm text-gray-500 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-gray-300" />
          Not clocked in
        </div>
      )}

      {/* Action button */}
      {isClockedIn ? (
        <button
          onClick={() => handleAction("clock-out")}
          disabled={actionLoading}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {actionLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4" />
          )}
          Clock Out
        </button>
      ) : (
        <button
          onClick={() => handleAction("clock-in")}
          disabled={actionLoading}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {actionLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogIn className="h-4 w-4" />
          )}
          Clock In
        </button>
      )}

      {/* Error message */}
      {error && (
        <p className="text-xs text-red-600 w-full">{error}</p>
      )}
    </div>
  );
}
