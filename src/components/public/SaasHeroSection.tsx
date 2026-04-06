import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Play,
  Shield,
  Clock,
  MessageSquare,
  BookOpen,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Trust Badges                                                       */
/* ------------------------------------------------------------------ */

const trustBadges = [
  { icon: Shield,       label: "Enterprise-grade security" },
  { icon: Clock,        label: "99.9% uptime SLA"          },
  { icon: MessageSquare, label: "24/7 support"              },
  { icon: BookOpen,     label: "Free onboarding"            },
] as const;

/* ------------------------------------------------------------------ */
/*  SaasHeroSection                                                    */
/* ------------------------------------------------------------------ */

export function SaasHeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 text-white overflow-hidden">
      {/* Background accents */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-blue-200 text-sm font-medium px-4 py-1.5 rounded-full mb-8 border border-white/15">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          All-in-One Business Operations Platform
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.08] mb-6 tracking-tight">
          Run Your Entire{" "}
          <span className="bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent">
            Business
          </span>{" "}
          in One Platform
        </h1>

        <p className="text-blue-100/90 text-lg sm:text-xl leading-relaxed mb-8 max-w-2xl mx-auto">
          Manage operations, people, and performance with a centralized
          system built for growing businesses across industries. Training
          management, HR, admin, IT, sales, and finance — all in one place.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
          <Button
            asChild
            size="lg"
            className="bg-white text-slate-900 hover:bg-blue-50 font-bold text-base px-8 py-6 shadow-lg shadow-blue-950/40"
          >
            <Link href="/contact">
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 border border-white/40 text-white hover:bg-white/10 font-semibold text-base px-8 py-4 rounded-lg transition-colors"
          >
            <Play className="h-4 w-4" />
            Book a Demo
          </Link>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap gap-4 justify-center">
          {trustBadges.map((badge) => (
            <span
              key={badge.label}
              className="flex items-center gap-1.5 text-blue-200/80 text-sm"
            >
              <badge.icon className="h-3.5 w-3.5 text-blue-300" />
              {badge.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
