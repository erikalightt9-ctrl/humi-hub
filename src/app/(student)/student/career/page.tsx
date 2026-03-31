import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import {
  Briefcase,
  Search,
  FileText,
  UserCircle,
  Target,
  Star,
  ShieldCheck,
  Building2,
  Laptop,
} from "lucide-react";
import { authOptions } from "@/lib/auth";
import { ModuleDashboard } from "@/components/shared/ModuleDashboard";
import type { DashboardCardProps } from "@/components/shared/DashboardCard";

export const metadata: Metadata = { title: "Career | Humi Hub Student" };

const CAREER_CARDS: ReadonlyArray<Omit<DashboardCardProps, "currentRole">> = [
  {
    href: "/student/job-matches",
    label: "Job Matches",
    description: "Browse AI-curated job opportunities that match your skills.",
    icon: Search,
    colorClass: "bg-blue-50 text-blue-700",
  },
  {
    href: "/student/resume-builder",
    label: "Resume Builder",
    description: "Build and export a professional VA resume.",
    icon: FileText,
    colorClass: "bg-green-50 text-green-700",
  },
  {
    href: "/student/portfolio",
    label: "Portfolio",
    description: "Showcase your work samples and completed projects.",
    icon: UserCircle,
    colorClass: "bg-blue-50 text-blue-700",
  },
  {
    href: "/student/career-readiness",
    label: "Career Readiness",
    description: "Assess your readiness for the VA job market.",
    icon: Target,
    colorClass: "bg-orange-50 text-orange-700",
  },
  {
    href: "/student/employer-feedback",
    label: "Employer Feedback",
    description: "View feedback received from potential employers.",
    icon: Star,
    colorClass: "bg-amber-50 text-amber-700",
  },
  {
    href: "/student/skill-verification",
    label: "Skill Verification",
    description: "Get your skills verified and earn digital badges.",
    icon: ShieldCheck,
    colorClass: "bg-teal-50 text-teal-700",
  },
  {
    href: "/student/internship-program",
    label: "Internships",
    description: "Apply for internship programs with partner companies.",
    icon: Building2,
    colorClass: "bg-indigo-50 text-indigo-700",
  },
  {
    href: "/student/freelance",
    label: "Freelance",
    description: "Explore freelance gig opportunities and platforms.",
    icon: Laptop,
    colorClass: "bg-pink-50 text-pink-700",
  },
];

export default async function CareerHubPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string })?.role !== "student") {
    redirect("/portal");
  }

  return (
    <ModuleDashboard
      title="Career"
      description="Find jobs, build your resume, verify skills, and launch your VA career."
      icon={Briefcase}
      iconColorClass="bg-green-50 text-green-700"
      cards={CAREER_CARDS}
      currentRole="student"
    />
  );
}
