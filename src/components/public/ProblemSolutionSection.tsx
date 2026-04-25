import { XCircle, CheckCircle, ArrowRight } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const pairs = [
  {
    problem: "HR paperwork piles up while training falls behind schedule",
    solution: "One dashboard manages leave, payroll, and courses simultaneously",
  },
  {
    problem: "Your team uses five separate tools that don't talk to each other",
    solution: "HUMI Hub unifies every operation into a single control center",
  },
  {
    problem: "Onboarding new hires takes days of back-and-forth coordination",
    solution: "Structured onboarding flows get people productive in under an hour",
  },
  {
    problem: "No visibility into who completed training or why attendance dropped",
    solution: "Real-time analytics show exactly where your workforce stands",
  },
] as const;

/* ------------------------------------------------------------------ */
/*  ProblemSolutionSection                                             */
/* ------------------------------------------------------------------ */

export function ProblemSolutionSection() {
  return (
    <section className="bg-white py-20 overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-sm font-semibold uppercase tracking-widest text-red-500 mb-2">
            Sound familiar?
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
            Running a business shouldn&apos;t feel like this.
          </h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            Most teams are stitching together workarounds instead of actually growing. HUMI Hub fixes that.
          </p>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 mb-6 px-2">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-400 shrink-0" />
            <span className="text-sm font-bold uppercase tracking-widest text-red-400">The Problem</span>
          </div>
          <div className="w-8" />
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
            <span className="text-sm font-bold uppercase tracking-widest text-emerald-500">The Fix</span>
          </div>
        </div>

        {/* Pairs */}
        <div className="space-y-4">
          {pairs.map((pair, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 group"
            >
              {/* Problem */}
              <div className="bg-red-50 border border-red-100 rounded-xl px-5 py-4 flex items-start gap-3">
                <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 font-medium leading-snug">{pair.problem}</p>
              </div>

              {/* Arrow */}
              <div className="flex items-center justify-center">
                <div className="h-8 w-8 rounded-full bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                </div>
              </div>

              {/* Solution */}
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-5 py-4 flex items-start gap-3">
                <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-sm text-emerald-800 font-medium leading-snug">{pair.solution}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom pull quote */}
        <div className="mt-14 text-center">
          <div className="inline-block bg-slate-900 text-white rounded-2xl px-8 py-5 shadow-lg">
            <p className="text-lg sm:text-xl font-bold leading-snug">
              &ldquo;We cut tool costs by 60% and onboarding time in half<br className="hidden sm:block" /> within the first month.&rdquo;
            </p>
            <p className="text-slate-400 text-sm mt-2">— Early customer, Training & Development company</p>
          </div>
        </div>

      </div>
    </section>
  );
}
