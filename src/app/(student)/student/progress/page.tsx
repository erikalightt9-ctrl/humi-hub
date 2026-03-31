import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import {
  BarChart3,
  TreePine,
  Award,
  Activity,
  Heart,
  CalendarDays,
  MessageSquare,
  Trophy,
  Ticket,
  HelpCircle,
  Bell,
} from "lucide-react";
import { authOptions } from "@/lib/auth";
import { ModuleDashboard } from "@/components/shared/ModuleDashboard";
import type { DashboardCardProps } from "@/components/shared/DashboardCard";

export const metadata: Metadata = { title: "Progress | HUMI Hub Student" };

const PROGRESS_CARDS: ReadonlyArray<Omit<DashboardCardProps, "currentRole">> = [
  {
    href: "/student/learning-analytics",
    label: "Learning Analytics",
    description: "Track your lesson completions, quiz scores, and study time.",
    icon: BarChart3,
    colorClass: "bg-blue-50 text-blue-700",
  },
  {
    href: "/student/skill-tree",
    label: "Skill Tree",
    description: "Visualize the skills you've unlocked throughout your course.",
    icon: TreePine,
    colorClass: "bg-green-50 text-green-700",
  },
  {
    href: "/student/certificates",
    label: "Certificates",
    description: "View and download your completion certificates.",
    icon: Award,
    colorClass: "bg-amber-50 text-amber-700",
  },
  {
    href: "/student/work-pace",
    label: "Work Pace",
    description: "Monitor your daily study pace and consistency.",
    icon: Activity,
    colorClass: "bg-orange-50 text-orange-700",
  },
  {
    href: "/student/mentorship",
    label: "Mentorship",
    description: "Connect with mentors for career and learning guidance.",
    icon: Heart,
    colorClass: "bg-pink-50 text-pink-700",
  },
  {
    href: "/student/calendar",
    label: "Calendar",
    description: "Your upcoming sessions, deadlines, and events.",
    icon: CalendarDays,
    colorClass: "bg-teal-50 text-teal-700",
  },
  {
    href: "/student/forum",
    label: "Student Forum",
    description: "Join discussions with fellow students.",
    icon: MessageSquare,
    colorClass: "bg-blue-50 text-blue-700",
  },
  {
    href: "/student/notifications",
    label: "Notifications",
    description: "View all platform notifications and updates.",
    icon: Bell,
    colorClass: "bg-yellow-100 text-yellow-600",
  },
  {
    href: "/student/support",
    label: "Support",
    description: "Submit and track support tickets.",
    icon: Ticket,
    colorClass: "bg-red-50 text-red-700",
  },
  {
    href: "/student/help",
    label: "Help Center",
    description: "Browse FAQs, guides, and help articles.",
    icon: HelpCircle,
    colorClass: "bg-indigo-50 text-indigo-700",
  },
  {
    href: "/student/messages",
    label: "Messages",
    description: "Send and receive direct messages with trainers and staff.",
    icon: Trophy,
    colorClass: "bg-cyan-50 text-cyan-700",
  },
];

export default async function ProgressHubPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string })?.role !== "student") {
    redirect("/portal");
  }

  return (
    <ModuleDashboard
      title="Progress"
      description="Track your learning journey, achievements, community, and support."
      icon={BarChart3}
      iconColorClass="bg-blue-50 text-blue-700"
      cards={PROGRESS_CARDS}
      currentRole="student"
    />
  );
}
