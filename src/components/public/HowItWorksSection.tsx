import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ClipboardList,
  UserCheck,
  BookOpen,
  Award,
  ArrowRight,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const steps = [
  {
    icon: ClipboardList,
    step: "01",
    title: "Choose Your Program",
    description:
      "Browse our industry-specific programs and select the career path that matches your goals and interests.",
  },
  {
    icon: UserCheck,
    step: "02",
    title: "Enroll & Get Matched",
    description:
      "Complete your enrollment and get matched with an expert trainer who specializes in your chosen industry.",
  },
  {
    icon: BookOpen,
    step: "03",
    title: "Learn & Practice",
    description:
      "Access comprehensive lessons, hands-on assignments, quizzes, and real-world projects through our learning platform.",
  },
  {
    icon: Award,
    step: "04",
    title: "Get Certified & Hired",
    description:
      "Earn your industry certification, build your portfolio, and receive career placement support to land your dream role.",
  },
] as const;

/* ------------------------------------------------------------------ */
/*  HowItWorksSection                                                  */
/* ------------------------------------------------------------------ */

export function HowItWorksSection() {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-blue-600 font-semibold text-sm uppercase tracking-wide mb-2">
            How It Works
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
            Your Path to a{" "}
            <span className="text-blue-700">New Career</span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            From enrollment to employment — a clear, structured journey to
            transform your professional capabilities in as little as 8 weeks.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((item, index) => (
            <div key={item.title} className="relative group">
              {/* Connector line (hidden on last item) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[calc(50%+32px)] w-[calc(100%-64px)] h-0.5 bg-blue-100" />
              )}

              <div className="text-center">
                {/* Step number + icon */}
                <div className="relative inline-flex items-center justify-center mb-5">
                  <div className="w-20 h-20 rounded-2xl bg-blue-50 border-2 border-blue-100 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                    <item.icon className="h-8 w-8 text-blue-700" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-8 h-8 bg-blue-700 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-md">
                    {item.step}
                  </span>
                </div>

                <h3 className="font-bold text-gray-900 text-lg mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed max-w-xs mx-auto">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-14">
          <Button
            asChild
            size="lg"
            className="bg-blue-700 hover:bg-blue-800 font-bold text-base px-8 py-6"
          >
            <Link href="/enroll">
              Start Your Journey <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
