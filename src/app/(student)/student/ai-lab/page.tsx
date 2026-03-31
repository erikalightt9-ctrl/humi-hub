import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import {
  Sparkles,
  Users,
  Zap,
  Target,
  Mic,
  Briefcase,
  Mail,
  BarChart2,
  Bot,
  Crown,
} from "lucide-react";
import { authOptions } from "@/lib/auth";
import { ModuleDashboard } from "@/components/shared/ModuleDashboard";
import type { DashboardCardProps } from "@/components/shared/DashboardCard";

export const metadata: Metadata = { title: "AI Lab | Humi Hub Student" };

const AI_LAB_CARDS: ReadonlyArray<Omit<DashboardCardProps, "currentRole">> = [
  {
    href: "/student/ai-practice",
    label: "AI Practice",
    description: "Practice real-world VA tasks with AI-powered scenarios.",
    icon: Bot,
    colorClass: "bg-blue-50 text-blue-700",
  },
  {
    href: "/student/ai-simulator",
    label: "VA Simulator",
    description: "Simulate virtual assistant workflows and client interactions.",
    icon: Users,
    colorClass: "bg-blue-50 text-blue-700",
    allowedRoles: ["student"],
  },
  {
    href: "/student/ai-tasks",
    label: "Task Generator",
    description: "Generate AI-curated tasks to build your VA skill set.",
    icon: Zap,
    colorClass: "bg-yellow-100 text-yellow-600",
  },
  {
    href: "/student/ai-assessments",
    label: "AI Review",
    description: "Get AI feedback on your work and skill gaps.",
    icon: Target,
    colorClass: "bg-teal-50 text-teal-700",
  },
  {
    href: "/student/ai-interviews",
    label: "Mock Interviews",
    description: "Practice job interviews with an AI interviewer.",
    icon: Mic,
    colorClass: "bg-orange-50 text-orange-700",
  },
  {
    href: "/student/business-assistant",
    label: "Biz Assistant",
    description: "Get AI help with business tasks and communications.",
    icon: Briefcase,
    colorClass: "bg-green-50 text-green-700",
  },
  {
    href: "/student/ai-email-practice",
    label: "Email Practice",
    description: "Practice writing professional emails with AI guidance.",
    icon: Mail,
    colorClass: "bg-indigo-50 text-indigo-700",
  },
  {
    href: "/student/ai-feedback-engine",
    label: "Feedback Engine",
    description: "Receive detailed AI-driven performance feedback.",
    icon: BarChart2,
    colorClass: "bg-pink-50 text-pink-700",
  },
  {
    href: "/student/ai-premium",
    label: "Upgrade to PRO",
    description: "Unlock all AI Lab features with a PRO subscription.",
    icon: Crown,
    colorClass: "bg-amber-50 text-amber-700",
  },
];

export default async function AiLabHubPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string })?.role !== "student") {
    redirect("/portal");
  }

  return (
    <ModuleDashboard
      title="AI Lab"
      description="Practice VA tasks, simulate workflows, and get AI-powered feedback."
      icon={Sparkles}
      iconColorClass="bg-blue-50 text-blue-700"
      cards={AI_LAB_CARDS}
      currentRole="student"
    />
  );
}
