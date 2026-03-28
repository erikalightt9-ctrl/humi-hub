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
  TRIAL:        "bg-amber-100 text-amber-700",
  STARTER:      "bg-blue-100 text-blue-700",
  PROFESSIONAL: "bg-purple-100 text-purple-700",
  ENTERPRISE:   "bg-emerald-100 text-emerald-700",
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
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-slate-500">{label}</p>
        <span className={`p-2 rounded-lg ${bg}`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </span>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
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
        <h1 className="text-2xl font-bold text-slate-900">Platform Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">Aggregate metrics across all tenants</p>
      </div>

      {/* ── Tenant Overview ── */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Tenant Overview</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Tenants"  value={analytics?.tenantCount  ?? "—"} icon={Building2}   color="text-indigo-600" bg="bg-indigo-50" />
          <StatCard label="Active Tenants" value={analytics?.activeTenants ?? "—"} icon={BarChart3}   color="text-emerald-600" bg="bg-emerald-50" />
          <StatCard label="Trial Tenants"  value={analytics?.trialTenants  ?? "—"} icon={ShieldAlert} color="text-amber-600"  bg="bg-amber-50" />
          <StatCard label="Total Students" value={analytics?.totalStudents  ?? "—"} icon={Users}      color="text-blue-600"  bg="bg-blue-50" />
        </div>
      </section>

      {/* ── Revenue KPIs ── */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Revenue</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="MRR"
            value={revenue ? formatMoney(revenue.mrrCents) : "—"}
            icon={TrendingUp}
            color="text-emerald-600"
            bg="bg-emerald-50"
            sub="Monthly Recurring Revenue"
          />
          <StatCard
            label="ARR"
            value={revenue ? formatMoney(revenue.arrCents) : "—"}
            icon={Activity}
            color="text-blue-600"
            bg="bg-blue-50"
            sub="Annualised Run Rate"
          />
          <StatCard
            label="Total Revenue"
            value={revenue ? formatMoney(revenue.totalRevenueCents) : "—"}
            icon={DollarSign}
            color="text-purple-600"
            bg="bg-purple-50"
            sub="All-time paid subs"
          />
          <StatCard
            label="Total Payments"
            value={revenue?.totalPayments ?? "—"}
            icon={CreditCard}
            color="text-slate-600"
            bg="bg-slate-100"
            sub="Paid subscriptions"
          />
        </div>
      </section>

      {/* ── Two-column: plan distribution + recent payments ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plan distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-slate-400" />
            <h2 className="font-semibold text-slate-800">Plan Distribution</h2>
          </div>

          <div className="space-y-3">
            {revenue?.planDistribution.length ? (
              revenue.planDistribution.map(({ plan, count }) => {
                const pct = totalPlanCount > 0 ? Math.round((count / totalPlanCount) * 100) : 0;
                return (
                  <div key={plan}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PLAN_BADGE[plan] ?? "bg-slate-100 text-slate-600"}`}>
                        {plan}
                      </span>
                      <span className="text-sm font-medium text-slate-700">{count} tenant{count !== 1 ? "s" : ""} · {pct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${PLAN_COLOR[plan] ?? "bg-slate-400"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">No plan data available.</p>
            )}
          </div>
        </div>

        {/* Recent payments */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-4 w-4 text-slate-400" />
            <h2 className="font-semibold text-slate-800">Recent Payments</h2>
          </div>

          {revenue?.recentPayments.length ? (
            <div className="divide-y divide-slate-50">
              {revenue.recentPayments.slice(0, 8).map((p, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${PLAN_BADGE[p.plan] ?? "bg-slate-100 text-slate-500"}`}>
                      {p.plan}
                    </span>
                    <span className="text-slate-400 text-xs">{formatDate(p.paidAt)}</span>
                  </div>
                  <span className="font-semibold text-slate-900">
                    {formatMoney(p.amountCents, p.currency)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-4">No payments recorded yet.</p>
          )}
        </div>
      </div>

      {/* ── Active courses ── */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="h-4 w-4 text-slate-400" />
          <h2 className="font-semibold text-slate-800">Active Courses (Platform-wide)</h2>
        </div>
        <p className="text-3xl font-bold text-slate-900">{analytics?.totalCourses ?? "—"}</p>
        <p className="text-sm text-slate-500 mt-1">Across all tenants</p>
      </div>
    </div>
  );
}
