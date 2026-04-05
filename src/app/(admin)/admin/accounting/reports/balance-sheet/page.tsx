"use client";

import { useState } from "react";
import { Loader2, AlertCircle, Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface BSAccount { code: string; name: string; balance: number; }

interface BalanceSheetReport {
  assets: BSAccount[];
  liabilities: BSAccount[];
  equity: BSAccount[];
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  isBalanced: boolean;
}

const fmt = (n: number) => `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

export default function BalanceSheetPage() {
  const [asOf, setAsOf] = useState(new Date().toISOString().split("T")[0]);
  const [report, setReport] = useState<BalanceSheetReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/accounting/reports/balance-sheet?asOf=${asOf}`);
      if (!res.ok) throw new Error("Failed to generate report");
      const d = await res.json();
      setReport(d.data ?? d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const Section = ({ title, accounts, total, colorClass }: { title: string; accounts: BSAccount[]; total: number; colorClass: string }) => (
    <>
      <div className={`px-5 py-3 border-b ${colorClass}`}>
        <h2 className="text-sm font-bold uppercase tracking-wide">{title}</h2>
      </div>
      <table className="w-full text-sm">
        <tbody className="divide-y divide-slate-100">
          {accounts.map((a) => (
            <tr key={a.code} className="hover:bg-slate-50">
              <td className="px-5 py-2 font-mono text-slate-500 w-24">{a.code}</td>
              <td className="px-4 py-2 text-slate-800">{a.name}</td>
              <td className="px-5 py-2 text-right font-medium text-slate-700">{fmt(a.balance)}</td>
            </tr>
          ))}
          <tr className="bg-slate-50">
            <td colSpan={2} className="px-5 py-3 font-bold text-slate-700">Total {title}</td>
            <td className="px-5 py-3 text-right font-bold text-slate-800">{fmt(total)}</td>
          </tr>
        </tbody>
      </table>
    </>
  );

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/accounting/reports" className="text-slate-400 hover:text-slate-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900">Balance Sheet</h1>
          <p className="text-sm text-slate-500 mt-0.5">Assets, liabilities, and equity</p>
        </div>
        {report && (
          <button onClick={() => window.print()}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50">
            <Printer className="h-4 w-4" />Print
          </button>
        )}
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
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <Section title="Assets" accounts={report.assets} total={report.totalAssets} colorClass="bg-blue-50 text-blue-800 border-blue-100" />
          <Section title="Liabilities" accounts={report.liabilities} total={report.totalLiabilities} colorClass="bg-red-50 text-red-800 border-red-100" />
          <Section title="Equity" accounts={report.equity} total={report.totalEquity} colorClass="bg-purple-50 text-purple-800 border-purple-100" />

          <div className={`px-5 py-4 border-t-2 flex items-center justify-between ${report.isBalanced ? "border-emerald-300 bg-emerald-50" : "border-red-300 bg-red-50"}`}>
            <div>
              <p className={`text-base font-bold ${report.isBalanced ? "text-emerald-800" : "text-red-800"}`}>
                Liabilities + Equity
              </p>
              <p className={`text-xs mt-0.5 ${report.isBalanced ? "text-emerald-600" : "text-red-600"}`}>
                {report.isBalanced ? "✓ Balanced" : "✗ Out of Balance"}
              </p>
            </div>
            <span className={`text-lg font-bold ${report.isBalanced ? "text-emerald-700" : "text-red-700"}`}>
              {fmt(report.totalLiabilities + report.totalEquity)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
