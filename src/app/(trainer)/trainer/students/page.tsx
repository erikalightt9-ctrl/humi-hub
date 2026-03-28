import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import {
  Users,
  ClipboardCheck,
  Mail,
  TrendingUp,
} from "lucide-react";
import { authOptions } from "@/lib/auth";
import { ModuleDashboard } from "@/components/shared/ModuleDashboard";
import type { DashboardCardProps } from "@/components/shared/DashboardCard";

export const metadata: Metadata = { title: "Students | HUMI Trainer Portal" };

const STUDENTS_CARDS: ReadonlyArray<Omit<DashboardCardProps, "currentRole">> = [
  {
    href: "/trainer/students/list",
    label: "My Students",
    description: "View all students assigned to your training batches.",
    icon: Users,
    colorClass: "bg-blue-900/40 text-blue-400",
  },
  {
    href: "/trainer/submissions",
    label: "Grading Queue",
    description: "Review and grade student assignment submissions.",
    icon: ClipboardCheck,
    colorClass: "bg-emerald-900/40 text-emerald-400",
  },
  {
    href: "/trainer/messages",
    label: "Messages",
    description: "Send and receive messages with your students.",
    icon: Mail,
    colorClass: "bg-blue-900/40 text-blue-400",
  },
  {
    href: "/trainer/engagement",
    label: "Progress",
    description: "Track student progress and learning engagement.",
    icon: TrendingUp,
    colorClass: "bg-amber-900/40 text-amber-400",
  },
];

export default async function TrainerStudentsHubPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id: string; role: string } | undefined;

  if (!user || user.role !== "trainer") {
    redirect("/trainer/login");
  }

  return (
    <ModuleDashboard
      title="Students"
      description="Manage your students, grade submissions, and track learning progress."
      icon={Users}
      iconColorClass="bg-blue-900/40 text-blue-400"
      cards={STUDENTS_CARDS}
      currentRole="trainer"
    />
  );
}
