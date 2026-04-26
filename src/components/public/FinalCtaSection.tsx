import Link from "next/link";
import { CalendarCheck, ArrowRight } from "lucide-react";

export function FinalCtaSection() {
  return (
    <section className="relative bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 py-24 overflow-hidden">

      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

        <p className="text-sm font-semibold uppercase tracking-widest text-blue-300 mb-4">
          Your operating system awaits
        </p>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-[1.1] mb-6">
          Give your leadership team<br className="hidden sm:block" />
          the visibility they&apos;ve been missing.
        </h2>

        <p className="text-blue-200/80 text-lg max-w-xl mx-auto mb-10">
          500+ companies already run every department — HR, Finance, Sales,
          IT, and Training — from a single command center. Yours can too.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-white text-blue-900 font-bold text-base px-8 py-4 rounded-xl shadow-lg hover:bg-blue-50 transition-colors w-full sm:w-auto justify-center"
          >
            <CalendarCheck className="h-5 w-5" />
            Book a Demo
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 border border-white/30 text-white font-semibold text-base px-8 py-4 rounded-xl hover:bg-white/10 transition-colors w-full sm:w-auto justify-center"
          >
            Start Free
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>

        <p className="text-blue-300/60 text-sm mt-6">
          Free plan available · No credit card required · Cancel anytime
        </p>

      </div>
    </section>
  );
}
