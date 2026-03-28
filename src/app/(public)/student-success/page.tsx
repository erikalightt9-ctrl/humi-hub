import type { Metadata } from "next";
import Link from "next/link";
import {
  Users,
  TrendingUp,
  DollarSign,
  Zap,
  ArrowRight,
  Quote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TestimonialsSection } from "@/components/public/TestimonialsSection";
import { getPublicPlacementStats } from "@/lib/repositories/placement.repository";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Student Success — HUMI Training Center",
  description:
    "See how our graduates transformed their careers. Real stories, real results from AI-powered Virtual Assistant training.",
};

/* ------------------------------------------------------------------ */
/*  Static success stories                                             */
/* ------------------------------------------------------------------ */

interface SuccessStory {
  readonly name: string;
  readonly previousRole: string;
  readonly currentRole: string;
  readonly quote: string;
  readonly program: string;
  readonly incomeBefore: string;
  readonly incomeAfter: string;
}

const SUCCESS_STORIES: readonly SuccessStory[] = [
  {
    name: "Maria S.",
    previousRole: "Call Center Agent",
    currentRole: "Medical Virtual Assistant",
    quote:
      "The Medical VA program gave me the confidence and skills to transition into healthcare administration. I now work remotely for a US clinic, handling patient scheduling and insurance verification with AI tools.",
    program: "Medical VA Program",
    incomeBefore: "$350/mo",
    incomeAfter: "$1,200/mo",
  },
  {
    name: "James R.",
    previousRole: "Office Clerk",
    currentRole: "Real Estate Virtual Assistant",
    quote:
      "I never imagined I could work with US real estate agents from my home in the Philippines. The AI tools training was a game-changer for managing listings and CRM automation.",
    program: "Real Estate VA Program",
    incomeBefore: "$300/mo",
    incomeAfter: "$1,000/mo",
  },
  {
    name: "Ana L.",
    previousRole: "Retail Worker",
    currentRole: "Bookkeeping Virtual Assistant",
    quote:
      "Switching from retail to remote bookkeeping felt impossible, but the step-by-step QuickBooks and AI training made it achievable. I now handle accounts for three US small businesses.",
    program: "US Bookkeeping VA Program",
    incomeBefore: "$280/mo",
    incomeAfter: "$1,100/mo",
  },
] as const;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatRateRange(min: number | null, max: number | null): string {
  if (min && max) return `$${Math.round(min).toLocaleString()}–$${Math.round(max).toLocaleString()}`;
  if (min) return `$${Math.round(min).toLocaleString()}+`;
  if (max) return `Up to $${Math.round(max).toLocaleString()}`;
  return "$800–$1,500";
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function StudentSuccessPage() {
  // Load live placement stats; fall back gracefully if none recorded yet
  const liveStats = await getPublicPlacementStats().catch(() => null);
  const hasLiveData = (liveStats?.totalPlacements ?? 0) >= 5;

  const displayStats = [
    {
      value: hasLiveData
        ? `${(liveStats!.totalGraduates).toLocaleString()}+`
        : "2,400+",
      label: "Trained Professionals",
      icon: Users,
    },
    {
      value: hasLiveData ? `${liveStats!.placementRate}%` : "85%",
      label: "Placement Rate",
      icon: TrendingUp,
    },
    {
      value: hasLiveData
        ? formatRateRange(liveStats!.minMonthlyRate, liveStats!.maxMonthlyRate)
        : "$800–$1,500",
      label: "Monthly Earnings",
      icon: DollarSign,
    },
    { value: "3x", label: "Productivity Increase", icon: Zap },
  ] as const;

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-blue-900 text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-extrabold mb-4">Student Success</h1>
          <p className="text-blue-100 text-lg leading-relaxed">
            Our graduates are building thriving remote careers worldwide. Explore
            the numbers, hear their stories, and see how our training transforms
            lives.
          </p>
          {hasLiveData && (
            <p className="mt-4 text-blue-200 text-sm">
              Based on {liveStats!.totalPlacements} verified graduate placements
            </p>
          )}
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {displayStats.map((stat) => (
            <div
              key={stat.label}
              className="bg-blue-50 rounded-xl p-6 text-center border border-blue-100"
            >
              <stat.icon className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <p className="text-3xl font-extrabold text-blue-900 mb-1">
                {stat.value}
              </p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <TestimonialsSection />

      {/* Success Stories */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">
              Success Stories
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Detailed case studies from graduates who made the leap to
              high-paying remote VA careers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {SUCCESS_STORIES.map((story) => (
              <div
                key={story.name}
                className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
              >
                <div className="bg-blue-50 p-6 border-b border-blue-100">
                  <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                    <span className="text-xl font-bold text-blue-700">
                      {story.name.charAt(0)}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg">{story.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                    <span>{story.previousRole}</span>
                    <ArrowRight className="h-3 w-3 text-blue-600 shrink-0" />
                    <span className="font-medium text-blue-700">{story.currentRole}</span>
                  </div>
                </div>

                <div className="p-6">
                  <div className="mb-4">
                    <Quote className="h-5 w-5 text-amber-400 mb-2" />
                    <p className="text-sm text-gray-600 leading-relaxed italic">
                      &ldquo;{story.quote}&rdquo;
                    </p>
                  </div>

                  <div className="mb-4">
                    <span className="inline-block bg-amber-50 text-amber-800 px-3 py-1 rounded-full text-xs font-medium">
                      {story.program}
                    </span>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      Income Comparison
                    </p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">Before</p>
                        <p className="text-lg font-bold text-gray-400">{story.incomeBefore}</p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-green-500" />
                      <div className="text-right">
                        <p className="text-xs text-gray-500">After</p>
                        <p className="text-lg font-bold text-green-600">{story.incomeAfter}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-700 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold mb-4">Start Your Success Story</h2>
          <p className="text-blue-100 mb-8 text-lg">
            Join{" "}
            {hasLiveData
              ? `${liveStats!.totalGraduates.toLocaleString()}+ graduates`
              : "2,400+ graduates"}{" "}
            who transformed their careers with AI-powered VA training. Your success
            story starts here.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-white text-blue-700 font-bold hover:bg-blue-50"
          >
            <Link href="/enroll">Enroll Now</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
