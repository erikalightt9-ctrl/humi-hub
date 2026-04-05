"use client";

import { useEffect, useState } from "react";
import { Loader2, AlertCircle, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Transaction {
  id: string;
  transactionNumber: string;
  date: string;
  description: string;
  status: "DRAFT" | "POSTED" | "VOIDED";
  reference?: string;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  POSTED: "bg-emerald-100 text-emerald-700",
  VOIDED: "bg-red-100 text-red-700",
};

const STATUSES = ["ALL", "DRAFT", "POSTED", "VOIDED"] as const;
type StatusFilter = (typeof STATUSES)[number];

const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-PH");

export default function TransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("ALL");

  useEffect(() => {
    const load = async () => {
      try {
        const url = filter === "ALL"
          ? "/api/admin/accounting/transactions"
          : `/api/admin/accounting/transactions?status=${filter}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to load transactions");
        const data = await res.json();
        setTransactions(data.data ?? data ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filter]);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Journal Entries</h1>
          <p className="text-sm text-slate-500 mt-1">{transactions.length} entries</p>
        </div>
        <Link
          href="/admin/accounting/transactions/new"
          className="flex items-center gap-2 px-3 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          New Transaction
        </Link>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => { setFilter(s); setLoading(true); }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              filter === s
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {s}
          </button>
        ))}
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
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tx#</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Description</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Reference</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">No transactions found</td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/admin/accounting/transactions/${tx.id}`)}
                  >
                    <td className="px-4 py-3 font-mono text-slate-700">{tx.transactionNumber}</td>
                    <td className="px-4 py-3 text-slate-600">{fmtDate(tx.date)}</td>
                    <td className="px-4 py-3 text-slate-800 max-w-xs truncate">{tx.description}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[tx.status]}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{tx.reference ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/accounting/transactions/${tx.id}`}
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
