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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NavItem {
  readonly href: string;
  readonly label: string;
  readonly icon: React.ComponentType<{ className?: string }>;
}

function buildNavItems(courseId: string): ReadonlyArray<NavItem> {
  return [
    { href: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: `/student/courses/${courseId}`, label: "My Course", icon: BookOpen },
    { href: `/student/courses/${courseId}/quizzes`, label: "Quizzes", icon: ClipboardList },
    { href: `/student/courses/${courseId}/assignments`, label: "Assignments", icon: FileCheck },
    { href: `/student/courses/${courseId}/forum`, label: "Forum", icon: MessageSquare },
    { href: `/student/courses/${courseId}/leaderboard`, label: "Leaderboard", icon: Trophy },
    { href: "/student/ai-practice", label: "AI Practice", icon: Bot },
    { href: "/student/certificates", label: "Certificates", icon: Award },
    { href: "/student/calendar", label: "Calendar", icon: CalendarDays },
    { href: "/student/portfolio", label: "Portfolio", icon: UserCircle },
    { href: "/student/career-readiness", label: "Career Score", icon: Target },
    { href: "/student/ai-assessments", label: "AI Review", icon: Sparkles },
    { href: "/student/ai-tasks", label: "Task Generator", icon: Zap },
    { href: "/student/business-assistant", label: "Biz Assistant", icon: Briefcase },
    { href: "/student/ai-simulator", label: "VA Simulator", icon: Users },
    { href: "/student/ai-interviews", label: "Mock Interview", icon: Mic },
    { href: "/student/work-pace", label: "Work Pace", icon: Activity },
    { href: "/student/job-matches", label: "Job Matches", icon: Search },
  ];
}

interface StudentLayoutProps {
  readonly courseId: string;
  readonly children: React.ReactNode;
}

export function StudentLayout({ courseId, children }: StudentLayoutProps) {
  const pathname = usePathname();
  const navItems = buildNavItems(courseId);

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
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/student/dashboard" && pathname.startsWith(item.href));

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
