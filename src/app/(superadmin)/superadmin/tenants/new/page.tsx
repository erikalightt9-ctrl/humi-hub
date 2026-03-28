"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  User,
  Palette,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const PLAN_OPTIONS = [
  { value: "TRIAL", label: "Trial (free)", color: "text-amber-600" },
  { value: "STARTER", label: "Starter", color: "text-blue-600" },
  { value: "PROFESSIONAL", label: "Professional", color: "text-purple-600" },
  { value: "ENTERPRISE", label: "Enterprise", color: "text-emerald-600" },
] as const;

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
        <Icon className="h-4 w-4 text-slate-400" />
        <h2 className="font-semibold text-slate-800">{title}</h2>
      </div>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Field wrapper
// ---------------------------------------------------------------------------

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-slate-700">{label}</Label>
      {children}
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function NewTenantPage() {
  const router = useRouter();

  // Org info
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [email, setEmail] = useState("");
  const [industry, setIndustry] = useState("");
  // Plan
  const [plan, setPlan] = useState<"TRIAL" | "STARTER" | "PROFESSIONAL" | "ENTERPRISE">("TRIAL");
  const [maxSeats, setMaxSeats] = useState("10");
  // Branding
  const [siteName, setSiteName] = useState("");
  const [tagline, setTagline] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#1d4ed8");
  const [secondaryColor, setSecondaryColor] = useState("#93c5fd");
  // Admin account
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  // UI state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ orgName: string } | null>(null);

  function handleNameChange(value: string) {
    setName(value);
    const derived = slugify(value);
    // Only auto-fill slug/subdomain if user hasn't manually edited them
    if (!slug || slug === slugify(name)) setSlug(derived);
    if (!subdomain || subdomain === slugify(name)) setSubdomain(derived);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (adminPassword !== confirmPassword) {
      setError("Admin passwords do not match.");
      return;
    }
    if (adminPassword.length < 8) {
      setError("Admin password must be at least 8 characters.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/superadmin/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          subdomain: subdomain.trim(),
          email: email.trim(),
          industry: industry.trim() || undefined,
          plan,
          maxSeats: parseInt(maxSeats, 10) || 10,
          siteName: siteName.trim() || undefined,
          tagline: tagline.trim() || undefined,
          primaryColor: primaryColor || undefined,
          secondaryColor: secondaryColor || undefined,
          adminName: adminName.trim(),
          adminEmail: adminEmail.trim(),
          adminPassword,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Failed to create tenant.");
        return;
      }

      setSuccess({ orgName: name.trim() });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // ── Success state ──
  if (success) {
    return (
      <div className="max-w-xl mx-auto text-center space-y-6 pt-12">
        <div className="bg-emerald-50 border border-emerald-200 rounded-full w-20 h-20 flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tenant Created!</h1>
          <p className="text-slate-500 mt-2">
            <strong>{success.orgName}</strong> is now live. The tenant admin will receive a
            welcome email with login credentials.
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" asChild>
            <Link href="/superadmin/tenants/new">Create Another</Link>
          </Button>
          <Button asChild>
            <Link href="/superadmin/tenants">Back to Tenants</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/superadmin/tenants" className="text-slate-400 hover:text-slate-700 transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">New Tenant</h1>
          <p className="text-sm text-slate-500 mt-0.5">Create a new training organization on the platform.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ── Section 1: Organization Info ── */}
        <Section icon={Building2} title="Organization Info">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Organization Name *" hint="Display name for the tenant">
              <Input
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Medical VA Training"
                required
                maxLength={100}
              />
            </Field>
            <Field label="Industry">
              <Input
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="Healthcare, BPO, Education…"
                maxLength={100}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Slug *" hint="URL-safe identifier (auto-filled)">
              <Input
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
                placeholder="medical-va-training"
                required
                pattern="[a-z0-9-]+"
                maxLength={50}
              />
            </Field>
            <Field label="Subdomain *" hint="e.g. clinic → clinic.platform.com">
              <Input
                value={subdomain}
                onChange={(e) => setSubdomain(slugify(e.target.value))}
                placeholder="clinic"
                required
                pattern="[a-z0-9-]+"
                maxLength={50}
              />
            </Field>
          </div>

          <Field label="Billing Email *" hint="Contact email for this organization">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@clinic.com"
              required
            />
          </Field>
        </Section>

        {/* ── Section 2: Plan & Seats ── */}
        <Section icon={CreditCard} title="Plan & Seats">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Plan">
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value as typeof plan)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {PLAN_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Max Seats" hint="Maximum student accounts allowed">
              <Input
                type="number"
                value={maxSeats}
                onChange={(e) => setMaxSeats(e.target.value)}
                min={1}
                max={10000}
                placeholder="10"
              />
            </Field>
          </div>
        </Section>

        {/* ── Section 3: Branding (optional) ── */}
        <Section icon={Palette} title="Branding (optional)">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Site Name" hint="Used in browser tabs and emails">
              <Input
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                placeholder="Clinic Training Hub"
                maxLength={100}
              />
            </Field>
            <Field label="Tagline">
              <Input
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Empowering Healthcare VAs"
                maxLength={200}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Primary Color">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-9 w-12 rounded border border-input cursor-pointer"
                />
                <Input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#1d4ed8"
                  maxLength={7}
                />
              </div>
            </Field>
            <Field label="Secondary Color">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="h-9 w-12 rounded border border-input cursor-pointer"
                />
                <Input
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  placeholder="#93c5fd"
                  maxLength={7}
                />
              </div>
            </Field>
          </div>
        </Section>

        {/* ── Section 4: Admin Account ── */}
        <Section icon={User} title="Tenant Admin Account">
          <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
            This creates the first admin user for the tenant. They will receive a welcome email with
            login credentials and be prompted to change their password on first login.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Admin Full Name *">
              <Input
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="Jane Doe"
                required
                maxLength={100}
              />
            </Field>
            <Field label="Admin Email *">
              <Input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="jane@clinic.com"
                required
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Temporary Password *" hint="Min 8 characters">
              <Input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
              />
            </Field>
            <Field label="Confirm Password *">
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                className={cn(
                  confirmPassword && confirmPassword !== adminPassword
                    ? "border-red-400 focus-visible:ring-red-400"
                    : ""
                )}
              />
            </Field>
          </div>
        </Section>

        {/* Error banner */}
        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" asChild>
            <Link href="/superadmin/tenants">Cancel</Link>
          </Button>
          <Button type="submit" disabled={saving} className="gap-2">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating…
              </>
            ) : (
              <>
                <Building2 className="h-4 w-4" />
                Create Tenant
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
