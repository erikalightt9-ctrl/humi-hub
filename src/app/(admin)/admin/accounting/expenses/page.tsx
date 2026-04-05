"use client";

import { useEffect, useState } from "react";
import { Loader2, AlertCircle, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Expense {
  id: string;
  expenseNumber: string;
  vendor: string;
  category: string;
  date: string;
  amount: number;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "PAID";
}

interface Stats {
  totalThisMonth: number;
  pendingApproval: number;
  approved: number;
  rejected: number;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  SUBMITTED: "bg-blue-100 text-blue-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
  PAID: "bg-purple-100 text-purple-700",
};

const STATUSES = ["ALL", "DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "PAID"] as const;
type StatusFilter = (typeof STATUSES)[number];

const fmt = (n: number) => `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-PH");

export default function ExpensesPage() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filter !== "ALL") params.set("status", filter);
        if (categoryFilter) params.set("category", categoryFilter);

        const [expRes, statsRes] = await Promise.all([
          fetch(`/api/admin/accounting/expenses?${params}`),
          fetch("/api/admin/accounting/expenses/stats"),
        ]);
        if (!expRes.ok) throw new Error("Failed to load expenses");
        const d = await expRes.json();
        setExpenses(d.data ?? d ?? []);
        if (statsRes.ok) {
          const sd = await statsRes.json();
          setStats(sd.data ?? sd);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filter, categoryFilter]);

  const categories = Array.from(new Set(expenses.map((e) => e.category))).filter(Boolean);

  const statCards = [
    { label: "Total This Month", value: fmt(stats?.totalThisMonth ?? 0), color: "text-slate-700" },
    { label: "Pending Approval", value: String(stats?.pendingApproval ?? 0), color: "text-amber-700" },
    { label: "Approved", value: String(stats?.approved ?? 0), color: "text-emerald-700" },
    { label: "Rejected", value: String(stats?.rejected ?? 0), color: "text-red-700" },
  ];

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Expenses</h1>
          <p className="text-sm text-slate-500 mt-1">{expenses.length} expense records</p>
        </div>
        <Link
          href="/admin/accounting/expenses/new"
          className="flex items-center gap-2 px-3 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          New Expense
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">{s.label}</p>
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                filter === s ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <select
          className="ml-auto border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-6 w-6 text-emerald-600 animate-spin" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Exp#</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Vendor</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-400">No expenses found</td></tr>
              ) : (
                expenses.map((exp) => (
                  <tr
                    key={exp.id}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/admin/accounting/expenses/${exp.id}`)}
                  >
                    <td className="px-4 py-3 font-mono text-slate-700">{exp.expenseNumber}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{exp.vendor}</td>
                    <td className="px-4 py-3 text-slate-600">{exp.category}</td>
                    <td className="px-4 py-3 text-slate-600">{fmtDate(exp.date)}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-800">{fmt(exp.amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[exp.status]}`}>
                        {exp.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/accounting/expenses/${exp.id}`}
                        className="text-emerald-600 hover:underline text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
