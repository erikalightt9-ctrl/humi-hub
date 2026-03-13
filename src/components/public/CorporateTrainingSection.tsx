import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Users,
  BarChart3,
  Shield,
  Layers,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const benefits = [
  {
    icon: Users,
    title: "Custom Team Training",
    description: "Tailored programs designed for your team's specific skill gaps and industry requirements.",
  },
  {
    icon: BarChart3,
    title: "Progress Analytics",
    description: "Real-time dashboards to track team performance, completion rates, and ROI metrics.",
  },
  {
    icon: Shield,
    title: "Certified Workforce",
    description: "Industry-recognized certifications that validate your team's competencies.",
  },
  {
    icon: Layers,
    title: "Scalable Programs",
    description: "From 5 to 500+ employees — our platform scales with your organization's growth.",
  },
] as const;

const clientTypes = [
  "BPO & Outsourcing Companies",
  "Staffing Agencies",
  "Healthcare Organizations",
  "Real Estate Firms",
  "Tech Startups",
  "Enterprise Teams",
] as const;

/* ------------------------------------------------------------------ */
/*  CorporateTrainingSection                                           */
/* ------------------------------------------------------------------ */

export function CorporateTrainingSection() {
  return (
    <section className="py-20 px-4 bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 text-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column — Copy */}
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-blue-100 text-sm font-medium px-4 py-1.5 rounded-full mb-6 border border-white/20">
              <Building2 className="h-3.5 w-3.5 text-amber-300" />
              For Organizations
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight mb-5">
              Corporate Training{" "}
              <span className="text-amber-300">Solutions</span>
            </h2>

            <p className="text-blue-100 text-lg leading-relaxed mb-8 max-w-lg">
              Invest in your workforce with industry-specific training programs.
              We partner with organizations to build skilled, certified teams
              that drive business growth and operational excellence.
            </p>

            {/* Client types */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              {clientTypes.map((type) => (
                <span
                  key={type}
                  className="flex items-center gap-2 text-blue-200 text-sm"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />
                  {type}
                </span>
              ))}
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                asChild
                size="lg"
                className="bg-white text-blue-900 hover:bg-blue-50 font-bold text-base px-8 py-6 shadow-lg"
              >
                <Link href="/enterprise">
                  Corporate Training Inquiry{" "}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Right Column — Benefits Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:bg-white/15 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-amber-300/20 flex items-center justify-center mb-4">
                  <benefit.icon className="h-5 w-5 text-amber-300" />
                </div>
                <h3 className="font-bold text-white mb-2">{benefit.title}</h3>
                <p className="text-sm text-blue-200 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
