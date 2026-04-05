"use client";

import { useState } from "react";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface TBAccount {
  code: string;
  name: string;
  type: string;
  totalDebit: number;
  totalCredit: number;
}

interface TrialBalanceReport {
  accounts: TBAccount[];
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
}

const fmt = (n: number) => `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

export default function TrialBalancePage() {
  const [asOf, setAsOf] = useState(new Date().toISOString().split("T")[0]);
  const [report, setReport] = useState<TrialBalanceReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/accounting/reports/trial-balance?asOf=${asOf}`);
      if (!res.ok) throw new Error("Failed to generate report");
      const d = await res.json();
      setReport(d.data ?? d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/accounting/reports" className="text-slate-400 hover:text-slate-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Trial Balance</h1>
          <p className="text-sm text-slate-500 mt-0.5">Verify debits equal credits across all accounts</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-end gap-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">As of Date</label>
            <input type="date" className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={asOf} onChange={(e) => setAsOf(e.target.value)} />
          </div>
          <button onClick={generate} disabled={loading}
            className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Generate Report
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          <AlertCircle className="h-5 w-5 flex-shrink-0" /><span>{error}</span>
        </div>
      )}

      {report && (
        <>
          {/* Balance indicator */}
          <div className={`flex items-center gap-3 p-4 rounded-xl border ${report.isBalanced ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
            <span className={`text-2xl ${report.isBalanced ? "text-emerald-600" : "text-red-600"}`}>
              {report.isBalanced ? "✓" : "✗"}
            </span>
            <div>
              <p className={`text-sm font-bold ${report.isBalanced ? "text-emerald-800" : "text-red-800"}`}>
                {report.isBalanced ? "BALANCED" : "OUT OF BALANCE"}
              </p>
              {!report.isBalanced && (
                <p className="text-xs text-red-600">
                  Difference: {fmt(Math.abs(report.totalDebits - report.totalCredits))}
                </p>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Code</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Debit</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Credit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.accounts.map((a) => (
                  <tr key={a.code} className="hover:bg-slate-50">
                    <td className="px-4 py-2 font-mono text-slate-500">{a.code}</td>
                    <td className="px-4 py-2 text-slate-800">{a.name}</td>
                    <td className="px-4 py-2 text-slate-500 text-xs">{a.type}</td>
                    <td className="px-4 py-2 text-right text-slate-700">{a.totalDebit > 0 ? fmt(a.totalDebit) : "—"}</td>
                    <td className="px-4 py-2 text-right text-slate-700">{a.totalCredit > 0 ? fmt(a.totalCredit) : "—"}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50">
                  <td colSpan={3} className="px-4 py-3 text-sm font-bold text-slate-700">Total</td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-slate-800">{fmt(report.totalDebits)}</td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-slate-800">{fmt(report.totalCredits)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
