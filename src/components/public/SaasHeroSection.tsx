import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Play,
  BarChart3,
  Users,
  BookOpen,
  MessageSquare,
  Shield,
  Clock,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Dashboard Preview Card                                             */
/* ------------------------------------------------------------------ */

function DashboardPreview() {
  return (
    <div className="relative">
      {/* Floating cards around the dashboard */}
      <div className="absolute -top-4 -left-4 bg-white rounded-xl shadow-lg p-3 z-10 animate-pulse">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
            <Users className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Active Students</p>
            <p className="text-sm font-bold text-gray-900">2,847</p>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-4 -right-4 bg-white rounded-xl shadow-lg p-3 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Completion Rate</p>
            <p className="text-sm font-bold text-gray-900">94.2%</p>
          </div>
        </div>
      </div>

      {/* Main dashboard mockup */}
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Title bar */}
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 text-center">
            <div className="bg-white rounded-md px-3 py-1 text-xs text-gray-400 inline-block border border-gray-200">
              admin.yourdomain.com/dashboard
            </div>
          </div>
        </div>

        {/* Dashboard content */}
        <div className="p-4">
          {/* Stats row */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            {[
              { label: "Revenue", value: "₱2.4M", color: "bg-emerald-500" },
              { label: "Students", value: "847", color: "bg-blue-500" },
              { label: "Courses", value: "24", color: "bg-purple-500" },
              { label: "Trainers", value: "18", color: "bg-amber-500" },
            ].map((stat) => (
              <div key={stat.label} className="bg-gray-50 rounded-lg p-2.5">
                <div className={`w-1.5 h-1.5 rounded-full ${stat.color} mb-1.5`} />
                <p className="text-[10px] text-gray-500">{stat.label}</p>
                <p className="text-sm font-bold text-gray-900">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Chart placeholder */}
          <div className="bg-gray-50 rounded-lg p-3 mb-3">
            <p className="text-[10px] text-gray-500 mb-2">Enrollment Trend</p>
            <div className="flex items-end gap-1 h-12">
              {[40, 55, 45, 65, 50, 70, 60, 75, 85, 80, 90, 95].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 bg-blue-400 rounded-sm opacity-80"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>

          {/* Recent activity */}
          <div className="space-y-1.5">
            {[
              { text: "New enrollment: Maria Santos", color: "bg-blue-400" },
              { text: "Payment verified: ₱15,000", color: "bg-green-400" },
              { text: "Certificate issued: #2847", color: "bg-purple-400" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2 p-1.5 bg-gray-50 rounded-md">
                <div className={`w-1.5 h-1.5 rounded-full ${item.color}`} />
                <p className="text-[10px] text-gray-600 truncate">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Trust Badges                                                       */
/* ------------------------------------------------------------------ */

const trustBadges = [
  { icon: Shield, label: "Enterprise-grade security" },
  { icon: Clock, label: "99.9% uptime SLA" },
  { icon: MessageSquare, label: "24/7 support" },
  { icon: BookOpen, label: "Free onboarding" },
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

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — Copy */}
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-blue-200 text-sm font-medium px-4 py-1.5 rounded-full mb-8 border border-white/15">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Training Management Platform
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.08] mb-6 tracking-tight">
              All-in-One{" "}
              <span className="bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent">
                AI-Powered
              </span>{" "}
              Training Management System
            </h1>

            <p className="text-blue-100/90 text-lg sm:text-xl leading-relaxed mb-8 max-w-xl">
              Manage enrollments, students, trainers, payments, and analytics —
              all from one powerful platform. Replace your spreadsheets and
              manual processes with smart automation.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              <Button
                asChild
                size="lg"
                className="bg-white text-slate-900 hover:bg-blue-50 font-bold text-base px-8 py-6 shadow-lg shadow-blue-950/40"
              >
                <Link href="/contact">
                  Start Your Training Platform Today <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 font-semibold text-base px-8 py-6"
              >
                <Link href="/contact">
                  <Play className="mr-2 h-4 w-4" />
                  Book a Demo
                </Link>
              </Button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-4">
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

          {/* Right — Dashboard Preview */}
          <div className="hidden lg:block">
            <DashboardPreview />
          </div>
        </div>
      </div>
    </section>
  );
}
