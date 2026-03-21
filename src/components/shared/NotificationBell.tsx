"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";

interface NotificationItem {
  readonly id: string;
  readonly type: string;
  readonly title: string;
  readonly message: string;
  readonly linkUrl: string | null;
  readonly isRead: boolean;
  readonly createdAt: string;
}

export function NotificationBell() {
  const pathname = usePathname();
  const isNotificationsPage = pathname?.endsWith("/notifications") ?? false;
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/unread-count");
      const data = await res.json();
      if (data.success) setCount(data.data.count);
    } catch { /* ignore */ }
  }, []);

  const fetchRecent = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=5");
      const data = await res.json();
      if (data.success) setNotifications(data.data.data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [fetchCount]);

  useEffect(() => {
    if (open) fetchRecent();
  }, [open, fetchRecent]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function markAsRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: "POST" });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setCount((c) => Math.max(0, c - 1));
  }

  async function markAllRead() {
    await fetch("/api/notifications/read-all", { method: "POST" });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setCount(0);
  }

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  const notificationsHref = pathname?.includes("/admin")
    ? "/admin/notifications"
    : pathname?.includes("/trainer")
    ? "/trainer/notifications"
    : pathname?.includes("/corporate")
    ? "/corporate/notifications"
    : "/student/notifications";

  return (
    <div className="relative" ref={dropdownRef}>
      {isNotificationsPage ? (
        <div className="relative p-2 text-blue-600" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4.5 h-4.5 flex items-center justify-center min-w-[18px] px-1">
              {count > 99 ? "99+" : count}
            </span>
          )}
        </div>
      ) : (
        <button
          onClick={() => setOpen((v) => !v)}
          className="relative p-2 text-gray-400 hover:text-gray-600 transition"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4.5 h-4.5 flex items-center justify-center min-w-[18px] px-1">
              {count > 99 ? "99+" : count}
            </span>
          )}
        </button>
      )}

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-sm text-gray-900">Notifications</h3>
            {count > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-400">
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    if (!n.isRead) markAsRead(n.id);
                    if (n.linkUrl) window.location.href = n.linkUrl;
                    setOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition ${
                    n.isRead ? "" : "bg-blue-50/50"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!n.isRead && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 shrink-0" />
                    )}
                    <div className={n.isRead ? "ml-4" : ""}>
                      <p className="text-sm font-medium text-gray-800 line-clamp-1">
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                        {n.message}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          <a
            href={notificationsHref}
            className="block text-center py-2.5 text-xs text-blue-600 hover:text-blue-800 border-t border-gray-100 font-medium"
          >
            View all notifications
          </a>
        </div>
      )}
    </div>
  );
}
