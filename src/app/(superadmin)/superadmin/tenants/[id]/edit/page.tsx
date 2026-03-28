"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Palette,
  CreditCard,
  Globe,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PLAN_OPTIONS = [
  { value: "TRIAL",        label: "Trial (free)" },
  { value: "STARTER",      label: "Starter" },
  { value: "PROFESSIONAL", label: "Professional" },
  { value: "ENTERPRISE",   label: "Enterprise" },
] as const;

type TenantPlan = "TRIAL" | "STARTER" | "PROFESSIONAL" | "ENTERPRISE";

interface TenantData {
  id: string;
  name: string;
  slug: string;
  subdomain: string | null;
  customDomain: string | null;
  email: string;
  billingEmail: string | null;
  industry: string | null;
  plan: TenantPlan;
  planExpiresAt: string | null;
  maxSeats: number;
  isActive: boolean;
  isDefault: boolean;
  siteName: string | null;
  tagline: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  bannerImageUrl: string | null;
  mission: string | null;
  vision: string | null;
}

// ---------------------------------------------------------------------------
// Section / Field helpers (same as new page)
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
    <div className="bg-ds-card border border-ds-border rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-ds-border">
        <Icon className="h-4 w-4 text-ds-muted" />
        <h2 className="font-semibold text-ds-text">{title}</h2>
      </div>
      {children}
    </div>
  );
}

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
      <Label className="text-ds-text">{label}</Label>
      {children}
      {hint && <p className="text-xs text-ds-muted">{hint}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function EditTenantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [tenant, setTenant] = useState<TenantData | null>(null);

  // Form state (mirrors TenantData fields)
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [industry, setIndustry] = useState("");
  const [plan, setPlan] = useState<TenantPlan>("TRIAL");
  const [planExpiresAt, setPlanExpiresAt] = useState("");
  const [maxSeats, setMaxSeats] = useState("10");
  const [isActive, setIsActive] = useState(true);
  const [siteName, setSiteName] = useState("");
  const [tagline, setTagline] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#1d4ed8");
  const [secondaryColor, setSecondaryColor] = useState("#93c5fd");
  const [logoUrl, setLogoUrl] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");
  const [bannerImageUrl, setBannerImageUrl] = useState("");
  const [mission, setMission] = useState("");
  const [vision, setVision] = useState("");

  useEffect(() => {
    fetch(`/api/superadmin/tenants/${id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          const t: TenantData = json.data;
          setTenant(t);
          setName(t.name);
          setEmail(t.email);
          setBillingEmail(t.billingEmail ?? "");
          setSubdomain(t.subdomain ?? "");
          setCustomDomain(t.customDomain ?? "");
          setIndustry(t.industry ?? "");
          setPlan(t.plan);
          setPlanExpiresAt(
            t.planExpiresAt ? new Date(t.planExpiresAt).toISOString().slice(0, 10) : ""
          );
          setMaxSeats(String(t.maxSeats));
          setIsActive(t.isActive);
          setSiteName(t.siteName ?? "");
          setTagline(t.tagline ?? "");
          setPrimaryColor(t.primaryColor ?? "#1d4ed8");
          setSecondaryColor(t.secondaryColor ?? "#93c5fd");
          setLogoUrl(t.logoUrl ?? "");
          setFaviconUrl(t.faviconUrl ?? "");
          setBannerImageUrl(t.bannerImageUrl ?? "");
          setMission(t.mission ?? "");
          setVision(t.vision ?? "");
        } else {
          setError("Tenant not found.");
        }
      })
      .catch(() => setError("Failed to load tenant."))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    const payload: Record<string, unknown> = {
      name: name.trim(),
      email: email.trim(),
      billingEmail: billingEmail.trim() || null,
      subdomain: subdomain.trim() || undefined,
      customDomain: customDomain.trim() || null,
      industry: industry.trim() || null,
      plan,
      planExpiresAt: planExpiresAt
        ? new Date(planExpiresAt).toISOString()
        : null,
      maxSeats: parseInt(maxSeats, 10) || 10,
      isActive,
      siteName: siteName.trim() || null,
      tagline: tagline.trim() || null,
      primaryColor: primaryColor || null,
      secondaryColor: secondaryColor || null,
      logoUrl: logoUrl.trim() || null,
      faviconUrl: faviconUrl.trim() || null,
      bannerImageUrl: bannerImageUrl.trim() || null,
      mission: mission.trim() || null,
      vision: vision.trim() || null,
    };

    try {
      const res = await fetch(`/api/superadmin/tenants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Failed to save changes.");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="text-center py-20 text-ds-muted">
        <Building2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
        <p>Tenant not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/superadmin/tenants/${id}`}
          className="text-ds-muted hover:text-ds-text transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-ds-text">Edit Tenant</h1>
          <p className="text-sm text-ds-muted mt-0.5">{tenant.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ── Section 1: Core Info ── */}
        <Section icon={Building2} title="Organization Info">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Organization Name *">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={100}
              />
            </Field>
            <Field label="Industry">
              <Input
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="Healthcare, BPO…"
                maxLength={100}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Contact Email *">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field>
            <Field label="Billing Email">
              <Input
                type="email"
                value={billingEmail}
                onChange={(e) => setBillingEmail(e.target.value)}
                placeholder="billing@company.com"
              />
            </Field>
          </div>

          <div className="text-xs text-ds-muted bg-ds-surface rounded px-3 py-2">
            <strong>Slug:</strong> {tenant.slug} &nbsp;·&nbsp;
            <strong>ID:</strong> {tenant.id}
          </div>
        </Section>

        {/* ── Section 2: Routing ── */}
        <Section icon={Globe} title="Routing">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Subdomain" hint="e.g. clinic → clinic.platform.com">
              <Input
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value)}
                placeholder="clinic"
                pattern="[a-z0-9-]*"
                maxLength={50}
              />
            </Field>
            <Field label="Custom Domain" hint="e.g. lms.clinic.com (leave blank to disable)">
              <Input
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                placeholder="lms.clinic.com"
              />
            </Field>
          </div>
        </Section>

        {/* ── Section 3: Plan & Seats ── */}
        <Section icon={CreditCard} title="Plan & Seats">
          <div className="grid grid-cols-3 gap-4">
            <Field label="Plan">
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value as TenantPlan)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {PLAN_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Plan Expires" hint="Leave blank = no expiry">
              <Input
                type="date"
                value={planExpiresAt}
                onChange={(e) => setPlanExpiresAt(e.target.value)}
              />
            </Field>
            <Field label="Max Seats">
              <Input
                type="number"
                value={maxSeats}
                onChange={(e) => setMaxSeats(e.target.value)}
                min={1}
                max={10000}
              />
            </Field>
          </div>
        </Section>

        {/* ── Section 4: Status ── */}
        <Section icon={ShieldAlert} title="Account Status">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-ds-text">Tenant Active</p>
              <p className="text-xs text-ds-muted mt-0.5">
                Inactive tenants cannot log in and are hidden from directories.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isActive}
              onClick={() => setIsActive((prev) => !prev)}
              disabled={tenant.isDefault}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${isActive ? "bg-emerald-500" : "bg-slate-300"}`}
            >
              <span
                className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${isActive ? "translate-x-5" : "translate-x-0"}`}
              />
            </button>
          </div>
          {tenant.isDefault && (
            <p className="text-xs text-amber-400 bg-amber-900/20 border border-amber-800 rounded px-3 py-2">
              This is the default (platform owner) tenant and cannot be deactivated.
            </p>
          )}
        </Section>

        {/* ── Section 5: Branding ── */}
        <Section icon={Palette} title="Branding">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Site Name" hint="Shown in browser tab">
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
                  maxLength={7}
                />
              </div>
            </Field>
          </div>

          <Field label="Logo URL" hint="Direct image URL for the organization logo">
            <Input
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://cdn.example.com/logo.png"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Favicon URL">
              <Input
                type="url"
                value={faviconUrl}
                onChange={(e) => setFaviconUrl(e.target.value)}
                placeholder="https://cdn.example.com/favicon.ico"
              />
            </Field>
            <Field label="Banner Image URL">
              <Input
                type="url"
                value={bannerImageUrl}
                onChange={(e) => setBannerImageUrl(e.target.value)}
                placeholder="https://cdn.example.com/banner.jpg"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Mission Statement">
              <Textarea
                value={mission}
                onChange={(e) => setMission(e.target.value)}
                placeholder="Our mission is…"
                rows={3}
                maxLength={1000}
              />
            </Field>
            <Field label="Vision Statement">
              <Textarea
                value={vision}
                onChange={(e) => setVision(e.target.value)}
                placeholder="Our vision is…"
                rows={3}
                maxLength={1000}
              />
            </Field>
          </div>
        </Section>

        {/* Feedback banners */}
        {error && (
          <div className="flex items-start gap-2 bg-red-900/20 border border-red-800 text-red-400 text-sm rounded-xl px-4 py-3">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}
        {saved && (
          <div className="flex items-center gap-2 bg-emerald-900/20 border border-emerald-800 text-emerald-400 text-sm rounded-xl px-4 py-3">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Changes saved successfully.
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between pt-2">
          <Button variant="outline" asChild>
            <Link href={`/superadmin/tenants/${id}`}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={saving} className="gap-2">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
