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
  Shield,
  ExternalLink,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { ChatWidgetEnhanced } from "@/components/shared/ChatWidgetEnhanced";
import { AdminProfileDropdown } from "@/components/admin/AdminProfileDropdown";
import { AdminMobileNav } from "@/components/admin/AdminMobileNav";
import { signOut, useSession } from "next-auth/react";

/* ------------------------------------------------------------------ */
/*  Navigation — 6 core items, flat                                    */
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
  { href: "/admin/revenue",   label: "Revenue",   icon: DollarSign },
  { href: "/admin/settings",  label: "Settings",  icon: Settings },
];

/* ------------------------------------------------------------------ */
/*  Layout                                                             */
/* ------------------------------------------------------------------ */

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: session } = useSession();
  const isSuperAdmin = (session?.user as { isSuperAdmin?: boolean })?.isSuperAdmin === true;

  function isActive({ href, exact }: NavItem) {
    return exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <div className="flex h-screen bg-ds-bg overflow-hidden">

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside
        className={cn(
          "w-56 bg-ds-surface text-white flex flex-col shrink-0",
          "fixed inset-y-0 left-0 z-50 transition-transform duration-200",
          "md:relative md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* Brand */}
        <div className="px-5 py-5 border-b border-white/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-none">Humi Hub</p>
              <p className="text-[10px] text-blue-200 mt-0.5">Admin Portal</p>
            </div>
          </div>
          <button
            className="md:hidden p-1 rounded-lg text-blue-100 hover:text-white hover:bg-white/10 transition-colors"
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
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  active
                    ? "bg-white/20 text-white"
                    : "text-blue-100 hover:bg-white/10 hover:text-white",
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Platform Admin shortcut — superadmin only */}
        {isSuperAdmin && (
          <div className="px-3 pb-2 border-t border-white/20 pt-3">
            <p className="text-[10px] font-semibold text-blue-300 uppercase tracking-widest px-3 mb-1.5">
              Platform
            </p>
            <Link
              href="/superadmin"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-blue-100 hover:bg-white/10 hover:text-white transition-colors"
            >
              <Shield className="h-4 w-4 shrink-0" />
              Multi-Tenant Admin
              <ExternalLink className="h-3 w-3 ml-auto shrink-0 opacity-60" />
            </Link>
          </div>
        )}

        {/* Sign out */}
        <div className="px-3 py-4 border-t border-white/20">
          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-blue-100 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="flex items-center gap-3 px-4 md:px-6 h-14 border-b border-white/20 bg-ds-surface shrink-0">
          <button
            className="md:hidden p-2 rounded-xl text-white hover:bg-white/10 transition-colors shrink-0"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Logo — mobile only */}
          <div className="flex items-center gap-2 font-bold text-sm text-white md:hidden">
            <GraduationCap className="h-5 w-5 text-ds-primary" />
            Humi Hub Admin
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
