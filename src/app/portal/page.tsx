import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap, ShieldCheck, BookOpen, ArrowRight, Home, Building2 } from "lucide-react";
import { TenantFinder } from "@/components/public/TenantFinder";

export const metadata: Metadata = {
  title: "Portal — Select Your Role",
  description: "Access the HUMI Hub admin or student portal.",
};

export default function PortalPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-white/90 hover:text-white transition-colors"
        >
          <GraduationCap className="h-7 w-7 text-blue-300" />
          <span className="font-bold text-lg tracking-tight">HUMI Hub</span>
        </Link>
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-blue-300 hover:text-white transition-colors"
        >
          <Home className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">
            Welcome Back
          </h1>
          <p className="text-blue-200 text-lg max-w-md mx-auto">
            Select your role to access your dashboard.
          </p>
        </div>

        {/* Role selection cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
          {/* Admin Card */}
          <Link href="/admin/login" className="group">
            <div className="relative bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 rounded-2xl p-8 h-full flex flex-col transition-all duration-200 cursor-pointer">
              <div className="flex items-center gap-4 mb-5">
                <div className="bg-amber-400/20 border border-amber-400/30 rounded-xl p-3">
                  <ShieldCheck className="h-8 w-8 text-amber-300" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Admin Portal</h2>
                  <p className="text-blue-300 text-sm">Management & oversight</p>
                </div>
              </div>
              <ul className="space-y-2 mb-8 flex-1">
                {[
                  "Manage enrollee applications",
                  "Review & approve students",
                  "Track analytics & reports",
                  "Manage courses & lessons",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-blue-100">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-amber-300 group-hover:text-amber-200 transition-colors">
                  Sign in as Admin
                </span>
                <ArrowRight className="h-4 w-4 text-amber-300 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Student / Enrollee Card */}
          <Link href="/student/login" className="group">
            <div className="relative bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 rounded-2xl p-8 h-full flex flex-col transition-all duration-200 cursor-pointer">
              <div className="flex items-center gap-4 mb-5">
                <div className="bg-emerald-400/20 border border-emerald-400/30 rounded-xl p-3">
                  <BookOpen className="h-8 w-8 text-emerald-300" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Student Portal</h2>
                  <p className="text-blue-300 text-sm">Learning & progress</p>
                </div>
              </div>
              <ul className="space-y-2 mb-8 flex-1">
                {[
                  "Access your course materials",
                  "Take quizzes & assignments",
                  "Track your progress & badges",
                  "Download your certificates",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-blue-100">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-emerald-300 group-hover:text-emerald-200 transition-colors">
                  Sign in as Student
                </span>
                <ArrowRight className="h-4 w-4 text-emerald-300 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </div>

        {/* Tenant Org Finder */}
        <div className="mt-12 w-full max-w-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-white/20" />
            <span className="text-blue-300 text-sm whitespace-nowrap">Logging in via your organization?</span>
            <div className="h-px flex-1 bg-white/20" />
          </div>

          <div className="bg-white/5 border border-white/15 rounded-2xl p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="bg-blue-400/20 border border-blue-400/30 rounded-xl p-2.5 shrink-0">
                <Building2 className="h-5 w-5 text-blue-300" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">Find Your Organization</h3>
                <p className="text-blue-300 text-xs mt-0.5">
                  Enter your organization&apos;s portal name to access their training portal.
                </p>
              </div>
            </div>
            <TenantFinder />
          </div>
        </div>

        {/* Divider + enroll CTA */}
        <div className="mt-10 text-center">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-20 bg-white/20" />
            <span className="text-blue-300 text-sm">New here?</span>
            <div className="h-px w-20 bg-white/20" />
          </div>
          <p className="text-blue-200 text-sm mb-3">
            Don&apos;t have an account? Apply for enrollment — it&apos;s free.
          </p>
          <Link
            href="/enroll"
            className="inline-flex items-center gap-2 bg-white text-blue-900 font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <GraduationCap className="h-4 w-4" />
            Apply for Enrollment
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-4 text-blue-400 text-xs">
        &copy; {new Date().getFullYear()} HUMI Hub. All rights reserved.
      </div>
    </div>
  );
}
