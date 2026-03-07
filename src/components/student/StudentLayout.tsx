"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  FileCheck,
  MessageSquare,
  Trophy,
  Bot,
  Award,
  CalendarDays,
  UserCircle,
  Target,
  Sparkles,
  Zap,
  Briefcase,
  Users,
  Mic,
  Activity,
  Search,
  LogOut,
  BookMarked,
  BarChart3,
  TreePine,
  FileText,
  Star,
  MessagesSquare,
  Heart,
  Settings,
  Mail,
  BarChart2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SidebarNavGroup } from "@/components/student/SidebarNavGroup";

interface NavItem {
  readonly href: string;
  readonly label: string;
  readonly icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  readonly label: string;
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly items: ReadonlyArray<NavItem>;
}

function buildNavGroups(courseId: string): ReadonlyArray<NavGroup> {
  return [
    {
      label: "Learning",
      icon: BookMarked,
      items: [
        { href: `/student/courses/${courseId}`, label: "My Course", icon: BookOpen },
        { href: `/student/courses/${courseId}/quizzes`, label: "Quizzes", icon: ClipboardList },
        { href: `/student/courses/${courseId}/assignments`, label: "Assignments", icon: FileCheck },
        { href: "/student/ai-practice", label: "AI Practice", icon: Bot },
      ],
    },
    {
      label: "AI Lab",
      icon: Sparkles,
      items: [
        { href: "/student/ai-simulator", label: "VA Simulator", icon: Users },
        { href: "/student/ai-tasks", label: "Task Generator", icon: Zap },
        { href: "/student/ai-assessments", label: "AI Review", icon: Target },
        { href: "/student/ai-interviews", label: "Mock Interviews", icon: Mic },
        { href: "/student/business-assistant", label: "Biz Assistant", icon: Briefcase },
        { href: "/student/ai-email-practice", label: "Email Practice", icon: Mail },
        { href: "/student/ai-feedback-engine", label: "Feedback Engine", icon: BarChart2 },
      ],
    },
    {
      label: "Career",
      icon: Briefcase,
      items: [
        { href: "/student/job-matches", label: "Job Matches", icon: Search },
        { href: "/student/resume-builder", label: "Resume Builder", icon: FileText },
        { href: "/student/portfolio", label: "Portfolio", icon: UserCircle },
        { href: "/student/career-readiness", label: "Career Readiness", icon: Target },
        { href: "/student/employer-feedback", label: "Employer Feedback", icon: Star },
      ],
    },
    {
      label: "Progress",
      icon: BarChart3,
      items: [
        { href: "/student/learning-analytics", label: "Learning Analytics", icon: BarChart3 },
        { href: "/student/skill-tree", label: "Skill Tree", icon: TreePine },
        { href: "/student/certificates", label: "Certificates", icon: Award },
        { href: "/student/work-pace", label: "Work Pace", icon: Activity },
      ],
    },
    {
      label: "Community",
      icon: MessagesSquare,
      items: [
        { href: "/student/forum", label: "Student Forum", icon: MessageSquare },
        { href: `/student/courses/${courseId}/forum`, label: "Course Forum", icon: MessagesSquare },
        { href: `/student/courses/${courseId}/leaderboard`, label: "Leaderboard", icon: Trophy },
        { href: "/student/calendar", label: "Calendar", icon: CalendarDays },
        { href: "/student/mentorship", label: "Mentorship", icon: Heart },
      ],
    },
  ];
}

interface StandaloneNavItem {
  readonly href: string;
  readonly label: string;
  readonly icon: React.ComponentType<{ className?: string }>;
}

const bottomNavItems: ReadonlyArray<StandaloneNavItem> = [
  { href: "/student/profile", label: "Profile", icon: UserCircle },
  { href: "/student/settings", label: "Settings", icon: Settings },
];

interface StudentLayoutProps {
  readonly courseId: string;
  readonly children: React.ReactNode;
}

export function StudentLayout({ courseId, children }: StudentLayoutProps) {
  const pathname = usePathname();
  const navGroups = buildNavGroups(courseId);

  const isDashboardActive = pathname === "/student/dashboard";

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-blue-950 text-white flex flex-col shrink-0">
        <div className="px-6 py-5 border-b border-blue-800">
          <div className="flex items-center gap-2 font-bold text-lg">
            <GraduationCap className="h-6 w-6 text-blue-400" />
            <span>VA Student</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {/* Dashboard — standalone */}
          <Link
            href="/student/dashboard"
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
          {navGroups.map((group) => (
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
                    : "text-blue-200 hover:bg-blue-800 hover:text-white"
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
            onClick={() => signOut({ callbackUrl: "/student/login" })}
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
