"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Landmark, TrendingUp, TrendingDown, RefreshCw,
  ArrowRight, FileText, Receipt, CreditCard,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface BankAccount {
  id: string; name: string; bankName: string;
  currentBalance: number; currency: string; lastReconciledAt: string | null;
}
interface InvoiceRow {
  id: string; invoiceNumber: string; customerName: string;
  totalAmount: number; paidAmount: number; status: string; dueDate: string;
}
interface ExpenseRow {
  id: string; expenseNumber: string; vendor: string;
  category: string; totalAmount: number; status: string; expenseDate: string;
}
interface PayrollRun {
  runNumber: number; status: string;
  periodStart: string; periodEnd: string;
  totalGross: number; totalNet: number; employeeCount: number;
}
interface FinanceData {
  summary: {
    totalBankBalance: number; totalReceivables: number; overdueCount: number;
    expensesThisMonth: number; expensesLastMonth: number;
    revenueThisMonth: number;  revenueLastMonth: number;
    netThisMonth: number;      payrollCost: number;
  };
  bankAccounts:     BankAccount[];
  invoicesByStatus: { status: string; count: number; total: number }[];
  recentInvoices:   InvoiceRow[];
  recentExpenses:   ExpenseRow[];
  lastPayrollRun:   PayrollRun | null;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function peso(n: number) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(n);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

function delta(current: number, previous: number) {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

const INVOICE_COLORS: Record<string, string> = {
  DRAFT:          "bg-slate-100 text-slate-500",
  SENT:           "bg-blue-50 text-blue-700",
  PARTIALLY_PAID: "bg-amber-50 text-amber-700",
  PAID:           "bg-emerald-50 text-emerald-700",
  OVERDUE:        "bg-red-50 text-red-700",
  CANCELLED:      "bg-slate-100 text-slate-400",
  VOIDED:         "bg-slate-100 text-slate-400",
};

const EXPENSE_COLORS: Record<string, string> = {
  DRAFT:     "bg-slate-100 text-slate-500",
  SUBMITTED: "bg-blue-50 text-blue-700",
  APPROVED:  "bg-emerald-50 text-emerald-700",
  REJECTED:  "bg-red-50 text-red-700",
  PAID:      "bg-emerald-100 text-emerald-800",
  VOIDED:    "bg-slate-100 text-slate-400",
};

/* ------------------------------------------------------------------ */
/*  KPI Card                                                           */
/* ------------------------------------------------------------------ */

function KpiCard({
  icon: Icon, label, value, sub, accent, change,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string; sub?: string; accent: string;
  change?: number | null;
}) {
  return (
    <div className="bg-white border rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className={`h-10 w-10 rounded-xl ${accent} flex items-center justify-center`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        {change != null && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${change >= 0 ? "text-emerald-600" : "text-red-500"}`}>
            {change >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {Math.abs(change).toFixed(1)}% vs last month
          </div>
        )}
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">{label}</p>
        <p className="text-2xl font-extrabold text-slate-900">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Finance Overview Page                                              */
/* ------------------------------------------------------------------ */

export default function FinanceOverviewPage() {
  const [data, setData]       = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/admin/finance/overview");
      const json = (await res.json()) as { success: boolean; data: FinanceData };
      if (json.success) { setData(json.data); setLastSync(new Date()); }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const s = data?.summary;

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Finance</h1>
          <p className="text-slate-500 text-sm mt-1">Cash position, receivables, and financial health — real-time</p>
        </div>
        <div className="flex items-center gap-3">
          {lastSync && <p className="text-xs text-slate-400">Updated {lastSync.toLocaleTimeString()}</p>}
          <button
            onClick={() => void load()}
            disabled={loading}
            className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 border border-slate-200 rounded-xl px-3 py-2 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <Link
            href="/admin/accounting"
            className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-800 border border-blue-200 rounded-xl px-3 py-2"
          >
            Full Accounting
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {loading && !data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-slate-100 rounded-2xl h-28 animate-pulse" />
          ))}
        </div>
      )}

      {s && data && (
        <>
          {/* ── KPI Row ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              icon={Landmark}
              label="Cash Position"
              value={peso(s.totalBankBalance)}
              sub={`${data.bankAccounts.length} bank account${data.bankAccounts.length !== 1 ? "s" : ""}`}
              accent="bg-violet-600"
            />
            <KpiCard
              icon={FileText}
              label="Open Receivables"
              value={peso(s.totalReceivables)}
              sub={s.overdueCount > 0 ? `${s.overdueCount} overdue` : "None overdue"}
              accent="bg-amber-500"
            />
            <KpiCard
              icon={Receipt}
              label="Expenses (MTD)"
              value={peso(s.expensesThisMonth)}
              sub="Approved & paid"
              accent="bg-rose-600"
              change={delta(s.expensesThisMonth, s.expensesLastMonth)}
            />
            <KpiCard
              icon={CreditCard}
              label="Payroll Cost"
              value={s.payrollCost > 0 ? peso(s.payrollCost) : "—"}
              sub={
                data.lastPayrollRun
                  ? `${data.lastPayrollRun.employeeCount} employees · ${data.lastPayrollRun.status}`
                  : "No payroll run yet"
              }
              accent="bg-emerald-600"
            />
          </div>

          {/* ── P&L snapshot ─────────────────────────────────────────── */}
          <div className="bg-white border rounded-2xl p-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-5">P&amp;L Snapshot — Month to Date</h2>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="text-xs text-slate-400 mb-1 font-medium">Revenue (paid invoices)</p>
                <p className="text-xl font-extrabold text-emerald-600">{peso(s.revenueThisMonth)}</p>
                {delta(s.revenueThisMonth, s.revenueLastMonth) != null && (
                  <p className={`text-xs mt-0.5 font-medium ${(delta(s.revenueThisMonth, s.revenueLastMonth) ?? 0) >= 0 ? "text-emerald-500" : "text-red-400"}`}>
                    {(delta(s.revenueThisMonth, s.revenueLastMonth) ?? 0) >= 0 ? "▲" : "▼"}{" "}
                    {Math.abs(delta(s.revenueThisMonth, s.revenueLastMonth) ?? 0).toFixed(1)}% vs last month
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1 font-medium">Expenses (approved + paid)</p>
                <p className="text-xl font-extrabold text-rose-600">{peso(s.expensesThisMonth)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1 font-medium">Net Position</p>
                <p className={`text-xl font-extrabold ${s.netThisMonth >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {peso(s.netThisMonth)}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Revenue minus expenses</p>
              </div>
            </div>
            {/* Visual bar */}
            {s.revenueThisMonth > 0 && (
              <div className="mt-5">
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-3 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                    style={{ width: `${Math.min((s.revenueThisMonth / (s.revenueThisMonth + s.expensesThisMonth)) * 100, 100).toFixed(1)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 mt-1.5">
                  <span>Revenue {((s.revenueThisMonth / (s.revenueThisMonth + s.expensesThisMonth)) * 100).toFixed(0)}%</span>
                  <span>Expenses {((s.expensesThisMonth / (s.revenueThisMonth + s.expensesThisMonth)) * 100).toFixed(0)}%</span>
                </div>
              </div>
            )}
          </div>

          {/* ── Bank Accounts + Invoice Status ────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Bank accounts */}
            <div className="bg-white border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Bank Accounts</h2>
                <Link href="/admin/accounting/bank" className="text-xs text-blue-600 hover:underline font-medium">
                  Manage →
                </Link>
              </div>
              {data.bankAccounts.length === 0 ? (
                <p className="text-sm text-slate-400">No bank accounts configured.</p>
              ) : (
                <div className="space-y-3">
                  {data.bankAccounts.map((b) => (
                    <div key={b.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{b.name}</p>
                        <p className="text-xs text-slate-400">{b.bankName}</p>
                      </div>
                      <p className="text-sm font-extrabold text-slate-900">{peso(b.currentBalance)}</p>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-1">
                    <p className="text-xs font-semibold text-slate-500">Total Cash</p>
                    <p className="text-sm font-extrabold text-violet-700">{peso(s.totalBankBalance)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Invoice status breakdown */}
            <div className="bg-white border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Invoices by Status</h2>
                <Link href="/admin/accounting/invoices" className="text-xs text-blue-600 hover:underline font-medium">
                  View All →
                </Link>
              </div>
              {data.invoicesByStatus.length === 0 ? (
                <p className="text-sm text-slate-400">No invoices yet.</p>
              ) : (
                <div className="space-y-2">
                  {data.invoicesByStatus.map((row) => (
                    <div key={row.status} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${INVOICE_COLORS[row.status] ?? "bg-slate-100 text-slate-500"}`}>
                          {row.status.replace(/_/g, " ")}
                        </span>
                        <span className="text-xs text-slate-400">{row.count} invoice{row.count !== 1 ? "s" : ""}</span>
                      </div>
                      <span className="text-sm font-semibold text-slate-700">{peso(row.total)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Recent Invoices + Recent Expenses ─────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Recent invoices */}
            <div className="bg-white border rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Recent Invoices</h2>
                <Link href="/admin/accounting/invoices" className="text-xs text-blue-600 hover:underline font-medium">
                  View All →
                </Link>
              </div>
              {data.recentInvoices.length === 0 ? (
                <p className="px-5 py-4 text-sm text-slate-400">No invoices yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-400 text-[11px] font-bold uppercase tracking-widest">
                    <tr>
                      <th className="px-5 py-2 text-left">Invoice</th>
                      <th className="px-3 py-2 text-left">Customer</th>
                      <th className="px-3 py-2 text-right">Amount</th>
                      <th className="px-3 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.recentInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3 font-mono text-xs text-slate-600">{inv.invoiceNumber}</td>
                        <td className="px-3 py-3 text-slate-700 truncate max-w-[100px]">{inv.customerName}</td>
                        <td className="px-3 py-3 text-right font-semibold text-slate-900">{peso(inv.totalAmount)}</td>
                        <td className="px-3 py-3">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${INVOICE_COLORS[inv.status] ?? ""}`}>
                            {inv.status.replace(/_/g, " ")}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Recent expenses */}
            <div className="bg-white border rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Recent Expenses</h2>
                <Link href="/admin/accounting/expenses" className="text-xs text-blue-600 hover:underline font-medium">
                  View All →
                </Link>
              </div>
              {data.recentExpenses.length === 0 ? (
                <p className="px-5 py-4 text-sm text-slate-400">No expenses yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-400 text-[11px] font-bold uppercase tracking-widest">
                    <tr>
                      <th className="px-5 py-2 text-left">Vendor</th>
                      <th className="px-3 py-2 text-left">Category</th>
                      <th className="px-3 py-2 text-right">Amount</th>
                      <th className="px-3 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.recentExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3 text-slate-700 truncate max-w-[100px]">{exp.vendor}</td>
                        <td className="px-3 py-3 text-slate-500 text-xs">{exp.category}</td>
                        <td className="px-3 py-3 text-right font-semibold text-slate-900">{peso(exp.totalAmount)}</td>
                        <td className="px-3 py-3">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${EXPENSE_COLORS[exp.status] ?? ""}`}>
                            {exp.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
