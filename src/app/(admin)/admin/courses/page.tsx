import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import {
  BookOpen,
  FileText,
  CalendarClock,
  ClipboardList,
  UserCog,
  PlusCircle,
} from "lucide-react";
import { authOptions } from "@/lib/auth";
import { ModuleDashboard } from "@/components/shared/ModuleDashboard";
import type { DashboardCardProps } from "@/components/shared/DashboardCard";

export const metadata: Metadata = { title: "Courses | HUMI Admin" };

const COURSES_CARDS: ReadonlyArray<Omit<DashboardCardProps, "currentRole">> = [
  {
    href: "/admin/courses/list",
    label: "All Courses",
    description: "View, edit, and manage every course in the platform.",
    icon: BookOpen,
    colorClass: "bg-blue-900/40 text-blue-400",
  },
  {
    href: "/admin/courses/create",
    label: "Create Course",
    description: "Add a new course and configure its tiers and content.",
    icon: PlusCircle,
    colorClass: "bg-emerald-900/40 text-emerald-400",
  },
  {
    href: "/admin/lessons",
    label: "Lessons",
    description: "Manage all lessons and lesson content across courses.",
    icon: FileText,
    colorClass: "bg-purple-900/40 text-purple-400",
  },
  {
    href: "/admin/schedules",
    label: "Training Schedule",
    description: "Set up and view batch training schedules and cohorts.",
    icon: CalendarClock,
    colorClass: "bg-orange-900/40 text-orange-400",
  },
  {
    href: "/admin/assignments",
    label: "Assignments",
    description: "Create and review assignments for all courses.",
    icon: ClipboardList,
    colorClass: "bg-yellow-900/40 text-yellow-400",
  },
  {
    href: "/admin/trainers",
    label: "Trainers",
    description: "Manage trainers and their course assignments.",
    icon: UserCog,
    colorClass: "bg-teal-900/40 text-teal-400",
  },
];

export default async function CoursesHubPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string })?.role !== "admin") {
    redirect("/portal?tab=admin");
  }

  return (
    <ModuleDashboard
      title="Courses"
      description="Manage course content, schedules, lessons, assignments, and trainers."
      icon={BookOpen}
      iconColorClass="bg-blue-900/40 text-blue-400"
      cards={COURSES_CARDS}
      currentRole="admin"
    />
  );
}
