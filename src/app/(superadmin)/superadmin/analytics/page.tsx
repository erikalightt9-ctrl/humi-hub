import { getPlatformAnalytics, getRevenueAnalytics } from "@/lib/repositories/superadmin.repository";
import {
  BarChart3,
  Building2,
  Users,
  BookOpen,
  ShieldAlert,
  DollarSign,
  TrendingUp,
  CreditCard,
  Activity,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatMoney(cents: number, currency = "PHP") {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency, maximumFractionDigits: 0 }).format(
    cents / 100
  );
}

function formatDate(iso: string | Date | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const PLAN_BADGE: Record<string, string> = {
  TRIAL:        "bg-amber-900/40 text-amber-400",
  STARTER:      "bg-blue-900/40 text-blue-400",
  PROFESSIONAL: "bg-purple-900/40 text-purple-400",
  ENTERPRISE:   "bg-emerald-900/40 text-emerald-400",
};

const PLAN_COLOR: Record<string, string> = {
  TRIAL:        "bg-amber-400",
  STARTER:      "bg-blue-400",
  PROFESSIONAL: "bg-purple-400",
  ENTERPRISE:   "bg-emerald-500",
};

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  sub?: string;
}) {
  return (
    <div className="bg-ds-card rounded-xl border border-ds-border p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-ds-muted">{label}</p>
        <span className={`p-2 rounded-lg ${bg}`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </span>
      </div>
      <p className="text-2xl font-bold text-ds-text">{value}</p>
      {sub && <p className="text-xs text-ds-muted mt-0.5">{sub}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function SuperAdminAnalyticsPage() {
  const [analytics, revenue] = await Promise.all([
    getPlatformAnalytics().catch(() => null),
    getRevenueAnalytics().catch(() => null),
  ]);

  const totalPlanCount = revenue?.planDistribution.reduce((s, p) => s + p.count, 0) ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-ds-text">Platform Analytics</h1>
        <p className="text-sm text-ds-muted mt-1">Aggregate metrics across all tenants</p>
      </div>

      {/* ── Tenant Overview ── */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-ds-muted uppercase tracking-wide">Tenant Overview</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Tenants"  value={analytics?.tenantCount  ?? "—"} icon={Building2}   color="text-violet-400" bg="bg-violet-900/40" />
          <StatCard label="Active Tenants" value={analytics?.activeTenants ?? "—"} icon={BarChart3}   color="text-emerald-400" bg="bg-emerald-900/40" />
          <StatCard label="Trial Tenants"  value={analytics?.trialTenants  ?? "—"} icon={ShieldAlert} color="text-amber-400"  bg="bg-amber-900/40" />
          <StatCard label="Total Students" value={analytics?.totalStudents  ?? "—"} icon={Users}      color="text-blue-400"  bg="bg-blue-900/40" />
        </div>
      </section>

      {/* ── Revenue KPIs ── */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-ds-muted uppercase tracking-wide">Revenue</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="MRR"
            value={revenue ? formatMoney(revenue.mrrCents) : "—"}
            icon={TrendingUp}
            color="text-emerald-400"
            bg="bg-emerald-900/40"
            sub="Monthly Recurring Revenue"
          />
          <StatCard
            label="ARR"
            value={revenue ? formatMoney(revenue.arrCents) : "—"}
            icon={Activity}
            color="text-blue-400"
            bg="bg-blue-900/40"
            sub="Annualised Run Rate"
          />
          <StatCard
            label="Total Revenue"
            value={revenue ? formatMoney(revenue.totalRevenueCents) : "—"}
            icon={DollarSign}
            color="text-violet-400"
            bg="bg-violet-900/40"
            sub="All-time paid subs"
          />
          <StatCard
            label="Total Payments"
            value={revenue?.totalPayments ?? "—"}
            icon={CreditCard}
            color="text-ds-muted"
            bg="bg-ds-surface"
            sub="Paid subscriptions"
          />
        </div>
      </section>

      {/* ── Two-column: plan distribution + recent payments ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plan distribution */}
        <div className="bg-ds-card rounded-xl border border-ds-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-ds-muted" />
            <h2 className="font-semibold text-ds-text">Plan Distribution</h2>
          </div>

          <div className="space-y-3">
            {revenue?.planDistribution.length ? (
              revenue.planDistribution.map(({ plan, count }) => {
                const pct = totalPlanCount > 0 ? Math.round((count / totalPlanCount) * 100) : 0;
                return (
                  <div key={plan}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PLAN_BADGE[plan] ?? "bg-ds-surface text-ds-muted"}`}>
                        {plan}
                      </span>
                      <span className="text-sm font-medium text-ds-text">{count} tenant{count !== 1 ? "s" : ""} · {pct}%</span>
                    </div>
                    <div className="w-full bg-ds-surface rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${PLAN_COLOR[plan] ?? "bg-ds-muted"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-ds-muted text-center py-4">No plan data available.</p>
            )}
          </div>
        </div>

        {/* Recent payments */}
        <div className="bg-ds-card rounded-xl border border-ds-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-4 w-4 text-ds-muted" />
            <h2 className="font-semibold text-ds-text">Recent Payments</h2>
          </div>

          {revenue?.recentPayments.length ? (
            <div className="divide-y divide-ds-border">
              {revenue.recentPayments.slice(0, 8).map((p, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${PLAN_BADGE[p.plan] ?? "bg-ds-surface text-ds-muted"}`}>
                      {p.plan}
                    </span>
                    <span className="text-ds-muted text-xs">{formatDate(p.paidAt)}</span>
                  </div>
                  <span className="font-semibold text-ds-text">
                    {formatMoney(p.amountCents, p.currency)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ds-muted text-center py-4">No payments recorded yet.</p>
          )}
        </div>
      </div>

      {/* ── Active courses ── */}
      <div className="bg-ds-card rounded-xl border border-ds-border p-6">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="h-4 w-4 text-ds-muted" />
          <h2 className="font-semibold text-ds-text">Active Courses (Platform-wide)</h2>
        </div>
        <p className="text-3xl font-bold text-ds-text">{analytics?.totalCourses ?? "—"}</p>
        <p className="text-sm text-ds-muted mt-1">Across all tenants</p>
      </div>
    </div>
  );
}
