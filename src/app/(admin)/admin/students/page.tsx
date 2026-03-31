import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import {
  Users,
  UserCheck,
  ClipboardCheck,
  TrendingUp,
  Award,
  Trophy,
} from "lucide-react";
import { authOptions } from "@/lib/auth";
import { ModuleDashboard } from "@/components/shared/ModuleDashboard";
import type { DashboardCardProps } from "@/components/shared/DashboardCard";

export const metadata: Metadata = { title: "Students | HUMI Hub Admin" };

const STUDENTS_CARDS: ReadonlyArray<Omit<DashboardCardProps, "currentRole">> = [
  {
    href: "/admin/students/directory",
    label: "Student Directory",
    description: "Browse all students, enrollments, and their statuses.",
    icon: Users,
    colorClass: "bg-blue-50 text-blue-700",
  },
  {
    href: "/admin/enrollees",
    label: "Applications",
    description: "Review and process new enrollment applications.",
    icon: UserCheck,
    colorClass: "bg-green-50 text-green-700",
  },
  {
    href: "/admin/attendance",
    label: "Attendance",
    description: "Track student clock-in records and attendance patterns.",
    icon: ClipboardCheck,
    colorClass: "bg-yellow-100 text-yellow-600",
  },
  {
    href: "/admin/engagement",
    label: "Progress",
    description: "Monitor student progress, completions, and engagement.",
    icon: TrendingUp,
    colorClass: "bg-blue-50 text-blue-700",
  },
  {
    href: "/admin/certificates",
    label: "Certificates",
    description: "Issue and manage student completion certificates.",
    icon: Award,
    colorClass: "bg-orange-50 text-orange-700",
  },
  {
    href: "/admin/student-ranking",
    label: "Ranking",
    description: "View and publish the public student leaderboard.",
    icon: Trophy,
    colorClass: "bg-amber-50 text-amber-700",
  },
];

export default async function StudentsHubPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string })?.role !== "admin") {
    redirect("/portal?tab=admin");
  }

  return (
    <ModuleDashboard
      title="Students"
      description="Manage student enrollments, attendance, progress, and achievements."
      icon={Users}
      iconColorClass="bg-blue-50 text-blue-700"
      cards={STUDENTS_CARDS}
      currentRole="admin"
    />
  );
}
