import { CreditCard, TrendingUp, Clock, Activity } from "lucide-react";
import { prisma } from "@/lib/prisma";

type SubscriptionRow = {
  id: string;
  tenantId: string;
  plan: string;
  status: string;
  amountCents: number;
  currency: string;
  periodStart: Date;
  periodEnd: Date;
  paymentMethod: string | null;
  paidAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  tenant: { name: string; slug: string };
};

const STATUS_BADGE: Record<string, string> = {
  ACTIVE:    "bg-emerald-50 text-emerald-700 border border-emerald-200",
  PENDING:   "bg-amber-50 text-amber-700 border border-amber-200",
  EXPIRED:   "bg-slate-100 text-slate-500 border border-slate-200",
  CANCELLED: "bg-red-50 text-red-600 border border-red-200",
};

const PLAN_BADGE: Record<string, string> = {
  TRIAL:        "bg-amber-50 text-amber-700 border border-amber-200",
  STARTER:      "bg-blue-50 text-blue-700 border border-blue-200",
  PROFESSIONAL: "bg-blue-50 text-blue-700 border border-blue-200",
  ENTERPRISE:   "bg-emerald-50 text-emerald-700 border border-emerald-200",
};

function formatMoney(cents: number, currency = "PHP") {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatDate(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

async function getSubscriptionsData(): Promise<{
  subscriptions: SubscriptionRow[];
  activeCount: number;
  mrrCents: number;
  trialCount: number;
  expiringSoon: number;
}> {
  const now = new Date();
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [subscriptions, activeCount, trialCount, expiringSoon] = await Promise.all([
    prisma.tenantSubscription.findMany({
      include: { tenant: { select: { name: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.tenantSubscription.count({ where: { status: "ACTIVE" } }),
    prisma.tenantSubscription.count({ where: { plan: "TRIAL", status: "ACTIVE" } }),
    prisma.tenantSubscription.count({
      where: {
        status: "ACTIVE",
        periodEnd: { gte: now, lte: thirtyDaysLater },
      },
    }),
  ]);

  const activeSubs = await prisma.tenantSubscription.findMany({
    where: { status: "ACTIVE" },
    select: { amountCents: true, periodStart: true, periodEnd: true },
  });

  const mrrCents = activeSubs.reduce((sum, sub) => {
    const days = Math.max(
      1,
      (new Date(sub.periodEnd).getTime() - new Date(sub.periodStart).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    return sum + Math.round((sub.amountCents / days) * 30);
  }, 0);

  return {
    subscriptions: subscriptions as SubscriptionRow[],
    activeCount,
    mrrCents,
    trialCount,
    expiringSoon,
  };
}

export default async function SubscriptionsPage() {
  const { subscriptions, activeCount, mrrCents, trialCount, expiringSoon } =
    await getSubscriptionsData().catch(() => ({
      subscriptions: [] as SubscriptionRow[],
      activeCount: 0,
      mrrCents: 0,
      trialCount: 0,
      expiringSoon: 0,
    }));

  const summaryCards = [
    {
      label: "Active Subscriptions",
      value: activeCount,
      icon: Activity,
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-50",
    },
    {
      label: "MRR",
      value: formatMoney(mrrCents),
      icon: TrendingUp,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-50",
    },
    {
      label: "Trials",
      value: trialCount,
      icon: CreditCard,
      iconColor: "text-amber-600",
      iconBg: "bg-amber-50",
    },
    {
      label: "Expiring Soon",
      value: expiringSoon,
      icon: Clock,
      iconColor: "text-red-500",
      iconBg: "bg-red-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Subscriptions</h1>
          <p className="text-sm text-slate-500 mt-1">
            All subscription records across every tenant.
          </p>
        </div>
        <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors">
          <span>+</span> Add Subscription
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map(({ label, value, icon: Icon, iconColor, iconBg }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
              <span className={`p-2 rounded-lg ${iconBg}`}>
                <Icon className={`h-4 w-4 ${iconColor}`} />
              </span>
            </div>
            <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
          </div>
        ))}
      </div>

      {/* Subscriptions table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">All Subscriptions</h2>
          <p className="text-xs text-slate-400 mt-0.5">{subscriptions.length} total records</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">
                  Tenant
                </th>
                <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">
                  Plan
                </th>
                <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">
                  Status
                </th>
                <th className="text-right px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">
                  Amount
                </th>
                <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">
                  Period
                </th>
                <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">
                  Payment Method
                </th>
                <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">
                  Paid At
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subscriptions.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-400">
                    <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    No subscriptions recorded yet.
                  </td>
                </tr>
              )}
              {subscriptions.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900">{sub.tenant.name}</p>
                    <p className="text-xs text-slate-400 font-mono">{sub.tenant.slug}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        PLAN_BADGE[sub.plan] ?? "bg-slate-50 text-slate-500"
                      }`}
                    >
                      {sub.plan}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        STATUS_BADGE[sub.status] ?? "bg-slate-50 text-slate-500"
                      }`}
                    >
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-slate-900">
                    {formatMoney(sub.amountCents, sub.currency)}
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-500 whitespace-nowrap">
                    {formatDate(sub.periodStart)} – {formatDate(sub.periodEnd)}
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-500">
                    {sub.paymentMethod ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-500">
                    {formatDate(sub.paidAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
