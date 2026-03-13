import type { Metadata } from "next";
import Link from "next/link";
import {
  Map,
  ClipboardCheck,
  BookOpen,
  Target,
  Zap,
  Award,
  Briefcase,
  Stethoscope,
  Home,
  Calculator,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Learning Paths — HUMI Training Center",
  description:
    "Follow a clear, structured learning path from enrollment to career placement. Choose your VA specialization and start your journey.",
};

/* ------------------------------------------------------------------ */
/*  Static data                                                        */
/* ------------------------------------------------------------------ */

interface TimelineStep {
  readonly step: number;
  readonly title: string;
  readonly description: string;
  readonly icon: React.ComponentType<{ readonly className?: string }>;
}

const TIMELINE_STEPS: readonly TimelineStep[] = [
  {
    step: 1,
    title: "Apply & Enroll",
    description:
      "Submit your application and choose your specialization. Our team reviews every application to ensure you are set up for success.",
    icon: ClipboardCheck,
  },
  {
    step: 2,
    title: "Foundation Training",
    description:
      "Learn core VA skills: professional communication, time management, remote work tools, and client relationship basics.",
    icon: BookOpen,
  },
  {
    step: 3,
    title: "Specialization",
    description:
      "Deep dive into your chosen field: Medical, Real Estate, or Bookkeeping. Master industry-specific tools, workflows, and terminology.",
    icon: Target,
  },
  {
    step: 4,
    title: "AI Tools Mastery",
    description:
      "Master ChatGPT, AI automation, and productivity tools that make you 3x more productive than traditional VAs.",
    icon: Zap,
  },
  {
    step: 5,
    title: "Assessments & Certification",
    description:
      "Complete quizzes, hands-on assignments, and AI practice assessments to earn your official certification.",
    icon: Award,
  },
  {
    step: 6,
    title: "Career Placement",
    description:
      "Get matched with employers through our network of 150+ global hiring partners and launch your VA career.",
    icon: Briefcase,
  },
] as const;

interface Specialization {
  readonly name: string;
  readonly slug: string;
  readonly icon: React.ComponentType<{ readonly className?: string }>;
  readonly outcomes: readonly string[];
  readonly duration: string;
  readonly price: string;
}

const SPECIALIZATIONS: readonly Specialization[] = [
  {
    name: "Medical Virtual Assistant",
    slug: "medical-va",
    icon: Stethoscope,
    outcomes: [
      "Medical office administration",
      "Patient scheduling and follow-up",
      "Insurance verification and billing",
      "HIPAA-compliant documentation",
    ],
    duration: "8 weeks",
    price: "$149",
  },
  {
    name: "Real Estate Virtual Assistant",
    slug: "real-estate-va",
    icon: Home,
    outcomes: [
      "MLS listing management",
      "CRM and lead nurturing automation",
      "Transaction coordination",
      "Real estate marketing and social media",
    ],
    duration: "8 weeks",
    price: "$149",
  },
  {
    name: "US Bookkeeping Virtual Assistant",
    slug: "us-bookkeeping-va",
    icon: Calculator,
    outcomes: [
      "QuickBooks Online management",
      "Accounts payable and receivable",
      "Bank reconciliation and reporting",
      "Payroll processing support",
    ],
    duration: "8 weeks",
    price: "$149",
  },
] as const;

/* ------------------------------------------------------------------ */
/*  Timeline step backgrounds (alternating)                            */
/* ------------------------------------------------------------------ */

const STEP_BG = ["bg-white", "bg-gray-50"] as const;

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function LearningPathsPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-blue-900 text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <Map className="h-12 w-12 text-amber-300 mx-auto mb-4" />
          <h1 className="text-4xl font-extrabold mb-4">Your Learning Path</h1>
          <p className="text-blue-100 text-lg leading-relaxed">
            Follow a clear, structured journey from application to career
            placement. Every step is designed to build your skills, confidence,
            and readiness for the global VA market.
          </p>
        </div>
      </section>

      {/* Visual Timeline */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">
              Your Training Journey
            </h2>
            <p className="text-gray-600">
              Six clear steps from enrollment to your first VA role.
            </p>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Vertical connecting line */}
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-blue-200" />

            <div className="space-y-0">
              {TIMELINE_STEPS.map((step, index) => {
                const bgClass = STEP_BG[index % 2];
                return (
                  <div
                    key={step.step}
                    className={`relative flex items-start gap-6 ${bgClass} rounded-xl p-6`}
                  >
                    {/* Circle with icon */}
                    <div className="relative z-10 bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-md">
                      <step.icon className="h-5 w-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 pt-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                          Step {step.step}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 text-lg mb-1">
                        {step.title}
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Path Selector */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">
              Choose Your Specialization
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Select the path that matches your interests and career goals. Each
              program leads to a certified specialization and career placement
              support.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {SPECIALIZATIONS.map((spec) => (
              <div
                key={spec.slug}
                className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col"
              >
                {/* Card Header */}
                <div className="bg-blue-50 p-6 border-b border-blue-100">
                  <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                    <spec.icon className="h-6 w-6 text-blue-700" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg">
                    {spec.name}
                  </h3>
                </div>

                {/* Card Body */}
                <div className="p-6 flex-1 flex flex-col">
                  {/* Career Outcomes */}
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                    Career Outcomes
                  </p>
                  <ul className="space-y-2 mb-6 flex-1">
                    {spec.outcomes.map((outcome) => (
                      <li
                        key={outcome}
                        className="flex items-start gap-2 text-sm text-gray-600"
                      >
                        <ArrowRight className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                        {outcome}
                      </li>
                    ))}
                  </ul>

                  {/* Duration & Price */}
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4 border-t border-gray-100 pt-4">
                    <span>Duration: {spec.duration}</span>
                    <span className="font-bold text-gray-900">
                      {spec.price}
                    </span>
                  </div>

                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/programs/${spec.slug}`}>Learn More</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-blue-700 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold mb-4">Start Your Journey</h2>
          <p className="text-blue-100 mb-8 text-lg">
            Choose your specialization and begin your path to becoming an
            AI-powered Virtual Assistant. Applications are open year-round.
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
