"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  GraduationCap,
  LayoutDashboard,
  CalendarClock,
  Users,
  BookOpen,
  ClipboardCheck,
  Star,
  UserCircle,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SidebarNavGroup } from "@/components/shared/SidebarNavGroup";
import type { NavItem } from "@/components/shared/SidebarNavGroup";

// ---------------------------------------------------------------------------
// Navigation group definitions
// ---------------------------------------------------------------------------

interface NavGroup {
  readonly label: string;
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly items: ReadonlyArray<NavItem>;
}

const trainerNavGroups: ReadonlyArray<NavGroup> = [
  {
    label: "Training",
    icon: CalendarClock,
    items: [
      { href: "/trainer/schedule", label: "My Schedule", icon: CalendarClock },
      { href: "/trainer/students", label: "My Students", icon: Users },
    ],
  },
  {
    label: "Content",
    icon: BookOpen,
    items: [
      { href: "/trainer/courses", label: "My Courses", icon: BookOpen },
      { href: "/trainer/submissions", label: "Grading Queue", icon: ClipboardCheck },
    ],
  },
  {
    label: "Feedback",
    icon: Star,
    items: [
      { href: "/trainer/ratings", label: "My Ratings", icon: Star },
    ],
  },
];

interface StandaloneNavItem {
  readonly href: string;
  readonly label: string;
  readonly icon: React.ComponentType<{ className?: string }>;
}

const bottomNavItems: ReadonlyArray<StandaloneNavItem> = [
  { href: "/trainer/profile", label: "Profile", icon: UserCircle },
];

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

interface TrainerLayoutProps {
  readonly children: React.ReactNode;
}

export function TrainerLayout({ children }: TrainerLayoutProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isDashboardActive = pathname === "/trainer";
  const trainerName = session?.user?.name ?? "Trainer";

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-blue-950 text-white flex flex-col shrink-0">
        <div className="px-6 py-5 border-b border-blue-800">
          <div className="flex items-center gap-2 font-bold text-lg">
            <GraduationCap className="h-6 w-6 text-blue-400" />
            <span>HUMI Trainer Portal</span>
          </div>
          <p className="text-blue-300 text-xs mt-1 truncate">{trainerName}</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {/* Dashboard -- standalone link */}
          <Link
            href="/trainer"
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              isDashboardActive
                ? "bg-blue-700 text-white"
                : "text-blue-200 hover:bg-blue-800 hover:text-white",
            )}
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>

          {/* Separator */}
          <div className="pt-2" />

          {/* Nav Groups */}
          {trainerNavGroups.map((group) => (
            <SidebarNavGroup
              key={group.label}
              label={group.label}
              icon={group.icon}
              items={group.items}
            />
          ))}

          {/* Separator */}
          <div className="pt-2" />

          {/* Bottom standalone items */}
          {bottomNavItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-700 text-white"
                    : "text-blue-200 hover:bg-blue-800 hover:text-white",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-blue-800">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-blue-200 hover:bg-blue-800 hover:text-white gap-3 px-3"
            onClick={() => signOut({ callbackUrl: "/trainer/login" })}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
