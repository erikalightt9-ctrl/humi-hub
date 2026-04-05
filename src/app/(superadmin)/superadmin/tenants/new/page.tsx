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
  GraduationCap,
  Megaphone,
  ShoppingBag,
  LayoutGrid,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  INDUSTRY_LIST,
  MODULE_LIST,
  getModulesByIndustry,
  type IndustryKey,
  type ModuleKey,
} from "@/lib/modules";

/* ------------------------------------------------------------------ */
/*  Constants                                                           */
/* ------------------------------------------------------------------ */

type Plan = "TRIAL" | "STARTER" | "PROFESSIONAL" | "ENTERPRISE";

const PLANS: { value: Plan; label: string; description: string; color: string }[] = [
  { value: "TRIAL",        label: "Trial",        description: "Basic, limited seats", color: "border-amber-300 bg-amber-50 text-amber-800" },
  { value: "STARTER",      label: "Starter",      description: "+ Gamification",       color: "border-blue-300 bg-blue-50 text-blue-800" },
  { value: "PROFESSIONAL", label: "Professional", description: "+ AI + Jobs",          color: "border-purple-300 bg-purple-50 text-purple-800" },
  { value: "ENTERPRISE",   label: "Enterprise",   description: "All features",         color: "border-indigo-300 bg-indigo-50 text-indigo-800" },
];

const INDUSTRY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  GraduationCap,
  Building2,
  Megaphone,
  ShoppingBag,
  LayoutGrid,
};

const MODULE_BADGE_COLORS: Record<string, string> = {
  module_lms:        "bg-blue-100 text-blue-700 border-blue-200",
  module_hr:         "bg-violet-100 text-violet-700 border-violet-200",
  module_accounting: "bg-emerald-100 text-emerald-700 border-emerald-200",
  module_marketing:  "bg-pink-100 text-pink-700 border-pink-200",
  module_inventory:  "bg-amber-100 text-amber-700 border-amber-200",
  module_sales:      "bg-orange-100 text-orange-700 border-orange-200",
  module_it:         "bg-slate-100 text-slate-700 border-slate-200",
};

/* ------------------------------------------------------------------ */
/*  Form state                                                          */
/* ------------------------------------------------------------------ */

interface FormState {
  // Step 1 — Basics
  name: string;
  slug: string;
  subdomain: string;
  email: string;
  plan: Plan;
  maxSeats: number;
  // Step 2 — Industry + Modules
  industry: IndustryKey | "";
  modules: Record<ModuleKey, boolean>;
  // Step 3 — Admin + Branding
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  confirmPassword: string;
  siteName: string;
  tagline: string;
  primaryColor: string;
  secondaryColor: string;
}

const DEFAULT_MODULES = Object.fromEntries(
  MODULE_LIST.map((m) => [m.key, m.defaultEnabled])
) as Record<ModuleKey, boolean>;

const INITIAL: FormState = {
  name: "", slug: "", subdomain: "", email: "", plan: "TRIAL", maxSeats: 10,
  industry: "", modules: DEFAULT_MODULES,
  adminName: "", adminEmail: "", adminPassword: "", confirmPassword: "",
  siteName: "", tagline: "", primaryColor: "#6366f1", secondaryColor: "#a5b4fc",
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function toSlug(v: string) {
  return v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}
function Input({ value, onChange, placeholder, type = "text", className = "", ...rest }: InputProps) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 ${className}`}
      {...rest}
    />
  );
}

function Field({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

/* Step indicator */
function StepBar({ current, steps }: { current: number; steps: string[] }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                done ? "bg-indigo-600 text-white" : active ? "bg-indigo-600 text-white ring-4 ring-indigo-100" : "bg-slate-200 text-slate-500"
              }`}>
                {done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`text-[11px] font-medium whitespace-nowrap ${active ? "text-indigo-700" : done ? "text-slate-500" : "text-slate-400"}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mb-4 rounded ${done ? "bg-indigo-600" : "bg-slate-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

const STEPS = ["Basics", "Industry & Modules", "Admin & Branding"];

export default function NewTenantPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
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

  function handleIndustrySelect(key: IndustryKey) {
    setForm((prev) => ({
      ...prev,
      industry: key,
      modules: getModulesByIndustry(key),
    }));
  }

  function toggleModule(key: ModuleKey) {
    setForm((prev) => ({
      ...prev,
      modules: { ...prev.modules, [key]: !prev.modules[key] },
    }));
  }

  /* ---------- Validation per step ---------- */
  function validateStep(s: number): string | null {
    if (s === 0) {
      if (!form.name.trim()) return "Organization name is required.";
      if (!form.slug || !/^[a-z0-9-]+$/.test(form.slug)) return "Slug must be lowercase letters, numbers, hyphens.";
      if (!form.subdomain || !/^[a-z0-9-]+$/.test(form.subdomain)) return "Subdomain must be lowercase letters, numbers, hyphens.";
      if (!form.email.trim()) return "Email is required.";
    }
    if (s === 1) {
      if (!form.industry) return "Please select an industry.";
    }
    if (s === 2) {
      if (!form.adminName.trim()) return "Admin name is required.";
      if (!form.adminEmail.trim()) return "Admin email is required.";
      if (form.adminPassword.length < 8) return "Password must be at least 8 characters.";
      if (form.adminPassword !== form.confirmPassword) return "Passwords do not match.";
    }
    return null;
  }

  function handleNext() {
    const err = validateStep(step);
    if (err) { setError(err); return; }
    setError(null);
    setStep((s) => s + 1);
  }

  function handleBack() {
    setError(null);
    setStep((s) => s - 1);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validateStep(2);
    if (err) { setError(err); return; }
    setError(null);
    setSubmitting(true);

    try {
      const enabledModules = (Object.entries(form.modules) as [ModuleKey, boolean][])
        .filter(([, v]) => v)
        .map(([k]) => k);

      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        subdomain: form.subdomain.trim(),
        email: form.email.trim(),
        plan: form.plan,
        maxSeats: form.maxSeats,
        industry: form.industry || undefined,
        enabledModules,
        adminName: form.adminName.trim(),
        adminEmail: form.adminEmail.trim(),
        adminPassword: form.adminPassword,
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
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  /* ---------- Success ---------- */
  if (success) {
    return (
      <div className="max-w-lg mx-auto py-16 px-4 text-center">
        <div className="p-4 bg-emerald-100 rounded-full w-fit mx-auto mb-4">
          <CheckCircle2 className="h-10 w-10 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Tenant Created!</h1>
        <p className="text-slate-500 text-sm mb-3">
          <span className="font-semibold text-slate-700">{success.name}</span> is live. Welcome email sent to the admin.
        </p>
        <a
          href={`/t/${success.orgId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:underline mb-8 font-mono bg-indigo-50 px-3 py-1.5 rounded-lg"
        >
          /t/{success.orgId}
        </a>
        <div className="flex flex-col gap-3 max-w-xs mx-auto">
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white w-full" onClick={() => router.push(`/superadmin/tenants/${success.orgId}`)}>
            View Tenant
          </Button>
          <Button variant="outline" className="w-full" onClick={() => router.push("/superadmin/tenants")}>
            Back to Tenants
          </Button>
          <Button variant="ghost" className="w-full text-indigo-600" onClick={() => { setSuccess(null); setForm(INITIAL); setStep(0); }}>
            <Sparkles className="h-4 w-4 mr-2" />Onboard Another
          </Button>
        </div>
      </div>
    );
  }

  /* ---------- Wizard ---------- */
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-7">
        <Link href="/superadmin/tenants" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4">
          <ChevronLeft className="h-4 w-4" />Back to Tenants
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Onboard New Tenant</h1>
        <p className="text-slate-500 text-sm mt-1">Fill in the details to create a new organization.</p>
      </div>

      <StepBar current={step} steps={STEPS} />

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-5">
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>

        {/* ── Step 0: Basics ── */}
        {step === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-100 rounded-lg"><Building2 className="h-4 w-4 text-indigo-600" /></div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">Organization Details</h2>
                <p className="text-xs text-slate-500">Basic information about the new tenant</p>
              </div>
            </div>

            <Field label="Company Name" required>
              <Input value={form.name} onChange={handleNameChange} placeholder="e.g. Acme Corporation" />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Slug" required hint="Auto-generated from name">
                <Input value={form.slug} onChange={(v) => set("slug", toSlug(v))} placeholder="acme-corp" />
              </Field>
              <Field label="Subdomain" required hint="acme → acme.yourplatform.com">
                <Input value={form.subdomain} onChange={(v) => set("subdomain", toSlug(v))} placeholder="acme" />
              </Field>
            </div>

            <Field label="Organization Email" required>
              <Input type="email" value={form.email} onChange={(v) => set("email", v)} placeholder="admin@acme.com" />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Max Seats">
                <Input type="number" min="1" max="1000" value={String(form.maxSeats)}
                  onChange={(v) => set("maxSeats", Math.max(1, parseInt(v || "1", 10)))} />
              </Field>
              <Field label="Plan" required>
                <select
                  value={form.plan}
                  onChange={(e) => set("plan", e.target.value as Plan)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  {PLANS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label} — {p.description}</option>
                  ))}
                </select>
              </Field>
            </div>
          </div>
        )}

        {/* ── Step 1: Industry & Modules ── */}
        {step === 1 && (
          <div className="space-y-5">
            {/* Industry cards */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-indigo-100 rounded-lg"><LayoutGrid className="h-4 w-4 text-indigo-600" /></div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Select Industry</h2>
                  <p className="text-xs text-slate-500">Modules will be auto-assigned — you can adjust below</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {INDUSTRY_LIST.map((ind) => {
                  const Icon = INDUSTRY_ICONS[ind.iconName] ?? LayoutGrid;
                  const selected = form.industry === ind.key;
                  return (
                    <button
                      key={ind.key}
                      type="button"
                      onClick={() => handleIndustrySelect(ind.key as IndustryKey)}
                      className={`flex flex-col items-start gap-2 p-4 rounded-xl border-2 text-left transition-all ${
                        selected
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${selected ? "bg-indigo-100" : "bg-slate-100"}`}>
                        <Icon className={`h-4 w-4 ${selected ? "text-indigo-600" : "text-slate-500"}`} />
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${selected ? "text-indigo-900" : "text-slate-800"}`}>
                          {ind.label}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 leading-snug">{ind.description}</p>
                      </div>
                      {selected && (
                        <CheckCircle2 className="h-4 w-4 text-indigo-600 self-end mt-auto" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Module toggles */}
            {form.industry && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Auto-Assigned Modules</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Toggle to override the preset</p>
                  </div>
                  <span className="text-xs text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full font-medium">
                    {Object.values(form.modules).filter(Boolean).length} enabled
                  </span>
                </div>

                <div className="space-y-2">
                  {MODULE_LIST.map((mod) => {
                    const enabled = form.modules[mod.key as ModuleKey];
                    return (
                      <div
                        key={mod.key}
                        onClick={() => toggleModule(mod.key as ModuleKey)}
                        className={`flex items-center justify-between px-4 py-3 rounded-lg border cursor-pointer transition-all ${
                          enabled ? "border-indigo-200 bg-indigo-50" : "border-slate-100 bg-slate-50 opacity-60"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${MODULE_BADGE_COLORS[mod.key]}`}>
                            {mod.label}
                          </span>
                          <p className="text-xs text-slate-500 hidden sm:block">{mod.description.split("—")[1]?.trim() ?? mod.description}</p>
                        </div>
                        <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${enabled ? "bg-indigo-600" : "bg-slate-300"}`}>
                          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-4" : "translate-x-0.5"}`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Step 2: Admin + Branding ── */}
        {step === 2 && (
          <div className="space-y-5">
            {/* Admin account */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-indigo-100 rounded-lg"><User className="h-4 w-4 text-indigo-600" /></div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Admin Account</h2>
                  <p className="text-xs text-slate-500">Credentials for the tenant's primary admin</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Admin Full Name" required>
                    <Input value={form.adminName} onChange={(v) => set("adminName", v)} placeholder="Jane Smith" />
                  </Field>
                  <Field label="Admin Email" required>
                    <Input type="email" value={form.adminEmail} onChange={(v) => set("adminEmail", v)} placeholder="jane@acme.com" />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Temporary Password" required hint="Admin must change on first login">
                    <div className="relative">
                      <Input type={showPassword ? "text" : "password"} value={form.adminPassword}
                        onChange={(v) => set("adminPassword", v)} placeholder="Min. 8 characters" className="pr-10" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </Field>
                  <Field label="Confirm Password" required>
                    <Input type={showPassword ? "text" : "password"} value={form.confirmPassword}
                      onChange={(v) => set("confirmPassword", v)} placeholder="Repeat password"
                      className={form.confirmPassword && form.confirmPassword !== form.adminPassword ? "border-red-300" : ""} />
                    {form.confirmPassword && form.confirmPassword !== form.adminPassword && (
                      <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
                    )}
                  </Field>
                </div>
              </div>
            </div>

            {/* Branding */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-indigo-100 rounded-lg"><Palette className="h-4 w-4 text-indigo-600" /></div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Branding <span className="text-slate-400 font-normal text-xs">(optional)</span></h2>
                  <p className="text-xs text-slate-500">Customize the tenant's platform appearance</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Site Name" hint="Defaults to org name">
                    <Input value={form.siteName} onChange={(v) => set("siteName", v)} placeholder={form.name || "Acme Hub"} />
                  </Field>
                  <Field label="Tagline">
                    <Input value={form.tagline} onChange={(v) => set("tagline", v)} placeholder="Empowering your team" />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Primary Color">
                    <div className="flex items-center gap-2">
                      <input type="color" value={form.primaryColor} onChange={(e) => set("primaryColor", e.target.value)}
                        className="h-10 w-12 rounded-lg border border-slate-200 cursor-pointer p-0.5" />
                      <Input value={form.primaryColor} onChange={(v) => set("primaryColor", v)} placeholder="#6366f1" />
                    </div>
                  </Field>
                  <Field label="Secondary Color">
                    <div className="flex items-center gap-2">
                      <input type="color" value={form.secondaryColor} onChange={(e) => set("secondaryColor", e.target.value)}
                        className="h-10 w-12 rounded-lg border border-slate-200 cursor-pointer p-0.5" />
                      <Input value={form.secondaryColor} onChange={(v) => set("secondaryColor", v)} placeholder="#a5b4fc" />
                    </div>
                  </Field>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Navigation ── */}
        <div className="flex items-center justify-between mt-6 pb-10">
          {step === 0 ? (
            <Link href="/superadmin/tenants">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
          ) : (
            <Button type="button" variant="outline" onClick={handleBack}>
              <ChevronLeft className="h-4 w-4 mr-1" />Back
            </Button>
          )}

          {step < STEPS.length - 1 ? (
            <Button type="button" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6" onClick={handleNext}>
              Next<ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button type="submit" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8">
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Creating…</> : <><Building2 className="h-4 w-4 mr-2" />Create Tenant</>}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
