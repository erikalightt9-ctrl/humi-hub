"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  FileText,
  Palette,
  BookOpen,
  Users,
  BarChart3,
  MessageSquare,
  Bell,
  Headphones,
  Settings,
  LogOut,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/*  Navigation items                                                   */
/* ------------------------------------------------------------------ */

interface NavItem {
  readonly href: string;
  readonly label: string;
  readonly icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: ReadonlyArray<NavItem> = [
  { href: "/corporate/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/corporate/builder", label: "Pages", icon: FileText },
  { href: "/corporate/theme", label: "Theme Customization", icon: Palette },
  { href: "/corporate/courses", label: "Courses", icon: BookOpen },
  { href: "/corporate/employees", label: "Students", icon: Users },
  { href: "/corporate/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/corporate/messages", label: "Messages", icon: MessageSquare },
  { href: "/corporate/announcements", label: "Announcements", icon: Bell },
  { href: "/corporate/support", label: "Support", icon: Headphones },
  { href: "/corporate/settings", label: "Settings", icon: Settings },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function CorporateSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const user = session?.user as
    | { name?: string | null; email?: string | null; role?: string; organizationId?: string }
    | undefined;

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col shrink-0 h-screen">
      {/* Logo area */}
      <div className="px-6 py-5 border-b border-gray-700">
        <div className="flex items-center gap-2 font-bold text-lg">
          <GraduationCap className="h-6 w-6 text-blue-400" />
          <span>HUMI Corporate</span>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white",
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User info + logout at bottom */}
      <div className="px-3 py-4 border-t border-gray-800 space-y-2">
        {user && (
          <div className="px-3 py-2">
            <p className="text-xs font-medium text-gray-400 truncate">
              {user.name ?? user.email ?? "Corporate Manager"}
            </p>
            {user.email && (
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            )}
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-gray-300 hover:bg-gray-800 hover:text-white gap-3 px-3"
          onClick={() => signOut({ callbackUrl: "/corporate/login" })}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
