"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  FileCheck,
  Award,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { ChatWidgetEnhanced } from "@/components/shared/ChatWidgetEnhanced";

/* ------------------------------------------------------------------ */
/*  Navigation — 5 core items, flat                                    */
/* ------------------------------------------------------------------ */

interface NavItem {
  readonly href: string;
  readonly label: string;
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly exact?: boolean;
}

function buildNavItems(courseId: string): ReadonlyArray<NavItem> {
  return [
    { href: "/student/dashboard",                           label: "Dashboard",   icon: LayoutDashboard, exact: true },
    { href: `/student/courses/${courseId}`,                 label: "My Course",   icon: BookOpen },
    { href: `/student/courses/${courseId}/assignments`,     label: "Assignments", icon: FileCheck },
    { href: "/student/certificates",                        label: "Certificates", icon: Award },
    { href: "/student/settings",                            label: "Settings",    icon: Settings },
  ];
}

/* ------------------------------------------------------------------ */
/*  Layout                                                             */
/* ------------------------------------------------------------------ */

interface StudentLayoutProps {
  readonly courseId: string;
  readonly children: React.ReactNode;
}

export function StudentLayout({ courseId, children }: StudentLayoutProps) {
  const pathname = usePathname();
  const navItems = buildNavItems(courseId);

  function isActive({ href, exact }: NavItem) {
    return exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside className="w-56 bg-slate-900 text-white flex flex-col shrink-0">
        {/* Brand */}
        <div className="px-5 py-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-none">HUMI</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Student Portal</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-emerald-600 text-white"
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
            onClick={() => signOut({ callbackUrl: "/student/login" })}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-end gap-2 px-6 h-14 border-b border-gray-200 bg-white shrink-0">
          <Link
            href="/student/profile"
            title="Profile"
            className={cn(
              "p-2 rounded-lg transition-colors text-sm font-medium",
              pathname.startsWith("/student/profile")
                ? "text-emerald-600 bg-emerald-50"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-100",
            )}
          >
            Profile
          </Link>
          <NotificationBell />
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-8">{children}</main>
      </div>

      <ChatWidgetEnhanced role="student" currentPage={pathname} />
    </div>
  );
}
