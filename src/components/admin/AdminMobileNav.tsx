"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  CheckSquare,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const mobileNavItems = [
  { href: "/admin",           label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/courses",   label: "Courses",   icon: BookOpen,        exact: false },
  { href: "/admin/students",  label: "Students",  icon: Users,           exact: false },
  { href: "/admin/enrollees", label: "Tasks",     icon: CheckSquare,     exact: false },
  { href: "/admin/settings",  label: "Settings",  icon: Settings,        exact: false },
] as const;

export function AdminMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden">
      <div className="flex">
        {mobileNavItems.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center gap-0.5 py-2.5 px-1 text-xs font-medium transition-colors",
                isActive ? "text-blue-600" : "text-gray-400 hover:text-gray-600",
              )}
            >
              <Icon className={cn("h-5 w-5", isActive ? "text-blue-600" : "text-gray-400")} />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
