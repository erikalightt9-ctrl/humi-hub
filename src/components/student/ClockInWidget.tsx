"use client";

import { useState, useEffect, useCallback } from "react";
import { Clock, LogIn, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SessionData {
  readonly id: string;
  readonly clockIn: string;
}

interface StatusResponse {
  readonly success: boolean;
  readonly data: {
    readonly isClockedIn: boolean;
    readonly session: SessionData | null;
  } | null;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatElapsed(startIso: string): string {
  const diffMs = Date.now() - new Date(startIso).getTime();
  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, "0");

  if (hours > 0) return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  return `${pad(minutes)}:${pad(seconds)}`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ClockInWidget() {
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [session, setSession] = useState<SessionData | null>(null);
  const [elapsed, setElapsed] = useState("00:00");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  /* Fetch current status */
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/student/attendance");
      const json: StatusResponse = await res.json();
      if (json.success && json.data) {
        setIsClockedIn(json.data.isClockedIn);
        setSession(json.data.session);
      }
    } catch {
      /* silent — widget is non-critical */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  /* Live timer tick */
  useEffect(() => {
    if (!isClockedIn || !session) return;

    const tick = () => setElapsed(formatElapsed(session.clockIn));
    tick(); // immediate

    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isClockedIn, session]);

  /* Toggle clock in / out */
  async function handleToggle() {
    setError("");
    setActionLoading(true);

    const action = isClockedIn ? "clock-out" : "clock-in";

    try {
      const res = await fetch("/api/student/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const json = await res.json();

      if (!json.success) {
        // 409 = conflict (already clocked in/out) — auto-recover by re-syncing
        if (res.status === 409) {
          await fetchStatus();
          return;
        }
        setError(json.error ?? "Something went wrong");
        return;
      }

      // Refresh status from server to stay in sync
      await fetchStatus();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        <span className="text-sm text-gray-400">Loading attendance…</span>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors ${
        isClockedIn
          ? "bg-green-50 border-green-200"
          : "bg-white border-gray-200"
      }`}
    >
      {/* Left: Status */}
      <div className="flex items-center gap-3">
        {isClockedIn ? (
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
          </span>
        ) : (
          <Clock className="h-5 w-5 text-gray-400" />
        )}

        <div>
          {isClockedIn && session ? (
            <>
              <p className="text-sm font-semibold text-green-700">
                Clocked In — {formatTime(session.clockIn)}
              </p>
              <p className="text-xs text-green-600 font-mono">{elapsed}</p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-gray-700">Not Clocked In</p>
              <p className="text-xs text-gray-500">
                Clock in to mark your attendance
              </p>
            </>
          )}
        </div>
      </div>

      {/* Right: Action */}
      <div className="flex items-center gap-3">
        {error && (
          <span className="text-xs text-red-600">{error}</span>
        )}
        <Button
          size="sm"
          onClick={handleToggle}
          disabled={actionLoading}
          className={
            isClockedIn
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "bg-green-600 hover:bg-green-700 text-white"
          }
        >
          {actionLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isClockedIn ? (
            <>
              <LogOut className="h-4 w-4 mr-1.5" />
              Clock Out
            </>
          ) : (
            <>
              <LogIn className="h-4 w-4 mr-1.5" />
              Clock In
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
