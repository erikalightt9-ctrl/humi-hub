"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  Users,
  ClipboardCheck,
  UserCircle,
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

const NAV_ITEMS: ReadonlyArray<NavItem> = [
  { href: "/trainer",             label: "Dashboard",   icon: LayoutDashboard, exact: true },
  { href: "/trainer/courses",     label: "Courses",     icon: BookOpen },
  { href: "/trainer/students",    label: "Students",    icon: Users },
  { href: "/trainer/submissions", label: "Submissions", icon: ClipboardCheck },
  { href: "/trainer/profile",     label: "Profile",     icon: UserCircle },
];

/* ------------------------------------------------------------------ */
/*  Layout                                                             */
/* ------------------------------------------------------------------ */

interface TrainerLayoutProps {
  readonly children: React.ReactNode;
}

export function TrainerLayout({ children }: TrainerLayoutProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const trainerName = session?.user?.name ?? "Trainer";

  function isActive({ href, exact }: NavItem) {
    return exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <div className="flex h-screen bg-ds-bg overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside className="w-56 bg-ds-surface text-ds-text flex flex-col shrink-0">
        {/* Brand */}
        <div className="px-5 py-5 border-b border-ds-border">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-ds-text leading-none">HUMI</p>
              <p className="text-[10px] text-ds-muted mt-0.5">Trainer Portal</p>
            </div>
          </div>
        </div>

        {/* User */}
        <div className="px-4 py-3 border-b border-ds-border">
          <p className="text-xs font-medium text-ds-text truncate">{trainerName}</p>
          <p className="text-[10px] text-ds-muted mt-0.5">Trainer</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  active
                    ? "bg-indigo-600 text-white"
                    : "text-ds-muted hover:bg-ds-card hover:text-ds-text",
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Sign out */}
        <div className="px-3 py-4 border-t border-ds-border">
          <button
            onClick={() => signOut({ callbackUrl: "/trainer/login" })}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-ds-muted hover:bg-ds-card hover:text-ds-text transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-end gap-2 px-6 h-14 border-b border-ds-border bg-ds-surface shrink-0">
          <NotificationBell />
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-8">{children}</main>
      </div>

      <ChatWidgetEnhanced role="trainer" currentPage={pathname} />
    </div>
  );
}
