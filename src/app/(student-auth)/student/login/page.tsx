"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import {
  Building2,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/* ------------------------------------------------------------------ */
/*  Feature highlights shown on the left branding panel               */
/* ------------------------------------------------------------------ */

const FEATURES = [
  { label: "Training Management", description: "Courses, lessons, certifications" },
  { label: "HR & Workforce", description: "People, attendance, performance" },
  { label: "Finance & Accounting", description: "Invoices, expenses, reports" },
  { label: "Sales & Operations", description: "Pipelines, tasks, analytics" },
  { label: "IT Systems", description: "Assets, tickets, administration" },
] as const;

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function TenantPortalLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Step 1: Fast pre-check — surfaces access/lock errors before bcrypt
      const checkRes = await fetch("/api/auth/validate-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "student", email }),
      });
      const checkData = (await checkRes.json()) as {
        ok: boolean | null;
        error?: string;
        mustChangePassword?: boolean;
      };

      if (checkData.ok === false) {
        setError(checkData.error ?? "Access denied. Please contact your administrator.");
        setLoading(false);
        return;
      }

      const mustChangePassword = checkData.mustChangePassword ?? false;

      // Step 2: Authenticate and create session
      const result = await signIn("student", {
        email,
        password,
        redirect: false,
      });

      setLoading(false);

      if (result?.error) {
        setError("Invalid email or password. Please try again.");
        return;
      }

      // Step 3: Redirect — password change takes priority
      if (mustChangePassword) {
        router.push("/student/change-password");
      } else {
        router.push("/student/dashboard");
      }
      router.refresh();
    } catch {
      setLoading(false);
      setError("Network error. Please try again.");
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">

      {/* ── LEFT PANEL — Branding ── */}
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-blue-950 via-blue-900 to-purple-800 text-white p-12">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="bg-white/15 border border-white/20 rounded-xl p-2.5">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">HUMI Hub</span>
        </div>

        {/* Headline */}
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-extrabold leading-tight mb-4 tracking-tight">
              Manage your business<br />in one place
            </h1>
            <p className="text-blue-200 text-lg">
              Training, HR, Finance, IT, Sales — unified system
            </p>
          </div>

          {/* Feature list */}
          <ul className="space-y-4 mt-8">
            {FEATURES.map((f) => (
              <li key={f.label} className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm text-white">{f.label}</p>
                  <p className="text-xs text-blue-300">{f.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <p className="text-blue-400 text-xs">
          &copy; {new Date().getFullYear()} HUMI Hub. All rights reserved.
        </p>
      </div>

      {/* ── RIGHT PANEL — Login Form ── */}
      <div className="flex flex-col items-center justify-center bg-gray-50 px-6 py-12">

        {/* Mobile logo (hidden on desktop) */}
        <div className="flex items-center gap-2 mb-8 lg:hidden">
          <div className="bg-blue-900 rounded-xl p-2">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-gray-900 text-lg">HUMI Hub</span>
        </div>

        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 sm:p-10">
            {/* Title */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                Tenant Portal Access
              </h2>
              <p className="text-sm text-gray-500">
                Login to your workspace. Your dashboard loads automatically based on your role and permissions.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/forgot-password?type=student"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-sm">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-700 hover:bg-blue-800 h-11"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Login
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            {/* Help links */}
            <div className="mt-6 pt-5 border-t border-gray-100 space-y-2">
              <a
                href="/forgot-password?type=student&mode=email"
                className="block text-sm text-blue-600 hover:underline"
              >
                I don&apos;t know my email address
              </a>
              <Link
                href="/portal"
                className="block text-sm text-gray-500 hover:text-gray-700"
              >
                ← Back to portal selection
              </Link>
            </div>
          </div>

          {/* Powered by */}
          <p className="text-center text-xs text-gray-400 mt-6">
            Powered by <span className="font-semibold text-gray-500">HUMI Hub</span>
          </p>
        </div>
      </div>

    </div>
  );
}
