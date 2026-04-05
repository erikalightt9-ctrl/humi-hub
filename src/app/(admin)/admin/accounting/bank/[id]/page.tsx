"use client";

import { useEffect, useState } from "react";
import { Loader2, AlertCircle, ArrowLeft, Upload, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface BankTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "CREDIT" | "DEBIT";
  status: "PENDING" | "MATCHED";
}

interface ReconcileSummary {
  matched: number;
  unmatched: number;
  pending: number;
  matchedAmount: number;
  unmatchedAmount: number;
  pendingAmount: number;
}

const fmt = (n: number) => `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-PH");

export default function BankReconciliationPage() {
  const { id } = useParams<{ id: string }>();
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [summary, setSummary] = useState<ReconcileSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"PENDING" | "MATCHED" | "ALL">("ALL");
  const [autoReconciling, setAutoReconciling] = useState(false);
  const [matchingId, setMatchingId] = useState<string | null>(null);

  const load = async () => {
    try {
      const url = statusFilter === "ALL"
        ? `/api/admin/accounting/bank-accounts/${id}/transactions`
        : `/api/admin/accounting/bank-accounts/${id}/transactions?status=${statusFilter}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load transactions");
      const d = await res.json();
      setTransactions(d.data ?? d ?? []);
      if (d.summary) setSummary(d.summary);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id, statusFilter]);

  const handleAutoReconcile = async () => {
    setAutoReconciling(true);
    try {
      const res = await fetch(`/api/admin/accounting/bank-accounts/${id}/auto-reconcile`, { method: "POST" });
      if (!res.ok) throw new Error("Auto-reconcile failed");
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error");
    } finally {
      setAutoReconciling(false);
    }
  };

  const handleMatch = async (txId: string) => {
    setMatchingId(txId);
    try {
      const res = await fetch(`/api/admin/accounting/bank-transactions/${txId}/match`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to match transaction");
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error");
    } finally {
      setMatchingId(null);
    }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/admin/accounting/bank" className="text-slate-400 hover:text-slate-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900">Bank Reconciliation</h1>
          <p className="text-sm text-slate-500 mt-0.5">Match bank transactions to journal entries</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => alert("CSV import coming soon")}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50"
          >
            <Upload className="h-4 w-4" />
            Import CSV
          </button>
          <button
            onClick={handleAutoReconcile}
            disabled={autoReconciling}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            {autoReconciling ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Auto-Reconcile
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          <AlertCircle className="h-5 w-5 flex-shrink-0" /><span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Transactions */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filter Tabs */}
          <div className="flex gap-1 border-b border-slate-200">
            {(["ALL", "PENDING", "MATCHED"] as const).map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setLoading(true); }}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  statusFilter === s ? "border-emerald-600 text-emerald-700" : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-6 w-6 text-emerald-600 animate-spin" />
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Description</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400">No transactions found</td></tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-slate-600">{fmtDate(tx.date)}</td>
                        <td className="px-4 py-3 text-slate-800 max-w-xs truncate">{tx.description}</td>
                        <td className={`px-4 py-3 text-right font-medium ${tx.type === "CREDIT" ? "text-emerald-700" : "text-red-700"}`}>
                          {tx.type === "DEBIT" ? "-" : "+"}{fmt(Math.abs(tx.amount))}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tx.status === "MATCHED" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {tx.status === "PENDING" && (
                            <button
                              onClick={() => handleMatch(tx.id)}
                              disabled={matchingId === tx.id}
                              className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 disabled:opacity-50"
                            >
                              {matchingId === tx.id && <Loader2 className="h-3 w-3 animate-spin" />}
                              Match
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right: Summary */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-700">Reconciliation Summary</h2>
            {summary ? (
              <div className="space-y-3">
                {[
                  { label: "Matched", count: summary.matched, amount: summary.matchedAmount, color: "text-emerald-700" },
                  { label: "Unmatched", count: summary.unmatched, amount: summary.unmatchedAmount, color: "text-amber-700" },
                  { label: "Pending", count: summary.pending, amount: summary.pendingAmount, color: "text-slate-600" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-slate-700">{row.label}</p>
                      <p className={`text-xs ${row.color}`}>{row.count} transactions</p>
                    </div>
                    <p className={`text-sm font-semibold ${row.color}`}>{fmt(row.amount)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">Loading summary...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
