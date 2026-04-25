import Link from "next/link";
import { UserPlus, Settings2, Rocket, ArrowRight } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Steps                                                              */
/* ------------------------------------------------------------------ */

const steps = [
  {
    number: "01",
    icon: UserPlus,
    title: "Create your account",
    description:
      "Sign up in under two minutes. No credit card, no sales call required. Your portal is ready the moment you confirm your email.",
    cta: null,
  },
  {
    number: "02",
    icon: Settings2,
    title: "Configure your workspace",
    description:
      "Add your team, set up departments, upload your brand logo, and connect the modules your business actually uses — skip what you don't need.",
    cta: null,
  },
  {
    number: "03",
    icon: Rocket,
    title: "Go live in minutes",
    description:
      "Invite employees, assign courses, run payroll, and start tracking everything from a single dashboard. Real results from day one.",
    cta: { label: "Start Free", href: "/register" },
  },
] as const;

/* ------------------------------------------------------------------ */
/*  HowItWorksNewSection                                               */
/* ------------------------------------------------------------------ */

export function HowItWorksNewSection() {
  return (
    <section className="bg-white py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-600 mb-2">
            Simple by design
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
            Up and running in three steps
          </h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            Most teams go live the same day they sign up. Here&apos;s why.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">

          {/* Connector line — desktop only */}
          <div
            className="hidden lg:block absolute top-10 left-[calc(16.67%+1.5rem)] right-[calc(16.67%+1.5rem)] h-0.5 bg-gradient-to-r from-blue-200 via-blue-400 to-blue-200"
            aria-hidden="true"
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-8">
            {steps.map((step) => (
              <div key={step.number} className="flex flex-col items-center text-center relative">

                {/* Number + icon bubble */}
                <div className="relative mb-6">
                  <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200">
                    <step.icon className="h-9 w-9 text-white" />
                  </div>
                  <span className="absolute -top-3 -right-3 h-7 w-7 rounded-full bg-slate-900 text-white text-xs font-extrabold flex items-center justify-center border-2 border-white">
                    {step.number}
                  </span>
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto">
                  {step.description}
                </p>

                {/* CTA on last step */}
                {step.cta && (
                  <Link
                    href={step.cta.href}
                    className="mt-6 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-6 py-3 rounded-xl shadow-md transition-colors"
                  >
                    {step.cta.label}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom note */}
        <div className="mt-14 flex flex-wrap justify-center gap-6 text-sm text-slate-400 font-medium">
          {["No setup fee", "Cancel anytime", "Works on any device", "Dedicated support"].map((note) => (
            <span key={note} className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
              {note}
            </span>
          ))}
        </div>

      </div>
    </section>
  );
}
