"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { GraduationCap, Users, ShieldCheck, Briefcase, Eye, EyeOff, Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface TenantBranding {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  siteName: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  tagline: string | null;
  faviconUrl: string | null;
}

type LoginRole = "student" | "trainer" | "corporate" | "admin";

const ROLE_CONFIG: Record<LoginRole, { label: string; description: string; icon: typeof GraduationCap; provider: string; callbackUrl: string }> = {
  student: {
    label: "Student",
    description: "Access your courses, lessons, and assignments",
    icon: GraduationCap,
    provider: "student",
    callbackUrl: "/student/dashboard",
  },
  trainer: {
    label: "Trainer",
    description: "Manage your classes, students, and materials",
    icon: Briefcase,
    provider: "trainer",
    callbackUrl: "/trainer",
  },
  corporate: {
    label: "Corporate",
    description: "Manage your team's training and progress",
    icon: Users,
    provider: "corporate",
    callbackUrl: "/corporate/dashboard",
  },
  admin: {
    label: "Admin",
    description: "Manage your training center",
    icon: ShieldCheck,
    provider: "corporate",
    callbackUrl: "/admin",
  },
};

const ERROR_MESSAGES: Record<string, string> = {
  tenant_mismatch: "Your account is registered with a different organization. Please use the correct portal.",
  CredentialsSignin: "Invalid email or password. Please try again.",
};

function TenantLoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = searchParams.get("slug") ?? "";
  const urlError = searchParams.get("error") ?? "";

  const [tenant, setTenant] = useState<TenantBranding | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [role, setRole] = useState<LoginRole>("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(ERROR_MESSAGES[urlError] ?? "");

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

    const config = ROLE_CONFIG[role];

    const result = await signIn(config.provider, {
      email: email.trim().toLowerCase(),
      password,
      subdomain: slug,           // ← tenant enforcement in auth.ts
      redirect: false,
    });

    setSubmitting(false);

    if (result?.error) {
      setError(
        result.error === "CredentialsSignin"
          ? "Invalid email or password. Please try again."
          : result.error,
      );
    } else if (result?.ok) {
      // Relative redirect stays on the current subdomain
      router.push(config.callbackUrl);
      router.refresh();
    }
  }

  const primaryColor = tenant?.primaryColor ?? "#1E3A8A";
  const secondaryColor = tenant?.secondaryColor ?? "#1E40AF";

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: primaryColor }} />
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
          <p className="text-gray-500 text-sm">
            The training center you&apos;re looking for doesn&apos;t exist or is inactive.
          </p>
        </div>
      </div>
    );
  }

  const displayName = tenant?.siteName ?? tenant?.name ?? "Training Center";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: `linear-gradient(135deg, ${primaryColor}18 0%, ${secondaryColor}10 100%)` }}
    >
      {/* Branding Header */}
      <div className="text-center mb-8">
        {tenant?.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tenant.logoUrl}
            alt={displayName}
            className="h-16 w-auto mx-auto mb-4 object-contain"
          />
        ) : (
          <div
            className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
            style={{ backgroundColor: primaryColor }}
          >
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
        )}
        <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
        {tenant?.tagline && (
          <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">{tenant.tagline}</p>
        )}
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
        {/* Role Tabs */}
        <div className="flex border-b border-slate-200">
          {(Object.keys(ROLE_CONFIG) as LoginRole[]).map((r) => {
            const { label, icon: Icon } = ROLE_CONFIG[r];
            const isActive = role === r;
            return (
              <button
                key={r}
                onClick={() => { setRole(r); setError(""); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-sm font-medium transition-colors ${
                  isActive ? "text-white" : "text-slate-500 hover:text-slate-700 bg-slate-50"
                }`}
                style={isActive ? { backgroundColor: primaryColor } : {}}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            );
          })}
        </div>

        {/* Form */}
        <div className="p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-gray-900">
              {ROLE_CONFIG[role].label} Login
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {ROLE_CONFIG[role].description}
            </p>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address
              </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
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
              className="w-full py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-opacity disabled:opacity-70 shadow-sm hover:opacity-90"
              style={{ backgroundColor: primaryColor }}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {submitting ? "Signing in\u2026" : "Sign In"}
            </button>
          </form>
        </div>
      </div>

      {/* Back to Home */}
      <div className="mt-5">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Home
        </Link>
      </div>

      {/* Tenant slug badge + powered by */}
      <div className="mt-4 flex flex-col items-center gap-1">
        <span
          className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-mono font-medium border"
          style={{ color: primaryColor, borderColor: `${primaryColor}40`, backgroundColor: `${primaryColor}10` }}
        >
          {slug}.portal
        </span>
        <p className="text-xs text-slate-400">
          Powered by <span className="font-semibold text-slate-500">Humi Hub</span>
        </p>
      </div>
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
