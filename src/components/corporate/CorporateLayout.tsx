"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { redirect } from "next/navigation";
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  ClipboardList,
  BarChart3,
  Settings,
  LogOut,
  Building2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { ChatWidgetEnhanced } from "@/components/shared/ChatWidgetEnhanced";

// ---------------------------------------------------------------------------
// Primary module nav — flat, no dropdowns/submenus
// ---------------------------------------------------------------------------

interface PrimaryNavItem {
  readonly href: string;
  readonly label: string;
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly match?: "exact" | "prefix";
}

const PRIMARY_NAV: ReadonlyArray<PrimaryNavItem> = [
  { href: "/corporate/dashboard",   label: "Dashboard",   icon: LayoutDashboard, match: "exact" },
  { href: "/corporate/employees",   label: "Employees",   icon: Users },
  { href: "/corporate/enrollments", label: "Enrollments", icon: ClipboardList },
  { href: "/corporate/analytics",   label: "Analytics",   icon: BarChart3 },
  { href: "/corporate/settings",    label: "Settings",    icon: Settings },
];

// ---------------------------------------------------------------------------
// Layout Component
// ---------------------------------------------------------------------------

export function CorporateLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const user = session?.user as
    | { name?: string | null; email?: string | null; role?: string; organizationId?: string }
    | undefined;

  // Accept both "corporate" (regular manager) and "tenant_admin" (org-level admin)
  if (!user || (user.role !== "corporate" && user.role !== "tenant_admin")) {
    redirect("/corporate/login");
  }

  function isActive(item: PrimaryNavItem) {
    if (item.match === "exact") return pathname === item.href;
    return pathname === item.href || pathname.startsWith(item.href + "/");
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* ── Sidebar ── */}
      <aside className="w-56 bg-slate-900 text-white flex flex-col shrink-0">
        {/* Brand */}
        <div className="px-5 py-5 border-b border-slate-700">
          <div className="flex items-center gap-2 font-bold text-base">
            <GraduationCap className="h-5 w-5 text-blue-400 shrink-0" />
            <span>HUMI Corporate</span>
          </div>
        </div>

        {/* Organization badge */}
        <div className="px-4 py-3 border-b border-slate-800">
          <div className="flex items-center gap-2 px-2">
            <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
            <span className="text-sm text-slate-300 truncate">
              {user.name ?? "Corporate Manager"}
            </span>
          </div>
        </div>

        {/* Primary nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {PRIMARY_NAV.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom utilities */}
        <div className="px-3 py-4 border-t border-slate-800">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-slate-300 hover:bg-slate-800 hover:text-white gap-3 px-3"
            onClick={() => signOut({ callbackUrl: "/corporate/login" })}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-end px-8 py-3 border-b border-gray-200 bg-white shrink-0">
          <NotificationBell />
        </div>
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>

      <ChatWidgetEnhanced role="corporate" currentPage={pathname} />
    </div>
  );
}
