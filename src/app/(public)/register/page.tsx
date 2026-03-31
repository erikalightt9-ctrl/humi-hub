"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { tenantRegisterSchema, type TenantRegisterData } from "@/lib/validations/register.schema";
import {
  GraduationCap,
  Eye,
  EyeOff,
  CheckCircle2,
  Loader2,
  ArrowRight,
  User,
  Mail,
  Phone,
  Lock,
  BookOpen,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TenantBranding {
  name: string;
  siteName: string | null;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  tagline: string | null;
}

interface CourseOption {
  id: string;
  title: string;
  slug: string;
  durationWeeks: number;
  price: number;
}

// ---------------------------------------------------------------------------
// Input wrapper
// ---------------------------------------------------------------------------

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      {children}
      {error && (
        <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
          <span className="inline-block w-1 h-1 rounded-full bg-red-500 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

const INPUT_BASE =
  "w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm text-slate-900 placeholder:text-slate-400 " +
  "focus:outline-none focus:ring-2 transition-all bg-white";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseIdParam = searchParams.get("courseId") ?? "";

  const [branding, setBranding] = useState<TenantBranding | null>(null);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loadingBranding, setLoadingBranding] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);

  const primary = branding?.primaryColor ?? "#1d4ed8";
  const secondary = branding?.secondaryColor ?? "#3b82f6";
  const displayName = branding?.siteName ?? branding?.name ?? "Training Center";

  // Load tenant branding + courses
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/tenant-info");
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setBranding({
              name: json.data.name,
              siteName: json.data.siteName,
              logoUrl: json.data.logo,
              primaryColor: json.data.primary_color ?? "#1d4ed8",
              secondaryColor: json.data.secondary_color ?? "#3b82f6",
              tagline: json.data.tagline,
            });
          }
        }
      } catch {
        // No tenant branding — using defaults
      }

      try {
        const res = await fetch("/api/courses?active=true&limit=50");
        if (res.ok) {
          const json = await res.json();
          const list: CourseOption[] = (json.data ?? json.courses ?? []).map(
            (c: { id: string; title: string; slug: string; durationWeeks?: number; price?: number }) => ({
              id: c.id,
              title: c.title,
              slug: c.slug,
              durationWeeks: c.durationWeeks ?? 8,
              price: Number(c.price ?? 0),
            }),
          );
          setCourses(list);
        }
      } catch {
        // Silently handled
      }

      setLoadingBranding(false);
    }
    void load();
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TenantRegisterData>({
    resolver: zodResolver(tenantRegisterSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      courseId: courseIdParam,
    },
  });

  // Pre-select course from URL param once courses load
  useEffect(() => {
    if (courseIdParam && courses.some((c) => c.id === courseIdParam)) {
      setValue("courseId", courseIdParam);
    } else if (courses.length > 0 && !courseIdParam) {
      setValue("courseId", courses[0].id);
    }
  }, [courses, courseIdParam, setValue]);

  const onSubmit = useCallback(
    async (data: TenantRegisterData) => {
      setServerError("");
      try {
        const res = await fetch("/api/tenant/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const json = (await res.json()) as { success: boolean; error?: string };
        if (!res.ok || !json.success) {
          setServerError(json.error ?? "Registration failed. Please try again.");
          return;
        }
        setSuccess(true);
        // Redirect to student login after 2 s
        setTimeout(() => router.push("/login"), 2000);
      } catch {
        setServerError("A network error occurred. Please check your connection.");
      }
    },
    [router],
  );

  const focusRing = `focus:ring-[${primary}]/30 focus:border-[${primary}]`;
  void focusRing; // used inline below

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-10 text-center max-w-md w-full">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: `${primary}15` }}
          >
            <CheckCircle2 className="h-8 w-8" style={{ color: primary }} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">You&apos;re enrolled!</h2>
          <p className="text-slate-500 text-sm mb-6">
            Your account has been created. Redirecting you to the login page…
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-white font-semibold px-6 py-3 rounded-lg transition hover:opacity-90"
            style={{ backgroundColor: primary }}
          >
            Go to Login <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ─── Branded top bar ─── */}
      <div
        className="h-1.5 w-full"
        style={{ background: `linear-gradient(90deg, ${primary}, ${secondary})` }}
      />

      <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
        <div className="grid lg:grid-cols-5 gap-10 items-start">

          {/* ─── Left: brand panel ─── */}
          <div className="lg:col-span-2 lg:sticky lg:top-8">
            {/* Logo / name */}
            <div className="flex items-center gap-3 mb-6">
              {branding?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={branding.logoUrl} alt={displayName} className="h-10 w-auto object-contain" />
              ) : (
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: primary }}
                >
                  <GraduationCap className="h-5 w-5 text-white" />
                </div>
              )}
              {!loadingBranding && (
                <span className="text-xl font-bold text-slate-900">{displayName}</span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-4">
              Start your learning journey today
            </h1>

            {branding?.tagline && (
              <p className="text-slate-500 text-base mb-6">{branding.tagline}</p>
            )}

            {/* Benefit checklist */}
            <ul className="space-y-3">
              {[
                "Instant access after registration",
                "Self-paced + live training sessions",
                "Certificate upon completion",
                "Job placement assistance",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-700">
                  <CheckCircle2 className="h-4.5 w-4.5 mt-0.5 shrink-0" style={{ color: primary }} />
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-8 pt-6 border-t border-slate-200 text-sm text-slate-500">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold hover:underline" style={{ color: primary }}>
                Log in
              </Link>
            </div>
          </div>

          {/* ─── Right: form card ─── */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Card header */}
              <div
                className="px-8 py-6 text-white"
                style={{ background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)` }}
              >
                <h2 className="text-xl font-bold">Create your account</h2>
                <p className="text-white/75 text-sm mt-1">
                  Fill in your details and select a course to begin
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="px-8 py-7 space-y-5">
                {/* Server error */}
                {serverError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-start gap-2">
                    <span className="mt-0.5 shrink-0 text-red-500">⚠</span>
                    {serverError}
                  </div>
                )}

                {/* Name */}
                <FormField label="Full Name" error={errors.name?.message}>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      {...register("name")}
                      type="text"
                      autoComplete="name"
                      placeholder="Maria Santos"
                      className={`${INPUT_BASE} ${errors.name ? "border-red-300 focus:ring-red-200" : "border-slate-300 focus:ring-blue-200 focus:border-blue-500"}`}
                    />
                  </div>
                </FormField>

                {/* Email */}
                <FormField label="Email Address" error={errors.email?.message}>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      {...register("email")}
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      className={`${INPUT_BASE} ${errors.email ? "border-red-300 focus:ring-red-200" : "border-slate-300 focus:ring-blue-200 focus:border-blue-500"}`}
                    />
                  </div>
                </FormField>

                {/* Phone */}
                <FormField label="Phone Number" error={errors.phone?.message}>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      {...register("phone")}
                      type="tel"
                      autoComplete="tel"
                      placeholder="+63 912 345 6789"
                      className={`${INPUT_BASE} ${errors.phone ? "border-red-300 focus:ring-red-200" : "border-slate-300 focus:ring-blue-200 focus:border-blue-500"}`}
                    />
                  </div>
                </FormField>

                {/* Course selection */}
                <FormField label="Select Course" error={errors.courseId?.message}>
                  <div className="relative">
                    <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <select
                      {...register("courseId")}
                      className={`${INPUT_BASE} appearance-none ${errors.courseId ? "border-red-300 focus:ring-red-200" : "border-slate-300 focus:ring-blue-200 focus:border-blue-500"}`}
                    >
                      <option value="" disabled>
                        Choose a course…
                      </option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                          {c.durationWeeks ? ` — ${c.durationWeeks} weeks` : ""}
                          {c.price > 0 ? ` (₱${c.price.toLocaleString("en-PH")})` : " (Free)"}
                        </option>
                      ))}
                    </select>
                  </div>
                </FormField>

                {/* Password */}
                <FormField label="Password" error={errors.password?.message}>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      {...register("password")}
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="At least 8 characters"
                      className={`${INPUT_BASE} pr-10 ${errors.password ? "border-red-300 focus:ring-red-200" : "border-slate-300 focus:ring-blue-200 focus:border-blue-500"}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </FormField>

                {/* Confirm Password */}
                <FormField label="Confirm Password" error={errors.confirmPassword?.message}>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      {...register("confirmPassword")}
                      type={showConfirm ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Re-enter your password"
                      className={`${INPUT_BASE} pr-10 ${errors.confirmPassword ? "border-red-300 focus:ring-red-200" : "border-slate-300 focus:ring-blue-200 focus:border-blue-500"}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </FormField>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 text-white font-bold py-3 px-6 rounded-lg transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                  style={{ backgroundColor: primary }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating your account…
                    </>
                  ) : (
                    <>
                      Create Account &amp; Enroll
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-slate-400 mt-2">
                  By registering, you agree to our{" "}
                  <Link href="/terms" className="hover:underline" style={{ color: primary }}>
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="hover:underline" style={{ color: primary }}>
                    Privacy Policy
                  </Link>
                  .
                </p>
              </form>
            </div>

            {/* Trust note */}
            <div className="mt-4 flex items-center justify-center gap-6 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Lock className="h-3 w-3" />
                256-bit SSL encryption
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3" />
                No credit card required
              </span>
              <span className="flex items-center gap-1.5">
                <GraduationCap className="h-3 w-3" />
                Instant access
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
