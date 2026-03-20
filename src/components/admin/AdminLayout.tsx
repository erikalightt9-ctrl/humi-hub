"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  UserCheck,
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
  Search,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SidebarNavGroup } from "@/components/shared/SidebarNavGroup";
import type { NavItem } from "@/components/shared/SidebarNavGroup";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { ChatWidgetEnhanced } from "@/components/shared/ChatWidgetEnhanced";
import { AdminProfileDropdown } from "@/components/admin/AdminProfileDropdown";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { AdminMobileNav } from "@/components/admin/AdminMobileNav";

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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "w-64 bg-blue-950 text-white flex flex-col shrink-0",
          // Mobile: fixed overlay drawer
          "fixed inset-y-0 left-0 z-50 transition-transform duration-200",
          // Desktop: always visible inline
          "md:relative md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="px-6 py-5 border-b border-blue-800 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg">
            <GraduationCap className="h-6 w-6 text-blue-400" />
            <span>HUMI Admin</span>
          </div>
          {/* Close button — mobile only */}
          <button
            className="md:hidden p-1 rounded-lg text-blue-300 hover:text-white hover:bg-blue-800 transition-colors"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {/* Dashboard — standalone link */}
          <Link
            href="/admin"
            onClick={() => setSidebarOpen(false)}
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
              onNavigate={() => setSidebarOpen(false)}
            />
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-blue-800">
          <a
            href="/api/admin/export"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-blue-200 hover:bg-blue-800 hover:text-white transition-colors"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </a>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="flex items-center gap-3 px-4 md:px-6 py-3 border-b border-gray-200 bg-white shrink-0">
          {/* Hamburger — mobile only */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors shrink-0"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Logo — mobile only */}
          <div className="flex items-center gap-2 font-bold text-base text-blue-950 md:hidden">
            <GraduationCap className="h-5 w-5 text-blue-600" />
            <span>HUMI Admin</span>
          </div>

          {/* Breadcrumb — desktop only */}
          <div className="hidden md:block min-w-0 flex-1">
            <AdminBreadcrumb />
          </div>

          {/* Right: search (desktop) + notifications + profile */}
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="search"
                placeholder="Search…"
                className="w-48 pl-9 pr-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
            </div>
            <NotificationBell />
            <AdminProfileDropdown />
          </div>
        </header>

        {/* Page content — extra bottom padding on mobile for bottom nav */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8">{children}</main>
      </div>

      {/* Mobile bottom navigation */}
      <AdminMobileNav />

      <ChatWidgetEnhanced role="admin" currentPage={pathname} />
    </div>
  );
}
