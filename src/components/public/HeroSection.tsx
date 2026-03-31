import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  CheckCircle2,
  Users,
  Building2,
  GraduationCap,
  Globe,
  Award,
  TrendingUp,
  LogIn,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const stats = [
  { icon: Users, value: "2,400+", label: "Trained Professionals" },
  { icon: Globe, value: "15+", label: "Industry Programs" },
  { icon: Award, value: "95%", label: "Certification Rate" },
  { icon: TrendingUp, value: "85%", label: "Career Placement" },
] as const;

const trustPoints = [
  "Industry-recognized certifications",
  "Expert-led training programs",
  "Flexible learning schedules",
  "Career placement support",
] as const;

/* ------------------------------------------------------------------ */
/*  HeroSection                                                        */
/* ------------------------------------------------------------------ */

export function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 text-white overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-white rounded-full translate-x-1/3 translate-y-1/3" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column — Copy + CTAs */}
          <div>
            {/* Trust Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-blue-100 text-sm font-medium px-4 py-1.5 rounded-full mb-8 border border-white/20">
              <GraduationCap className="h-3.5 w-3.5 text-amber-300" />
              The Philippines&apos; Premier Professional Training Platform
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.08] mb-6 tracking-tight">
              Build{" "}
              <span className="text-amber-300">World-Class</span>{" "}
              Careers Through Expert Training
            </h1>

            {/* Subheadline — dual audience */}
            <p className="text-blue-100 text-lg sm:text-xl leading-relaxed mb-8 max-w-xl">
              Whether you&apos;re an{" "}
              <strong className="text-white">individual professional</strong>{" "}
              advancing your career or an{" "}
              <strong className="text-white">organization</strong>{" "}
              building a skilled workforce — HUMI Hub delivers
              industry-specific training that produces results.
            </p>

            {/* Primary CTA — Enroll Now */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <Button
                asChild
                size="lg"
                className="bg-amber-400 hover:bg-amber-300 text-blue-950 font-extrabold text-base px-8 py-6 shadow-xl shadow-amber-400/40 transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                <Link href="/enroll">
                  Enroll Now <ArrowRight className="ml-2 h-5 w-5" />
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
                  Corporate Training Solutions
                </Link>
              </Button>
            </div>

            {/* Secondary: Log In */}
            <div className="mb-8">
              <Link
                href="/portal"
                className="inline-flex items-center gap-1.5 text-blue-300 hover:text-white text-sm font-medium transition-colors"
              >
                <LogIn className="h-3.5 w-3.5" />
                Already enrolled? Log In
              </Link>
            </div>

            {/* Trust points */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {trustPoints.map((point) => (
                <span
                  key={point}
                  className="flex items-center gap-1.5 text-blue-200 text-sm"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />
                  {point}
                </span>
              ))}
            </div>
          </div>

          {/* Right Column — Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:bg-white/15 transition-colors text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-300/20 flex items-center justify-center mx-auto mb-3">
                  <stat.icon className="h-6 w-6 text-amber-300" />
                </div>
                <p className="text-3xl font-extrabold text-white leading-tight">
                  {stat.value}
                </p>
                <p className="text-blue-200 text-sm mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
