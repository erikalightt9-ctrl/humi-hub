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
  Trophy,
  ClipboardCheck,
  FileText,
  TrendingUp,
  Crown,
  Building2,
  Ticket,
  Bell,
  HelpCircle,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SidebarNavGroup } from "@/components/shared/SidebarNavGroup";
import type { NavItem } from "@/components/shared/SidebarNavGroup";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { ChatWidgetEnhanced } from "@/components/shared/ChatWidgetEnhanced";

// ---------------------------------------------------------------------------
// Navigation group definitions
// ---------------------------------------------------------------------------

interface NavGroup {
  readonly label: string;
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly items: ReadonlyArray<NavItem>;
}

const adminNavGroups: ReadonlyArray<NavGroup> = [
  {
    label: "Students",
    icon: Users,
    items: [
      { href: "/admin/students", label: "Student Directory", icon: Users },
      { href: "/admin/engagement", label: "Student Progress", icon: TrendingUp },
      { href: "/admin/attendance", label: "Attendance Records", icon: ClipboardCheck },
    ],
  },
  {
    label: "Trainers",
    icon: UserCog,
    items: [
      { href: "/admin/trainers", label: "Trainer Management", icon: UserCog },
    ],
  },
  {
    label: "Enrollment",
    icon: UserCheck,
    items: [
      { href: "/admin/enrollees", label: "Applications", icon: UserCheck },
    ],
  },
  {
    label: "Payments",
    icon: CreditCard,
    items: [
      { href: "/admin/payments", label: "Payment Records", icon: CreditCard },
      { href: "/admin/subscriptions", label: "AI Subscriptions", icon: Crown },
    ],
  },
  {
    label: "Courses & Learning",
    icon: BookOpen,
    items: [
      { href: "/admin/courses", label: "All Courses", icon: BookOpen },
      { href: "/admin/lessons", label: "Lessons", icon: FileText },
      { href: "/admin/schedules", label: "Training Schedule", icon: CalendarClock },
      { href: "/admin/assignments", label: "Assignments", icon: ClipboardList },
    ],
  },
  {
    label: "Jobs & Opportunities",
    icon: Briefcase,
    items: [
      { href: "/admin/job-postings", label: "Job Listings", icon: Briefcase },
      { href: "/admin/job-applications", label: "Job Applications", icon: ClipboardCheck },
      { href: "/admin/placements", label: "Placements", icon: TrendingUp },
      { href: "/admin/student-ranking", label: "Student Ranking", icon: Trophy },
    ],
  },
  {
    label: "Certificates",
    icon: Award,
    items: [
      { href: "/admin/certificates", label: "Issued Certificates", icon: Award },
    ],
  },
  {
    label: "Communication",
    icon: MessageSquare,
    items: [
      { href: "/admin/communications", label: "Contact Messages", icon: MessageSquare },
      { href: "/admin/messages", label: "Messaging", icon: Mail },
      { href: "/admin/tickets", label: "Support Tickets", icon: Ticket },
      { href: "/admin/knowledge-base", label: "Knowledge Base", icon: HelpCircle },
      { href: "/admin/notifications", label: "Notifications", icon: Bell },
      { href: "/admin/calendar", label: "Calendar", icon: CalendarDays },
      { href: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote },
    ],
  },
  {
    label: "Reports & Analytics",
    icon: BarChart3,
    items: [
      { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/admin/ai-insights", label: "AI Insights", icon: Brain },
      { href: "/admin/control-tower", label: "Control Tower", icon: Rocket },
      { href: "/admin/reports", label: "Reports", icon: FileBarChart },
    ],
  },
  {
    label: "Corporate",
    icon: Building2,
    items: [
      { href: "/admin/organizations", label: "Organizations", icon: Building2 },
    ],
  },
  {
    label: "System Settings",
    icon: Settings,
    items: [
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboardActive = pathname === "/admin";

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-blue-950 text-white flex flex-col shrink-0">
        <div className="px-6 py-5 border-b border-blue-800">
          <div className="flex items-center gap-2 font-bold text-lg">
            <GraduationCap className="h-6 w-6 text-blue-400" />
            <span>HUMI Admin</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {/* Dashboard — standalone link */}
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              isDashboardActive
                ? "bg-blue-700 text-white"
                : "text-blue-200 hover:bg-blue-800 hover:text-white"
            )}
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>

          {/* Separator */}
          <div className="pt-2" />

          {/* Nav Groups */}
          {adminNavGroups.map((group) => (
            <SidebarNavGroup
              key={group.label}
              label={group.label}
              icon={group.icon}
              items={group.items}
            />
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
        <div className="flex items-center justify-end px-8 py-3 border-b border-gray-200 bg-white shrink-0">
          <NotificationBell />
        </div>
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
      <ChatWidgetEnhanced role="admin" currentPage={pathname} />
    </div>
  );
}
