"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { GraduationCap, Users, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";

interface TenantBranding {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  siteName: string | null;
  primaryColor: string | null;
  tagline: string | null;
}

type LoginRole = "student" | "corporate";

function TenantLoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = searchParams.get("slug") ?? "";

  const [tenant, setTenant] = useState<TenantBranding | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [role, setRole] = useState<LoginRole>("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) { setNotFound(true); setLoading(false); return; }
    fetch(`/api/tenant/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setTenant(data.data);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const provider = role === "student" ? "student" : "corporate";
    const callbackUrl = role === "student" ? "/student/dashboard" : "/corporate/dashboard";

    const result = await signIn(provider, {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    });

    setSubmitting(false);

    if (result?.error) {
      setError("Invalid email or password. Please try again.");
    } else if (result?.ok) {
      router.push(callbackUrl);
    }
  }

  const primaryColor = tenant?.primaryColor ?? "#1E3A8A";

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="h-16 w-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Organization Not Found</h1>
          <p className="text-gray-500 text-sm">The training center you&apos;re looking for doesn&apos;t exist or is inactive.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-12">
      {/* Branding Header */}
      <div className="text-center mb-8">
        {tenant?.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={tenant.logoUrl} alt={tenant.name} className="h-16 w-auto mx-auto mb-4 object-contain" />
        ) : (
          <div
            className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: primaryColor }}
          >
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
        )}
        <h1 className="text-2xl font-bold text-gray-900">{tenant?.siteName ?? tenant?.name}</h1>
        {tenant?.tagline && (
          <p className="text-gray-500 text-sm mt-1">{tenant.tagline}</p>
        )}
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Role Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => { setRole("student"); setError(""); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium transition-colors ${
              role === "student"
                ? "text-white border-b-2"
                : "text-slate-500 hover:text-slate-700 bg-slate-50"
            }`}
            style={role === "student" ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
          >
            <GraduationCap className="h-4 w-4" />
            Student
          </button>
          <button
            onClick={() => { setRole("corporate"); setError(""); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium transition-colors ${
              role === "corporate"
                ? "text-white border-b-2"
                : "text-slate-500 hover:text-slate-700 bg-slate-50"
            }`}
            style={role === "corporate" ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
          >
            <Users className="h-4 w-4" />
            Corporate
          </button>
        </div>

        {/* Form */}
        <div className="p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-gray-900">
              {role === "student" ? "Student Login" : "Corporate Login"}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {role === "student"
                ? "Access your courses, lessons, and assignments"
                : "Manage your team's training and progress"}
            </p>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:border-transparent placeholder:text-slate-400"
                style={{ "--tw-ring-color": primaryColor } as React.CSSProperties}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:border-transparent placeholder:text-slate-400 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-opacity disabled:opacity-70"
              style={{ backgroundColor: primaryColor }}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {submitting ? "Signing in\u2026" : "Sign In"}
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-6 text-xs text-slate-400">
        Powered by <span className="font-semibold text-slate-500">HUMI</span>
      </p>
    </div>
  );
}

export default function TenantLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <TenantLoginContent />
    </Suspense>
  );
}
