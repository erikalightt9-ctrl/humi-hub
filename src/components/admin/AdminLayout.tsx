"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  UserCheck,
  LogOut,
  Download,
  CreditCard,
  BookOpen,
  ClipboardList,
  BarChart3,
  Award,
  MessageSquare,
  FileBarChart,
  Settings,
  UserCog,
  CalendarDays,
  CalendarClock,
  Brain,
  Rocket,
  Briefcase,
  MessageSquareQuote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/students", label: "Students", icon: Users },
  { href: "/admin/enrollees", label: "Enrollees", icon: UserCheck },
  { href: "/admin/schedules", label: "Schedules", icon: CalendarClock },
  { href: "/admin/courses", label: "Courses", icon: BookOpen },
  { href: "/admin/trainers", label: "Trainers", icon: UserCog },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/assignments", label: "Assignments", icon: ClipboardList },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/certificates", label: "Certificates", icon: Award },
  { href: "/admin/communications", label: "Communications", icon: MessageSquare },
  { href: "/admin/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/admin/reports", label: "Reports", icon: FileBarChart },
  { href: "/admin/ai-insights", label: "AI Insights", icon: Brain },
  { href: "/admin/control-tower", label: "Control Tower", icon: Rocket },
  { href: "/admin/job-postings", label: "Job Postings", icon: Briefcase },
  { href: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-blue-950 text-white flex flex-col shrink-0">
        <div className="px-6 py-5 border-b border-blue-800">
          <div className="flex items-center gap-2 font-bold text-lg">
            <GraduationCap className="h-6 w-6 text-blue-400" />
            <span>VA Admin</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                (pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href)))
                  ? "bg-blue-700 text-white"
                  : "text-blue-200 hover:bg-blue-800 hover:text-white"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-blue-800 space-y-1">
          <a
            href="/api/admin/export"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-blue-200 hover:bg-blue-800 hover:text-white transition-colors"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </a>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-blue-200 hover:bg-blue-800 hover:text-white gap-3 px-3"
            onClick={() => signOut({ callbackUrl: "/portal?tab=admin" })}
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
