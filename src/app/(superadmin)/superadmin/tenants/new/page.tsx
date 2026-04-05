"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  User,
  Palette,
  ChevronLeft,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/*  Types & constants                                                   */
/* ------------------------------------------------------------------ */

type Plan = "TRIAL" | "STARTER" | "PROFESSIONAL" | "ENTERPRISE";

const PLANS: { value: Plan; label: string; description: string; color: string }[] = [
  { value: "TRIAL", label: "Trial", description: "Basic features, limited seats", color: "border-amber-300 bg-amber-50 text-amber-800" },
  { value: "STARTER", label: "Starter", description: "+ Gamification", color: "border-blue-300 bg-blue-50 text-blue-800" },
  { value: "PROFESSIONAL", label: "Professional", description: "+ AI + Jobs", color: "border-purple-300 bg-purple-50 text-purple-800" },
  { value: "ENTERPRISE", label: "Enterprise", description: "All features", color: "border-indigo-300 bg-indigo-50 text-indigo-800" },
];

const INDUSTRIES = [
  "Technology", "Healthcare", "Education", "Finance", "Retail",
  "Manufacturing", "Logistics", "Real Estate", "Hospitality", "Other",
];

interface FormState {
  // Organization
  name: string;
  slug: string;
  subdomain: string;
  email: string;
  industry: string;
  plan: Plan;
  maxSeats: number;
  // Admin
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  confirmPassword: string;
  // Branding
  siteName: string;
  tagline: string;
  primaryColor: string;
  secondaryColor: string;
}

const INITIAL: FormState = {
  name: "", slug: "", subdomain: "", email: "", industry: "", plan: "TRIAL", maxSeats: 10,
  adminName: "", adminEmail: "", adminPassword: "", confirmPassword: "",
  siteName: "", tagline: "", primaryColor: "#6366f1", secondaryColor: "#a5b4fc",
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function toSlug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function Field({
  label, required, hint, children,
}: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function Input({
  value, onChange, placeholder, type = "text", className = "", ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-shadow ${className}`}
      {...rest}
    />
  );
}

function SectionHeader({ icon: Icon, title, subtitle }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="p-2 bg-indigo-100 rounded-lg mt-0.5">
        <Icon className="h-4 w-4 text-indigo-600" />
      </div>
      <div>
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default function NewTenantPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ orgId: string; name: string } | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleNameChange(value: string) {
    const slug = toSlug(value);
    setForm((prev) => ({
      ...prev,
      name: value,
      slug: prev.slug === toSlug(prev.name) ? slug : prev.slug,
      subdomain: prev.subdomain === toSlug(prev.name) ? slug : prev.subdomain,
      siteName: prev.siteName === prev.name ? value : prev.siteName,
    }));
  }

  function validate(): string | null {
    if (!form.name.trim()) return "Organization name is required.";
    if (!form.slug.trim()) return "Slug is required.";
    if (!/^[a-z0-9-]+$/.test(form.slug)) return "Slug must be lowercase letters, numbers, and hyphens only.";
    if (!form.subdomain.trim()) return "Subdomain is required.";
    if (!/^[a-z0-9-]+$/.test(form.subdomain)) return "Subdomain must be lowercase letters, numbers, and hyphens only.";
    if (!form.email.trim()) return "Organization email is required.";
    if (!form.adminName.trim()) return "Admin name is required.";
    if (!form.adminEmail.trim()) return "Admin email is required.";
    if (form.adminPassword.length < 8) return "Admin password must be at least 8 characters.";
    if (form.adminPassword !== form.confirmPassword) return "Passwords do not match.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        subdomain: form.subdomain.trim(),
        email: form.email.trim(),
        plan: form.plan,
        maxSeats: form.maxSeats,
        adminName: form.adminName.trim(),
        adminEmail: form.adminEmail.trim(),
        adminPassword: form.adminPassword,
        ...(form.industry && { industry: form.industry }),
        ...(form.siteName && { siteName: form.siteName.trim() }),
        ...(form.tagline && { tagline: form.tagline.trim() }),
        ...(form.primaryColor && { primaryColor: form.primaryColor }),
        ...(form.secondaryColor && { secondaryColor: form.secondaryColor }),
      };

      const res = await fetch("/api/superadmin/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed to create tenant");

      setSuccess({ orgId: json.data.org.id, name: form.name });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  /* ---------- Success state ---------- */
  if (success) {
    return (
      <div className="max-w-lg mx-auto py-16 px-4 text-center">
        <div className="p-4 bg-emerald-100 rounded-full w-fit mx-auto mb-4">
          <CheckCircle2 className="h-10 w-10 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Tenant Created!</h1>
        <p className="text-slate-500 text-sm mb-2">
          <span className="font-semibold text-slate-700">{success.name}</span> has been onboarded
          successfully. A welcome email has been sent to the admin.
        </p>
        <a
          href={`/t/${success.orgId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:underline mb-6 font-mono bg-indigo-50 px-3 py-1.5 rounded-lg"
        >
          /t/{success.orgId}
        </a>
        <div className="flex flex-col gap-3 max-w-xs mx-auto">
          <Button
            className="bg-indigo-600 hover:bg-indigo-700 text-white w-full"
            onClick={() => router.push(`/superadmin/tenants/${success.orgId}`)}
          >
            View Tenant
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push("/superadmin/tenants")}
          >
            Back to Tenants
          </Button>
          <Button
            variant="ghost"
            className="w-full text-indigo-600"
            onClick={() => { setSuccess(null); setForm(INITIAL); }}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Onboard Another
          </Button>
        </div>
      </div>
    );
  }

  /* ---------- Form ---------- */
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-7">
        <Link
          href="/superadmin/tenants"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Tenants
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Onboard New Tenant</h1>
        <p className="text-slate-500 text-sm mt-1">
          Fill in the details below to create a new organization and their admin account.
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6">
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Section 1: Organization ── */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <SectionHeader
            icon={Building2}
            title="Organization"
            subtitle="Basic details about the new tenant organization"
          />
          <div className="space-y-4">
            <Field label="Organization Name" required>
              <Input
                value={form.name}
                onChange={handleNameChange}
                placeholder="e.g. Acme Corporation"
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Slug" required hint="Used in URLs — auto-generated from name">
                <Input
                  value={form.slug}
                  onChange={(v) => set("slug", toSlug(v))}
                  placeholder="acme-corp"
                />
              </Field>
              <Field label="Subdomain" required hint="e.g. acme → acme.yourdomain.com">
                <Input
                  value={form.subdomain}
                  onChange={(v) => set("subdomain", toSlug(v))}
                  placeholder="acme"
                />
              </Field>
            </div>

            <Field label="Organization Email" required>
              <Input
                type="email"
                value={form.email}
                onChange={(v) => set("email", v)}
                placeholder="admin@acme.com"
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Industry">
                <select
                  value={form.industry}
                  onChange={(e) => set("industry", e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  <option value="">Select industry…</option>
                  {INDUSTRIES.map((i) => (
                    <option key={i} value={i}>{i}</option>
                  ))}
                </select>
              </Field>
              <Field label="Max Seats" hint="Number of admin/manager seats">
                <Input
                  type="number"
                  min="1"
                  max="1000"
                  value={String(form.maxSeats)}
                  onChange={(v) => set("maxSeats", Math.max(1, parseInt(v || "1", 10)))}
                />
              </Field>
            </div>

            {/* Plan selector */}
            <Field label="Plan" required>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PLANS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => set("plan", p.value)}
                    className={`flex flex-col items-start p-3 rounded-lg border-2 text-left transition-all ${
                      form.plan === p.value
                        ? p.color + " border-2"
                        : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                    }`}
                  >
                    <span className="text-xs font-bold">{p.label}</span>
                    <span className="text-[11px] mt-0.5 opacity-70">{p.description}</span>
                  </button>
                ))}
              </div>
            </Field>
          </div>
        </div>

        {/* ── Section 2: Admin Account ── */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <SectionHeader
            icon={User}
            title="Admin Account"
            subtitle="Credentials for the tenant's primary administrator"
          />
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Admin Full Name" required>
                <Input
                  value={form.adminName}
                  onChange={(v) => set("adminName", v)}
                  placeholder="Jane Smith"
                />
              </Field>
              <Field label="Admin Email" required>
                <Input
                  type="email"
                  value={form.adminEmail}
                  onChange={(v) => set("adminEmail", v)}
                  placeholder="jane@acme.com"
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Temporary Password" required hint="Admin must change on first login">
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={form.adminPassword}
                    onChange={(v) => set("adminPassword", v)}
                    placeholder="Min. 8 characters"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>
              <Field label="Confirm Password" required>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={(v) => set("confirmPassword", v)}
                  placeholder="Repeat password"
                  className={
                    form.confirmPassword && form.confirmPassword !== form.adminPassword
                      ? "border-red-300 focus:ring-red-300"
                      : ""
                  }
                />
                {form.confirmPassword && form.confirmPassword !== form.adminPassword && (
                  <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
                )}
              </Field>
            </div>
          </div>
        </div>

        {/* ── Section 3: Branding (optional) ── */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <SectionHeader
            icon={Palette}
            title="Branding"
            subtitle="Optional — customize the tenant's platform appearance"
          />
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Site Name" hint="Defaults to organization name">
                <Input
                  value={form.siteName}
                  onChange={(v) => set("siteName", v)}
                  placeholder={form.name || "Acme Hub"}
                />
              </Field>
              <Field label="Tagline" hint="Short descriptive phrase">
                <Input
                  value={form.tagline}
                  onChange={(v) => set("tagline", v)}
                  placeholder="Empowering your team"
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Primary Color">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.primaryColor}
                    onChange={(e) => set("primaryColor", e.target.value)}
                    className="h-10 w-12 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                  />
                  <Input
                    value={form.primaryColor}
                    onChange={(v) => set("primaryColor", v)}
                    placeholder="#6366f1"
                  />
                </div>
              </Field>
              <Field label="Secondary Color">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.secondaryColor}
                    onChange={(e) => set("secondaryColor", e.target.value)}
                    className="h-10 w-12 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                  />
                  <Input
                    value={form.secondaryColor}
                    onChange={(v) => set("secondaryColor", v)}
                    placeholder="#a5b4fc"
                  />
                </div>
              </Field>
            </div>
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="flex items-center justify-between pt-2 pb-8">
          <Link href="/superadmin/tenants">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={submitting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Creating…
              </>
            ) : (
              <>
                <Building2 className="h-4 w-4 mr-2" />
                Create Tenant
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
