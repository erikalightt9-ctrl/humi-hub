"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle, Link2, Link2Off, Loader2, RefreshCw } from "lucide-react";

// Google icon SVG (official colour mark)
function GoogleIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

// ── Types ──────────────────────────────────────────────────────────────────────

interface GoogleCalendarConnectProps {
  /** Called when the connection state changes */
  onStatusChange?: (connected: boolean) => void;
  /** Compact mode for embedding inside top bar */
  compact?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function GoogleCalendarConnect({
  onStatusChange,
  compact = false,
}: GoogleCalendarConnectProps) {
  const [connected, setConnected] = useState<boolean | null>(null); // null = loading
  const [disconnecting, setDisconnecting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Check connection status on mount (and when returning from OAuth)
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/google/calendar/status");
      const data = await res.json();
      if (data.success) {
        setConnected(data.data.connected);
        onStatusChange?.(data.data.connected);
      }
    } catch {
      setConnected(false);
    }
  }, [onStatusChange]);

  useEffect(() => {
    fetchStatus();

    // Show success/error toast if redirected back from OAuth
    const url = new URL(window.location.href);
    const googleParam = url.searchParams.get("google");
    if (googleParam === "connected") {
      setSuccessMsg("Google Calendar connected!");
      // Clean up the URL param without a page reload
      url.searchParams.delete("google");
      window.history.replaceState({}, "", url.toString());
    }
  }, [fetchStatus]);

  async function handleDisconnect() {
    if (!confirm("Disconnect Google Calendar? Future events won't sync.")) return;
    setDisconnecting(true);
    try {
      const res = await fetch("/api/google/calendar/disconnect", {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setConnected(false);
        onStatusChange?.(false);
        setSuccessMsg("");
      }
    } catch {
      /* silent */
    } finally {
      setDisconnecting(false);
    }
  }

  function handleConnect() {
    // Navigate to OAuth initiation route
    window.location.href = "/api/auth/google";
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (connected === null) {
    return (
      <div className="flex items-center gap-1.5 text-gray-400 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        {!compact && <span>Checking Google Calendar…</span>}
      </div>
    );
  }

  // ── Connected ─────────────────────────────────────────────────────────────
  if (connected) {
    if (compact) {
      return (
        <div className="flex items-center gap-1.5">
          {successMsg && (
            <span className="text-xs text-green-600 font-medium">{successMsg}</span>
          )}
          <button
            onClick={fetchStatus}
            title="Refresh sync status"
            className="p-1 rounded hover:bg-gray-100"
          >
            <RefreshCw className="h-3.5 w-3.5 text-green-500" />
          </button>
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            title="Disconnect Google Calendar"
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors px-2 py-1 rounded-lg border border-gray-200 hover:border-red-200"
          >
            {disconnecting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Link2Off className="h-3.5 w-3.5" />
            )}
            <GoogleIcon size={13} />
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-2">
        {successMsg && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            <CheckCircle className="h-4 w-4 shrink-0" />
            {successMsg}
          </div>
        )}
        <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200">
          <div className="flex items-center gap-2 flex-1">
            <div className="w-8 h-8 rounded-full bg-green-50 border border-green-200 flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-green-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">Google Calendar</p>
              <p className="text-xs text-green-600">Connected · syncing events</p>
            </div>
          </div>
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-lg px-3 py-1.5 transition-colors"
          >
            {disconnecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Link2Off className="h-4 w-4" />
            )}
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  // ── Not connected ─────────────────────────────────────────────────────────
  if (compact) {
    return (
      <button
        onClick={handleConnect}
        className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-blue-600 border border-gray-200 hover:border-blue-300 rounded-lg px-2.5 py-1.5 transition-colors"
        title="Connect Google Calendar"
      >
        <GoogleIcon size={13} />
        <Link2 className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Connect</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200">
      <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center">
        <GoogleIcon size={18} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-800">Google Calendar</p>
        <p className="text-xs text-gray-500">Sync your events with Google Calendar</p>
      </div>
      <button
        onClick={handleConnect}
        className="flex items-center gap-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg px-4 py-2 transition-colors"
      >
        <GoogleIcon size={14} />
        Connect
      </button>
    </div>
  );
}

// ── Sync badge shown on individual events ─────────────────────────────────────

export function GoogleSyncBadge({ synced }: { synced: boolean }) {
  if (!synced) return null;
  return (
    <span
      title="Synced to Google Calendar"
      className="inline-flex items-center"
    >
      <GoogleIcon size={10} />
    </span>
  );
}
