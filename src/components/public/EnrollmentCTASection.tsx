import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const guarantees = [
  "No experience required",
  "Flexible payment options",
  "Industry certification included",
  "Career placement support",
] as const;

/* ------------------------------------------------------------------ */
/*  EnrollmentCTASection                                               */
/* ------------------------------------------------------------------ */

export function EnrollmentCTASection() {
  return (
    <section className="relative py-20 px-4 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 right-10 w-72 h-72 bg-white rounded-full" />
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-white rounded-full" />
      </div>

      <div className="relative max-w-4xl mx-auto text-center">
        {/* Headline */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-5">
          Ready to Build Your{" "}
          <span className="text-amber-300">Future?</span>
        </h2>

        <p className="text-blue-100 text-lg sm:text-xl max-w-2xl mx-auto mb-8 leading-relaxed">
          Join thousands of professionals who transformed their careers through
          HUMI Training Center. Applications are open year-round — start your
          journey today.
        </p>

        {/* Guarantees */}
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-10">
          {guarantees.map((point) => (
            <span
              key={point}
              className="flex items-center gap-1.5 text-blue-200 text-sm"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />
              {point}
            </span>
          ))}
        </div>

        {/* Dual CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            asChild
            size="lg"
            className="bg-white text-blue-900 hover:bg-blue-50 font-bold text-base px-10 py-6 shadow-lg shadow-blue-900/30"
          >
            <Link href="/enroll">
              Enroll Now — Free Application{" "}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-white/40 text-white hover:bg-white/10 font-semibold text-base px-8 py-6"
          >
            <Link href="/enterprise">
              <Building2 className="mr-2 h-4 w-4" />
              Corporate Training Inquiry
            </Link>
          </Button>
        </div>

        <p className="text-blue-300/70 text-sm mt-8">
          Have questions?{" "}
          <Link
            href="/contact"
            className="text-blue-200 underline hover:text-white transition-colors"
          >
            Contact our admissions team
          </Link>
        </p>
      </div>
    </section>
  );
}
