"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  Users,
  UserCog,
  CheckSquare,
  Settings,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { ChatWidgetEnhanced } from "@/components/shared/ChatWidgetEnhanced";
import { AdminProfileDropdown } from "@/components/admin/AdminProfileDropdown";
import { AdminMobileNav } from "@/components/admin/AdminMobileNav";
import { signOut } from "next-auth/react";

/* ------------------------------------------------------------------ */
/*  Navigation — 6 core items, flat (no groups/dropdowns)             */
/* ------------------------------------------------------------------ */

interface NavItem {
  readonly href: string;
  readonly label: string;
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly exact?: boolean;
}

const NAV_ITEMS: ReadonlyArray<NavItem> = [
  { href: "/admin",           label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/courses",   label: "Courses",   icon: BookOpen },
  { href: "/admin/students",  label: "Students",  icon: Users },
  { href: "/admin/trainers",  label: "Trainers",  icon: UserCog },
  { href: "/admin/enrollees", label: "Tasks",     icon: CheckSquare },
  { href: "/admin/settings",  label: "Settings",  icon: Settings },
];

/* ------------------------------------------------------------------ */
/*  Layout                                                             */
/* ------------------------------------------------------------------ */

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function isActive({ href, exact }: NavItem) {
    return exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside
        className={cn(
          "w-56 bg-slate-900 text-white flex flex-col shrink-0",
          "fixed inset-y-0 left-0 z-50 transition-transform duration-200",
          "md:relative md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* Brand */}
        <div className="px-5 py-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-none">HUMI</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Admin Portal</p>
            </div>
          </div>
          <button
            className="md:hidden p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-blue-600 text-white"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white",
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Sign out */}
        <div className="px-3 py-4 border-t border-slate-800">
          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="flex items-center gap-3 px-4 md:px-6 h-14 border-b border-gray-200 bg-white shrink-0">
          <button
            className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors shrink-0"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Logo — mobile only */}
          <div className="flex items-center gap-2 font-bold text-base text-slate-900 md:hidden">
            <GraduationCap className="h-5 w-5 text-blue-600" />
            HUMI Admin
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2 shrink-0">
            <NotificationBell />
            <AdminProfileDropdown />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <AdminMobileNav />

      <ChatWidgetEnhanced role="admin" currentPage={pathname} />
    </div>
  );
}
