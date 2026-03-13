import type { Metadata } from "next";
import Link from "next/link";
import {
  Briefcase,
  MessageSquare,
  Target,
  TrendingUp,
  Users,
  DollarSign,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { JobBoard } from "@/components/public/JobBoard";

export const metadata: Metadata = {
  title: "Career Placement — HUMI Training Center",
  description:
    "Get placed in your dream VA role. Resume building, AI mock interviews, job matching, and career coaching to launch your virtual assistant career.",
};

/* ------------------------------------------------------------------ */
/*  Static data                                                        */
/* ------------------------------------------------------------------ */

interface StatCard {
  readonly value: string;
  readonly label: string;
  readonly icon: React.ComponentType<{ readonly className?: string }>;
}

const STATS: readonly StatCard[] = [
  {
    value: "85%",
    label: "Placement Rate (within 30 days)",
    icon: Users,
  },
  {
    value: "$800\u2013$1,500/mo",
    label: "Average Starting Salary",
    icon: DollarSign,
  },
  {
    value: "150+",
    label: "Hiring Partners (Global companies)",
    icon: Building2,
  },
] as const;

interface PlacementService {
  readonly icon: React.ComponentType<{ readonly className?: string }>;
  readonly title: string;
  readonly description: string;
}

const SERVICES: readonly PlacementService[] = [
  {
    icon: Briefcase,
    title: "Resume & Portfolio Building",
    description:
      "Craft a professional resume and portfolio that highlights your VA skills, AI proficiency, and specialization expertise.",
  },
  {
    icon: MessageSquare,
    title: "AI Mock Interview Practice",
    description:
      "Practice with our AI interview simulator to sharpen your answers, build confidence, and nail your first client call.",
  },
  {
    icon: Target,
    title: "AI Job Matching",
    description:
      "Our AI matching engine pairs your skills and preferences with the best-fit job openings from our global partner network.",
  },
  {
    icon: TrendingUp,
    title: "Career Coaching",
    description:
      "Get one-on-one guidance from experienced career coaches on salary negotiation, client management, and long-term growth.",
  },
] as const;

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function CareerPlacementPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-blue-900 text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-extrabold mb-4">Career Placement</h1>
          <p className="text-blue-100 text-lg leading-relaxed">
            Your training does not end with a certificate. We provide
            comprehensive placement support to help you land your first VA role
            quickly and confidently.
          </p>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {STATS.map((stat) => (
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

      {/* Placement Services */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">
              Placement Services
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              From resume writing to your first paycheck, we support every step
              of your job search.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {SERVICES.map((service) => (
              <div
                key={service.title}
                className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm"
              >
                <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <service.icon className="h-6 w-6 text-blue-700" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {service.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Job Board */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">
              Current Openings
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Browse the latest VA job opportunities from our hiring partners
              worldwide.
            </p>
          </div>
          <JobBoard />
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-blue-700 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold mb-4">Get Career-Ready</h2>
          <p className="text-blue-100 mb-8 text-lg">
            Enroll today and gain access to our full suite of career placement
            services, AI-powered tools, and a network of 150+ hiring partners.
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
