import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import {
  ClipboardCheck,
  CalendarClock,
  Ticket,
  Bell,
  Mail,
  FolderOpen,
} from "lucide-react";
import { authOptions } from "@/lib/auth";
import { ModuleDashboard } from "@/components/shared/ModuleDashboard";
import type { DashboardCardProps } from "@/components/shared/DashboardCard";

export const metadata: Metadata = { title: "Tasks | HUMI Hub Trainer Portal" };

const TASKS_CARDS: ReadonlyArray<Omit<DashboardCardProps, "currentRole">> = [
  {
    href: "/trainer/submissions",
    label: "Grading Queue",
    description: "Review and grade pending student assignment submissions.",
    icon: ClipboardCheck,
    colorClass: "bg-green-50 text-green-700",
  },
  {
    href: "/trainer/schedule",
    label: "My Schedule",
    description: "View and manage your upcoming training sessions.",
    icon: CalendarClock,
    colorClass: "bg-orange-50 text-orange-700",
  },
  {
    href: "/trainer/materials",
    label: "Materials",
    description: "Upload and manage training materials for your students.",
    icon: FolderOpen,
    colorClass: "bg-blue-50 text-blue-700",
  },
  {
    href: "/trainer/messages",
    label: "Messages",
    description: "Send and receive direct messages.",
    icon: Mail,
    colorClass: "bg-blue-50 text-blue-700",
  },
  {
    href: "/trainer/support",
    label: "Support Tickets",
    description: "Submit and track trainer support requests.",
    icon: Ticket,
    colorClass: "bg-red-50 text-red-700",
  },
  {
    href: "/trainer/notifications",
    label: "Notifications",
    description: "View platform notifications and announcements.",
    icon: Bell,
    colorClass: "bg-yellow-100 text-yellow-600",
  },
];

export default async function TrainerTasksHubPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id: string; role: string } | undefined;

  if (!user || user.role !== "trainer") {
    redirect("/trainer/login");
  }

  return (
    <ModuleDashboard
      title="Tasks"
      description="Manage grading, schedule, materials, messages, and support."
      icon={ClipboardCheck}
      iconColorClass="bg-blue-50 text-blue-700"
      cards={TASKS_CARDS}
      currentRole="trainer"
    />
  );
}
