"use client";

import { useEffect, useState, useCallback } from "react";
import { Lock, Clock, Send, CheckCircle2, AlertTriangle } from "lucide-react";

interface AccountLockedBannerProps {
  readonly lockUntil: string; // ISO timestamp
  readonly email: string;
  readonly provider: "student" | "trainer" | "humi-admin" | "corporate" | "admin";
  /** Called when the lock expires so the parent can re-enable the form */
  readonly onUnlocked: () => void;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "0:00";
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function AccountLockedBanner({
  lockUntil,
  email,
  provider,
  onUnlocked,
}: AccountLockedBannerProps) {
  const lockUntilMs = new Date(lockUntil).getTime();
  const [remaining, setRemaining] = useState(() => Math.max(0, lockUntilMs - Date.now()));
  const [requestState, setRequestState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  // Countdown tick — `remaining` is intentionally excluded from deps to avoid
  // restarting the interval on every tick. The interval reads lockUntilMs via
  // closure (stable) and computes the remaining time fresh each tick.
  useEffect(() => {
    if (lockUntilMs <= Date.now()) {
      onUnlocked();
      return;
    }
    const id = setInterval(() => {
      const left = Math.max(0, lockUntilMs - Date.now());
      setRemaining(left);
      if (left <= 0) {
        clearInterval(id);
        onUnlocked();
      }
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lockUntilMs, onUnlocked]);

  const handleRequestUnlock = useCallback(async () => {
    setRequestState("sending");
    try {
      const res = await fetch("/api/auth/request-unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, provider }),
      });
      const data = (await res.json()) as { ok: boolean };
      setRequestState(data.ok ? "sent" : "error");
    } catch {
      setRequestState("error");
    }
  }, [email, provider]);

  const minutesLeft = Math.ceil(remaining / 60000);

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0 h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
          <Lock className="h-4 w-4 text-red-600" />
        </div>
        <div>
          <p className="font-semibold text-red-800 text-sm">Account temporarily locked</p>
          <p className="text-red-700 text-xs mt-0.5">
            Too many failed login attempts. Try again after the cooldown or request an early unlock.
          </p>
        </div>
      </div>

      {/* Countdown */}
      <div className="flex items-center gap-2 bg-white border border-red-200 rounded-lg px-3 py-2">
        <Clock className="h-4 w-4 text-red-500 shrink-0" />
        <span className="text-sm text-gray-700">
          Unlocks in{" "}
          <span className="font-mono font-bold text-red-700 tabular-nums">
            {formatCountdown(remaining)}
          </span>
          {minutesLeft > 0 && (
            <span className="text-gray-500 text-xs ml-1">
              (~{minutesLeft} min{minutesLeft !== 1 ? "s" : ""})
            </span>
          )}
        </span>
      </div>

      {/* Request Unlock CTA */}
      {requestState === "sent" ? (
        <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-sm">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Unlock request sent to admin. They will review shortly.
        </div>
      ) : requestState === "error" ? (
        <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Could not send request. Please contact admin directly.
        </div>
      ) : (
        <button
          type="button"
          onClick={handleRequestUnlock}
          disabled={requestState === "sending"}
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Send className="h-4 w-4" />
          {requestState === "sending" ? "Sending request…" : "Request Unlock from Admin"}
        </button>
      )}
    </div>
  );
}
