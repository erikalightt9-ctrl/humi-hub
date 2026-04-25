"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, ChevronLeft, Loader2, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface NotificationItem {
  id:        string;
  type:      string;
  title:     string;
  message:   string;
  linkUrl:   string | null;
  isRead:    boolean;
  createdAt: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff    = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1)  return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24)   return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function EmployeeNotificationsPage() {
  const [items, setItems]       = useState<NotificationItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/notifications?limit=50");
      const json = await res.json() as { success: boolean; data: { data: NotificationItem[] } };
      if (json.success) setItems(json.data.data);
    } catch {
      // non-fatal
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: "POST" });
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
  }

  async function markAllRead() {
    setMarkingAll(true);
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } finally {
      setMarkingAll(false);
    }
  }

  const unreadCount = items.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <a href="/employee/attendance" className="text-gray-400 hover:text-gray-600">
            <ChevronLeft className="h-5 w-5" />
          </a>
          <div>
            <p className="font-bold text-gray-900 text-sm">Notifications</p>
            {unreadCount > 0 && (
              <p className="text-xs text-blue-600">{unreadCount} unread</p>
            )}
          </div>
        </div>
        {unreadCount > 0 && (
          <Button size="sm" variant="outline" disabled={markingAll} onClick={markAllRead}>
            {markingAll
              ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
              : <CheckCheck className="h-3.5 w-3.5 mr-1" />}
            Mark all read
          </Button>
        )}
      </div>

      {/* List */}
      <div className="max-w-lg mx-auto p-4 space-y-2">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
            <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No notifications yet</p>
          </div>
        ) : (
          items.map((n) => (
            <button
              key={n.id}
              className={`w-full text-left rounded-xl border p-4 transition-colors ${
                n.isRead
                  ? "bg-white border-gray-200 hover:bg-gray-50"
                  : "bg-blue-50 border-blue-200 hover:bg-blue-100"
              }`}
              onClick={() => {
                if (!n.isRead) void markRead(n.id);
                if (n.linkUrl) window.location.href = n.linkUrl;
              }}
            >
              <div className="flex items-start gap-3">
                {!n.isRead && (
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 shrink-0" />
                )}
                <div className={n.isRead ? "w-full" : "flex-1 min-w-0"}>
                  <p className="text-sm font-medium text-gray-900 line-clamp-1">{n.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                  <p className="text-[10px] text-gray-400 mt-1.5">{timeAgo(n.createdAt)}</p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
