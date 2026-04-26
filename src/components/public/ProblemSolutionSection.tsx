import { XCircle, CheckCircle, ArrowRight } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const pairs = [
  {
    problem: "Executives wait days for reports that are already out of date by the time they arrive",
    solution: "A live command center gives leadership real-time visibility across every department",
  },
  {
    problem: "Finance, HR, Sales, and IT each run separate tools that never share data",
    solution: "All departments feed into one connected operating system — nothing is siloed",
  },
  {
    problem: "Department heads have no visibility into what other teams are doing or where work is blocked",
    solution: "Cross-department dashboards show every team's status, tasks, and outputs in one place",
  },
  {
    problem: "Strategic decisions are made on incomplete data pulled from five different systems",
    solution: "Unified data from every corner of the business powers faster, smarter decisions",
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
            Your company deserves better than this.
          </h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            Most organisations run on fragmented tools and delayed reports. HUMI Hub replaces all of it.
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
              &ldquo;For the first time, our CEO can see Finance, HR, and Sales<br className="hidden sm:block" /> in one screen — without asking anyone for a report.&rdquo;
            </p>
            <p className="text-slate-400 text-sm mt-2">— COO, mid-size enterprise, 300+ employees</p>
          </div>
        </div>

      </div>
    </section>
  );
}
