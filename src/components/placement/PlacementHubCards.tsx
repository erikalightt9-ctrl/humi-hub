import Link from "next/link";
import { FileText, Mic, Briefcase, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HubCard {
  readonly icon: React.ComponentType<{ readonly className?: string }>;
  readonly iconBg: string;
  readonly iconColor: string;
  readonly title: string;
  readonly description: string;
  readonly href: string;
}

const HUB_CARDS: readonly HubCard[] = [
  {
    icon: FileText,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    title: "Resume Builder",
    description:
      "Build a professional resume that highlights your skills and experience to attract top employers.",
    href: "/placement/resume",
  },
  {
    icon: Mic,
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
    title: "AI Interview Practice",
    description:
      "Practice with AI-generated interview questions tailored to your target role and get instant feedback.",
    href: "/placement/interview",
  },
  {
    icon: Briefcase,
    iconBg: "bg-sky-100",
    iconColor: "text-sky-600",
    title: "Job Matching",
    description:
      "Browse curated job listings matched to your skills and apply directly through our platform.",
    href: "/placement/jobs",
  },
  {
    icon: Users,
    iconBg: "bg-teal-100",
    iconColor: "text-teal-600",
    title: "Career Coaching",
    description:
      "Book one-on-one sessions with expert career coaches for personalized guidance and strategy.",
    href: "/placement/coaching",
  },
] as const;

export function PlacementHubCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {HUB_CARDS.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.href}
            className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4 hover:shadow-lg transition-shadow duration-200"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.iconBg}`}>
              <Icon className={`w-6 h-6 ${card.iconColor}`} />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-900 mb-1">{card.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{card.description}</p>
            </div>
            <Button asChild variant="outline" size="sm" className="w-full justify-between">
              <Link href={card.href}>
                Get Started <span aria-hidden="true">→</span>
              </Link>
            </Button>
          </div>
        );
      })}
    </div>
  );
}
