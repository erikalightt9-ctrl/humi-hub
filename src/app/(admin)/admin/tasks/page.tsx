import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import {
  ClipboardList,
  ClipboardCheck,
  CalendarClock,
  HelpCircle,
  MessageSquare,
  Ticket,
  Bell,
  Mail,
} from "lucide-react";
import { authOptions } from "@/lib/auth";
import { ModuleDashboard } from "@/components/shared/ModuleDashboard";
import type { DashboardCardProps } from "@/components/shared/DashboardCard";

export const metadata: Metadata = { title: "Tasks | HUMI Hub Admin" };

const TASKS_CARDS: ReadonlyArray<Omit<DashboardCardProps, "currentRole">> = [
  {
    href: "/admin/assignments",
    label: "Assignments",
    description: "Create and manage student assignments across all courses.",
    icon: ClipboardList,
    colorClass: "bg-blue-50 text-blue-700",
  },
  {
    href: "/admin/submissions",
    label: "Submissions",
    description: "Review and grade submitted student work.",
    icon: ClipboardCheck,
    colorClass: "bg-green-50 text-green-700",
  },
  {
    href: "/admin/schedules",
    label: "Training Schedule",
    description: "Manage batch schedules, cohorts, and training timelines.",
    icon: CalendarClock,
    colorClass: "bg-orange-50 text-orange-700",
  },
  {
    href: "/admin/knowledge-base",
    label: "Knowledge Base",
    description: "Manage support articles and help documentation.",
    icon: HelpCircle,
    colorClass: "bg-blue-50 text-blue-700",
  },
  {
    href: "/admin/tickets",
    label: "Support Tickets",
    description: "Handle and resolve student and trainer support requests.",
    icon: Ticket,
    colorClass: "bg-red-50 text-red-700",
  },
  {
    href: "/admin/communications",
    label: "Contact Messages",
    description: "Review messages submitted via the public contact form.",
    icon: MessageSquare,
    colorClass: "bg-teal-50 text-teal-700",
  },
  {
    href: "/admin/messages",
    label: "Messaging",
    description: "Send and receive direct messages with students and trainers.",
    icon: Mail,
    colorClass: "bg-indigo-50 text-indigo-700",
  },
  {
    href: "/admin/notifications",
    label: "Notifications",
    description: "Broadcast announcements and review platform notifications.",
    icon: Bell,
    colorClass: "bg-yellow-100 text-yellow-600",
  },
];

export default async function TasksHubPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string })?.role !== "admin") {
    redirect("/portal?tab=admin");
  }

  return (
    <ModuleDashboard
      title="Tasks"
      description="Manage assignments, submissions, schedules, support, and communications."
      icon={ClipboardList}
      iconColorClass="bg-blue-50 text-blue-700"
      cards={TASKS_CARDS}
      currentRole="admin"
    />
  );
}
