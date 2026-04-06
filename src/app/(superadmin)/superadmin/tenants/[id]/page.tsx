import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Users,
  BookOpen,
  UserCog,
  Crown,
  Pencil,
  CreditCard,
  CheckCircle2,
  XCircle,
  Briefcase,
  HeartPulse,
  ShoppingCart,
  Monitor,
  TrendingUp,
  Layers,
  ClipboardList,
  FileText,
  BarChart3,
} from "lucide-react";
import { getTenantById } from "@/lib/repositories/superadmin.repository";
import { Button } from "@/components/ui/button";

/** Returns the 4 stat cards appropriate for a given industry. */
function getIndustryStats(
  industry: string | null | undefined,
  counts: { students: number; courses: number; managers: number; enrollments: number },
) {
  const ind = (industry ?? "").toUpperCase();

  if (ind.includes("TRAINING") || ind.includes("LMS") || ind.includes("EDUCATION")) {
    return [
      { label: "Students",    value: counts.students,    icon: Users },
      { label: "Courses",     value: counts.courses,     icon: BookOpen },
      { label: "Managers",    value: counts.managers,    icon: UserCog },
      { label: "Enrollments", value: counts.enrollments, icon: ClipboardList },
    ];
  }
  if (ind.includes("HEALTH") || ind.includes("MEDICAL") || ind.includes("CLINIC")) {
    return [
      { label: "Staff",        value: counts.students,    icon: HeartPulse },
      { label: "Departments",  value: counts.courses,     icon: Layers },
      { label: "Managers",     value: counts.managers,    icon: UserCog },
      { label: "Appointments", value: counts.enrollments, icon: ClipboardList },
    ];
  }
  if (ind.includes("RETAIL") || ind.includes("SALES") || ind.includes("DISTRIBUTION")) {
    return [
      { label: "Staff",    value: counts.students,    icon: Users },
      { label: "Products", value: counts.courses,     icon: ShoppingCart },
      { label: "Managers", value: counts.managers,    icon: UserCog },
      { label: "Orders",   value: counts.enrollments, icon: BarChart3 },
    ];
  }
  if (ind.includes("IT") || ind.includes("TECH") || ind.includes("SOFTWARE")) {
    return [
      { label: "Staff",    value: counts.students,    icon: Monitor },
      { label: "Projects", value: counts.courses,     icon: FileText },
      { label: "Managers", value: counts.managers,    icon: UserCog },
      { label: "Tickets",  value: counts.enrollments, icon: ClipboardList },
    ];
  }
  if (ind.includes("CONSULT")) {
    return [
      { label: "Clients",      value: counts.students,    icon: Briefcase },
      { label: "Projects",     value: counts.courses,     icon: FileText },
      { label: "Managers",     value: counts.managers,    icon: UserCog },
      { label: "Engagements",  value: counts.enrollments, icon: TrendingUp },
    ];
  }
  if (ind.includes("FINANCE") || ind.includes("ACCOUNTING") || ind.includes("BANK")) {
    return [
      { label: "Staff",     value: counts.students,    icon: Users },
      { label: "Accounts",  value: counts.courses,     icon: BarChart3 },
      { label: "Managers",  value: counts.managers,    icon: UserCog },
      { label: "Reports",   value: counts.enrollments, icon: FileText },
    ];
  }
  // Default / Holding / General
  return [
    { label: "Staff",      value: counts.students,    icon: Users },
    { label: "Departments",value: counts.courses,     icon: Building2 },
    { label: "Managers",   value: counts.managers,    icon: UserCog },
    { label: "Activities", value: counts.enrollments, icon: Layers },
  ];
}

const PLAN_BADGE: Record<string, string> = {
  TRIAL:        "bg-amber-50 text-amber-700",
  STARTER:      "bg-blue-50 text-blue-700",
  PROFESSIONAL: "bg-blue-50 text-blue-700",
  ENTERPRISE:   "bg-emerald-50 text-emerald-700",
};

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tenant = await getTenantById(id).catch(() => null);
  if (!tenant) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/superadmin/tenants" className="text-ds-muted hover:text-ds-text">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-ds-text flex items-center gap-2">
              {tenant.name}
              {tenant.isDefault && (
                <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-300 px-1.5 py-0.5 rounded-full font-medium">
                  <Crown className="h-3 w-3" />
                  Default Tenant
                </span>
              )}
              {tenant.isActive ? (
                <span className="flex items-center gap-1 text-xs text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Active
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-red-700">
                  <XCircle className="h-3.5 w-3.5" /> Suspended
                </span>
              )}
            </h1>
            <p className="text-sm text-ds-muted">{tenant.email}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" asChild className="gap-1.5">
            <Link href={`/superadmin/tenants/${id}/subscriptions`}>
              <CreditCard className="h-4 w-4" />
              Subscriptions
            </Link>
          </Button>

          <Button size="sm" asChild className="gap-1.5">
            <Link href={`/superadmin/tenants/${id}/edit`}>
              <Pencil className="h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      {/* ── Stats — labels adapt to tenant industry ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {getIndustryStats(tenant.industry, tenant._count).map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-ds-card border border-ds-border rounded-xl p-4 text-center">
            <Icon className="h-4 w-4 text-ds-muted mx-auto mb-1" />
            <p className="text-xl font-bold text-ds-text">{value}</p>
            <p className="text-xs text-ds-muted">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Details ── */}
      <div className="bg-ds-card border border-ds-border rounded-xl p-5 space-y-3">
        <h2 className="font-semibold text-ds-text mb-2">Tenant Details</h2>
        {[
          { label: "Slug",          value: tenant.slug },
          { label: "Subdomain",     value: tenant.subdomain ?? "—" },
          { label: "Custom Domain", value: tenant.customDomain ?? "—" },
          { label: "Industry",      value: tenant.industry ?? "—" },
          { label: "Max Seats",     value: tenant.maxSeats },
          { label: "Billing Email", value: tenant.billingEmail ?? "—" },
          {
            label: "Plan",
            value: (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PLAN_BADGE[tenant.plan] ?? "bg-slate-50 text-ds-muted"}`}>
                {tenant.plan}
              </span>
            ),
          },
          {
            label: "Plan Expires",
            value: tenant.planExpiresAt
              ? new Date(tenant.planExpiresAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
              : "—",
          },
          {
            label: "Created",
            value: new Date(tenant.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
          },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between text-sm border-b border-ds-border pb-2 last:border-0 last:pb-0">
            <span className="text-ds-muted">{label}</span>
            <span className="text-ds-text font-medium">{value}</span>
          </div>
        ))}
      </div>

      {/* ── Branding preview ── */}
      {(tenant.primaryColor || tenant.siteName || tenant.logoUrl) && (
        <div className="bg-ds-card border border-ds-border rounded-xl p-5 space-y-3">
          <h2 className="font-semibold text-ds-text mb-2">Branding</h2>
          <div className="flex flex-wrap gap-4 text-sm">
            {tenant.siteName && (
              <div>
                <p className="text-xs text-ds-muted">Site Name</p>
                <p className="text-ds-text font-medium">{tenant.siteName}</p>
              </div>
            )}
            {tenant.tagline && (
              <div>
                <p className="text-xs text-ds-muted">Tagline</p>
                <p className="text-ds-text font-medium">{tenant.tagline}</p>
              </div>
            )}
            {tenant.primaryColor && (
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full border border-ds-border"
                  style={{ backgroundColor: tenant.primaryColor }}
                />
                <div>
                  <p className="text-xs text-ds-muted">Primary</p>
                  <p className="text-ds-text font-mono text-xs">{tenant.primaryColor}</p>
                </div>
              </div>
            )}
            {tenant.secondaryColor && (
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full border border-ds-border"
                  style={{ backgroundColor: tenant.secondaryColor }}
                />
                <div>
                  <p className="text-xs text-ds-muted">Secondary</p>
                  <p className="text-ds-text font-mono text-xs">{tenant.secondaryColor}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <p className="text-xs text-ds-muted italic">
        Tenant workspace data is not accessible from the Super Admin portal to protect data privacy.
      </p>
    </div>
  );
}
