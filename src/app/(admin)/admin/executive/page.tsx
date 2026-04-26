"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Users, Wallet, GraduationCap, Wrench, TrendingUp,
  RefreshCw, ArrowRight, AlertCircle, Landmark, Monitor, ShoppingCart,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ExecutiveData {
  hr:         { activeEmployees: number; pendingLeaves: number; presentToday: number; absentToday: number };
  payroll:    { lastRun: { status: string; periodStart: string; periodEnd: string; totalNet: number; employeeCount: number } | null };
  finance:    { totalBankBalance: number; bankAccountCount: number; openReceivables: number; openInvoiceCount: number; expensesThisMonth: number };
  training:   { activeCourses: number; activeEnrollments: number };
  operations: { pendingRepairs: number };
  sales?:     { pipelineValue: number; activeDeals: number; wonThisMonth: number; revenueThisMonth: number };
  it?:        { openRequests: number };
  activity:   { department: string; label: string; time: string; dot: string }[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function peso(n: number) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(n);
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmtPeriod(start: string, end: string) {
  const fmt = (d: string) => new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
  return `${fmt(start)} – ${fmt(end)}`;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT:    "text-slate-500 bg-slate-100",
  APPROVED: "text-emerald-700 bg-emerald-50 border-emerald-200",
  PAID:     "text-emerald-700 bg-emerald-50 border-emerald-200",
  PENDING:  "text-amber-700 bg-amber-50 border-amber-200",
};

/* ------------------------------------------------------------------ */
/*  KPI Card                                                           */
/* ------------------------------------------------------------------ */

function KpiCard({
  icon: Icon, label, value, sub, accent, href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  accent: string;
  href?: string;
}) {
  const inner = (
    <div className={`bg-white border rounded-2xl p-5 flex flex-col gap-3 hover:shadow-md transition-shadow ${href ? "cursor-pointer" : ""}`}>
      <div className="flex items-center justify-between">
        <div className={`h-10 w-10 rounded-xl ${accent} flex items-center justify-center`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        {href && <ArrowRight className="h-4 w-4 text-slate-300" />}
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">{label}</p>
        <p className="text-2xl font-extrabold text-slate-900">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

/* ------------------------------------------------------------------ */
/*  Executive Command Center                                           */
/* ------------------------------------------------------------------ */

export default function ExecutiveDashboardPage() {
  const [data, setData]       = useState<ExecutiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/admin/executive/overview");
      const json = (await res.json()) as { success: boolean; data: ExecutiveData };
      if (json.success) { setData(json.data); setLastSync(new Date()); }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Executive Command Center</h1>
          <p className="text-slate-500 text-sm mt-1">
            Single source of truth · All departments connected · Real-time
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastSync && (
            <p className="text-xs text-slate-400">
              Updated {lastSync.toLocaleTimeString()}
            </p>
          )}
          <button
            onClick={() => void load()}
            disabled={loading}
            className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 border border-slate-200 rounded-xl px-3 py-2 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {loading && !data && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-slate-100 rounded-2xl h-28 animate-pulse" />
          ))}
        </div>
      )}

      {data && (
        <>
          {/* ── KPI Grid ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
            <KpiCard
              icon={Users}
              label="Active Employees"
              value={data.hr.activeEmployees.toLocaleString()}
              sub={`${data.hr.presentToday} present today · ${data.hr.pendingLeaves} leave pending`}
              accent="bg-blue-600"
              href="/admin/departments"
            />
            <KpiCard
              icon={Wallet}
              label="Payroll (Last Run)"
              value={data.payroll.lastRun ? peso(data.payroll.lastRun.totalNet) : "—"}
              sub={
                data.payroll.lastRun
                  ? `${data.payroll.lastRun.status} · ${fmtPeriod(data.payroll.lastRun.periodStart, data.payroll.lastRun.periodEnd)}`
                  : "No payroll runs yet"
              }
              accent="bg-emerald-600"
              href="/admin/hr/analytics"
            />
            <KpiCard
              icon={Landmark}
              label="Cash Position"
              value={peso(data.finance.totalBankBalance)}
              sub={`${data.finance.bankAccountCount} bank account${data.finance.bankAccountCount !== 1 ? "s" : ""}`}
              accent="bg-violet-600"
              href="/admin/finance"
            />
            <KpiCard
              icon={TrendingUp}
              label="Open Receivables"
              value={peso(data.finance.openReceivables)}
              sub={`${data.finance.openInvoiceCount} open invoice${data.finance.openInvoiceCount !== 1 ? "s" : ""}`}
              accent="bg-amber-500"
              href="/admin/finance"
            />
            <KpiCard
              icon={GraduationCap}
              label="Active Learners"
              value={data.training.activeEnrollments.toLocaleString()}
              sub={`${data.training.activeCourses} course${data.training.activeCourses !== 1 ? "s" : ""} running`}
              accent="bg-cyan-600"
              href="/admin/training-center"
            />
            <KpiCard
              icon={Wrench}
              label="Open Repairs"
              value={data.operations.pendingRepairs.toLocaleString()}
              sub="Pending or in-progress"
              accent="bg-rose-600"
              href="/admin/action-center"
            />
            <KpiCard
              icon={ShoppingCart}
              label="Pipeline Value"
              value={peso(data.sales?.pipelineValue ?? 0)}
              sub={`${data.sales?.activeDeals ?? 0} active deals`}
              accent="bg-violet-500"
              href="/admin/sales"
            />
            <KpiCard
              icon={TrendingUp}
              label="Won This Month"
              value={String(data.sales?.wonThisMonth ?? 0)}
              sub={data.sales?.revenueThisMonth ? peso(data.sales.revenueThisMonth) : "No closed deals yet"}
              accent="bg-emerald-500"
              href="/admin/sales"
            />
          </div>

          {/* ── Two-column: department cards + activity feed ──────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Department status cards — 2 cols */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Department Status</h2>

              {/* HR */}
              <div className="bg-white border rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center">
                      <Users className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="font-semibold text-slate-800 text-sm">HR & People</span>
                  </div>
                  <Link href="/admin/hr/analytics" className="text-xs text-blue-600 hover:underline font-medium">
                    View Analytics →
                  </Link>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Active",   value: data.hr.activeEmployees, color: "text-emerald-600" },
                    { label: "Present",  value: data.hr.presentToday,    color: "text-blue-600"    },
                    { label: "On Leave", value: data.hr.pendingLeaves,   color: "text-amber-600"   },
                  ].map((s) => (
                    <div key={s.label} className="text-center bg-slate-50 rounded-xl p-3">
                      <p className={`text-xl font-extrabold ${s.color}`}>{s.value}</p>
                      <p className="text-[11px] text-slate-400 font-medium">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Finance */}
              <div className="bg-white border rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-violet-600 flex items-center justify-center">
                      <Landmark className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="font-semibold text-slate-800 text-sm">Finance</span>
                  </div>
                  <Link href="/admin/finance" className="text-xs text-blue-600 hover:underline font-medium">
                    View Finance →
                  </Link>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Bank Balance",      value: peso(data.finance.totalBankBalance),  color: "text-violet-600" },
                    { label: "Receivables",        value: peso(data.finance.openReceivables),   color: "text-amber-600"  },
                    { label: "Expenses (MTD)",     value: peso(data.finance.expensesThisMonth), color: "text-rose-600"   },
                  ].map((s) => (
                    <div key={s.label} className="text-center bg-slate-50 rounded-xl p-3">
                      <p className={`text-sm font-extrabold ${s.color}`}>{s.value}</p>
                      <p className="text-[11px] text-slate-400 font-medium">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payroll */}
              {data.payroll.lastRun && (
                <div className="bg-white border rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-emerald-600 flex items-center justify-center">
                        <Wallet className="h-3.5 w-3.5 text-white" />
                      </div>
                      <span className="font-semibold text-slate-800 text-sm">Payroll</span>
                    </div>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[data.payroll.lastRun.status] ?? "text-slate-500 bg-slate-50"}`}>
                      {data.payroll.lastRun.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Period",     value: fmtPeriod(data.payroll.lastRun.periodStart, data.payroll.lastRun.periodEnd), color: "text-slate-700" },
                      { label: "Employees",  value: String(data.payroll.lastRun.employeeCount), color: "text-slate-700" },
                      { label: "Net Payout", value: peso(data.payroll.lastRun.totalNet), color: "text-emerald-600" },
                    ].map((s) => (
                      <div key={s.label} className="text-center bg-slate-50 rounded-xl p-3">
                        <p className={`text-sm font-extrabold ${s.color}`}>{s.value}</p>
                        <p className="text-[11px] text-slate-400 font-medium">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Operations */}
              <div className="bg-white border rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-rose-600 flex items-center justify-center">
                      <Wrench className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="font-semibold text-slate-800 text-sm">IT & Operations</span>
                  </div>
                  <Link href="/admin/action-center" className="text-xs text-blue-600 hover:underline font-medium">
                    View Action Center →
                  </Link>
                </div>
                {data.operations.pendingRepairs === 0 ? (
                  <p className="text-sm text-emerald-600 font-medium">All clear — no open repair requests.</p>
                ) : (
                  <div className="flex items-center gap-3 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">
                    <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
                    <p className="text-sm text-rose-700 font-medium">
                      {data.operations.pendingRepairs} open repair request{data.operations.pendingRepairs !== 1 ? "s" : ""} need attention
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Activity feed — 1 col */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Live Activity</h2>
              <div className="bg-white border rounded-2xl p-5">
                {data.activity.length === 0 ? (
                  <p className="text-sm text-slate-400">No recent activity.</p>
                ) : (
                  <div className="space-y-4">
                    {data.activity.map((a, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${a.dot}`} />
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">{a.department}</p>
                          <p className="text-xs text-slate-700 leading-snug">{a.label}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{timeAgo(a.time)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick links */}
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 pt-2">Quick Links</h2>
              <div className="bg-white border rounded-2xl divide-y divide-slate-100">
                {[
                  { label: "HR Analytics",    href: "/admin/hr/analytics",    dot: "bg-blue-500"    },
                  { label: "Finance Overview", href: "/admin/finance",          dot: "bg-violet-500"  },
                  { label: "Action Center",    href: "/admin/action-center",    dot: "bg-amber-500"   },
                  { label: "Training Center",  href: "/admin/training-center",  dot: "bg-cyan-500"    },
                  { label: "Accounting",       href: "/admin/accounting",       dot: "bg-emerald-500" },
                ].map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-sm font-medium text-slate-700"
                  >
                    <span className={`w-2 h-2 rounded-full ${l.dot}`} />
                    {l.label}
                    <ArrowRight className="h-3.5 w-3.5 ml-auto text-slate-300" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
