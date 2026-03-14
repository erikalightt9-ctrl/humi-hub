"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, Check, CheckCheck } from "lucide-react";
import { NOTIFICATION_TYPE_LABELS } from "@/lib/constants/communications";

interface NotificationItem {
  readonly id: string;
  readonly type: string;
  readonly title: string;
  readonly message: string;
  readonly linkUrl: string | null;
  readonly isRead: boolean;
  readonly createdAt: string;
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/notifications?page=${p}&limit=20`);
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data.data);
        setTotalPages(data.data.totalPages);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchNotifications(page);
  }, [page, fetchNotifications]);

  async function markAsRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: "POST" });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  }

  async function markAllRead() {
    await fetch("/api/notifications/read-all", { method: "POST" });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 text-sm mt-1">Stay updated on your activity</p>
        </div>
        <button
          onClick={markAllRead}
          className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800"
        >
          <CheckCheck className="h-4 w-4" />
          Mark all as read
        </button>
      </div>

      <div className="bg-white rounded-xl shadow divide-y divide-gray-100">
        {loading ? (
          <div className="p-10 text-center text-gray-400">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="p-10 text-center">
            <Bell className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No notifications yet</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-4 px-5 py-4 transition ${
                n.isRead ? "" : "bg-blue-50/40"
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  {!n.isRead && <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />}
                  <span className="text-xs text-gray-400 font-medium">
                    {NOTIFICATION_TYPE_LABELS[n.type] ?? n.type}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-800">{n.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                <p className="text-[10px] text-gray-400 mt-1">
                  {new Date(n.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!n.isRead && (
                  <button
                    onClick={() => markAsRead(n.id)}
                    className="p-1 text-gray-400 hover:text-blue-600"
                    title="Mark as read"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
                {n.linkUrl && (
                  <a
                    href={n.linkUrl}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    View
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40"
          >
            Previous
          </button>
          <span className="px-3 py-1.5 text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
