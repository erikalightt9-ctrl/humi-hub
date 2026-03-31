"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  GraduationCap,
  CheckSquare,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  { href: "/corporate/dashboard",  label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/corporate/courses",    label: "Courses",   icon: BookOpen },
  { href: "/corporate/employees",  label: "Students",  icon: Users },
  { href: "/corporate/trainers",   label: "Trainers",  icon: GraduationCap },
  { href: "/corporate/tasks",      label: "Tasks",     icon: CheckSquare },
  { href: "/corporate/settings",   label: "Settings",  icon: Settings },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function CorporateSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const user = session?.user as
    | { name?: string | null; email?: string | null }
    | undefined;

  function isActive({ href, exact }: NavItem) {
    return exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <aside className="w-56 bg-ds-surface text-white flex flex-col shrink-0 h-screen">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-white/20">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
            <GraduationCap className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-none">HUMI Hub</p>
            <p className="text-[10px] text-blue-200 mt-0.5">Corporate Portal</p>
          </div>
        </div>
      </div>

      {/* User */}
      {user && (
        <div className="px-4 py-3 border-b border-white/20">
          <p className="text-xs font-medium text-white truncate">
            {user.name ?? user.email ?? "Manager"}
          </p>
          {user.email && (
            <p className="text-[10px] text-blue-200 truncate mt-0.5">{user.email}</p>
          )}
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
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

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-white/20">
        <button
          onClick={() => signOut({ callbackUrl: "/corporate/login" })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-blue-100 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
