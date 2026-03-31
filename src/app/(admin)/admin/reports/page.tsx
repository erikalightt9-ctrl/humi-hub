import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import {
  BarChart3,
  Brain,
  Rocket,
  FileBarChart,
  CreditCard,
  Briefcase,
  Building2,
  MessageSquareQuote,
  Crown,
  CalendarDays,
} from "lucide-react";
import { authOptions } from "@/lib/auth";
import { ModuleDashboard } from "@/components/shared/ModuleDashboard";
import type { DashboardCardProps } from "@/components/shared/DashboardCard";

export const metadata: Metadata = { title: "Reports | HUMI Hub Admin" };

const REPORTS_CARDS: ReadonlyArray<Omit<DashboardCardProps, "currentRole">> = [
  {
    href: "/admin/analytics",
    label: "Analytics",
    description: "Platform-wide metrics: enrollments, completions, revenue.",
    icon: BarChart3,
    colorClass: "bg-blue-50 text-blue-700",
  },
  {
    href: "/admin/ai-insights",
    label: "AI Insights",
    description: "AI-generated summaries and learning pattern analysis.",
    icon: Brain,
    colorClass: "bg-blue-50 text-blue-700",
  },
  {
    href: "/admin/control-tower",
    label: "Control Tower",
    description: "Real-time operations overview and platform health.",
    icon: Rocket,
    colorClass: "bg-red-50 text-red-700",
  },
  {
    href: "/admin/reports/summary",
    label: "Reports Export",
    description: "Generate and download detailed platform reports.",
    icon: FileBarChart,
    colorClass: "bg-teal-50 text-teal-700",
  },
  {
    href: "/admin/payments",
    label: "Payments",
    description: "View payment records and subscription transactions.",
    icon: CreditCard,
    colorClass: "bg-green-50 text-green-700",
  },
  {
    href: "/admin/subscriptions",
    label: "AI Subscriptions",
    description: "Manage student AI Premium subscription records.",
    icon: Crown,
    colorClass: "bg-amber-50 text-amber-700",
  },
  {
    href: "/admin/job-postings",
    label: "Jobs & Career",
    description: "Job listings, applications, placements, and ranking.",
    icon: Briefcase,
    colorClass: "bg-orange-50 text-orange-700",
  },
  {
    href: "/admin/organizations",
    label: "Organizations",
    description: "Manage corporate tenant organizations and partnerships.",
    icon: Building2,
    colorClass: "bg-indigo-50 text-indigo-700",
  },
  {
    href: "/admin/testimonials",
    label: "Testimonials",
    description: "Review and publish student success testimonials.",
    icon: MessageSquareQuote,
    colorClass: "bg-pink-50 text-pink-700",
  },
  {
    href: "/admin/calendar",
    label: "Calendar",
    description: "Platform-wide events, sessions, and schedule overview.",
    icon: CalendarDays,
    colorClass: "bg-cyan-50 text-cyan-700",
  },
];

export default async function ReportsHubPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string })?.role !== "admin") {
    redirect("/portal?tab=admin");
  }

  return (
    <ModuleDashboard
      title="Reports"
      description="Analytics, insights, payments, jobs, and platform-wide reporting."
      icon={BarChart3}
      iconColorClass="bg-blue-50 text-blue-700"
      cards={REPORTS_CARDS}
      currentRole="admin"
    />
  );
}
