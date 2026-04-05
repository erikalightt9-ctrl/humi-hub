"use client";

import { useState } from "react";
import { Loader2, AlertCircle, Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PLAccount {
  code: string;
  name: string;
  balance: number;
}

interface PLReport {
  revenue: PLAccount[];
  expenses: PLAccount[];
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
}

const fmt = (n: number) => `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

function getDefaultFrom() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
}
function getDefaultTo() {
  return new Date().toISOString().split("T")[0];
}

export default function ProfitLossPage() {
  const [dateFrom, setDateFrom] = useState(getDefaultFrom());
  const [dateTo, setDateTo] = useState(getDefaultTo());
  const [report, setReport] = useState<PLReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/accounting/reports/profit-loss?dateFrom=${dateFrom}&dateTo=${dateTo}`);
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
    <div className="p-6 max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/accounting/reports" className="text-slate-400 hover:text-slate-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900">Profit & Loss</h1>
          <p className="text-sm text-slate-500 mt-0.5">Income statement report</p>
        </div>
        {report && (
          <button onClick={() => window.print()}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50">
            <Printer className="h-4 w-4" />Print
          </button>
        )}
      </div>

      {/* Date Range */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-end gap-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">From</label>
            <input type="date" className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">To</label>
            <input type="date" className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
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
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden print:shadow-none">
          {/* Revenue Section */}
          <div className="px-5 py-3 bg-emerald-50 border-b border-emerald-100">
            <h2 className="text-sm font-bold text-emerald-800 uppercase tracking-wide">Revenue</h2>
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-100">
              {report.revenue.map((a) => (
                <tr key={a.code} className="hover:bg-slate-50">
                  <td className="px-5 py-2 font-mono text-slate-500 w-24">{a.code}</td>
                  <td className="px-4 py-2 text-slate-800">{a.name}</td>
                  <td className="px-5 py-2 text-right font-medium text-emerald-700">{fmt(a.balance)}</td>
                </tr>
              ))}
              <tr className="bg-emerald-50">
                <td colSpan={2} className="px-5 py-3 font-bold text-emerald-800">Total Revenue</td>
                <td className="px-5 py-3 text-right font-bold text-emerald-800">{fmt(report.totalRevenue)}</td>
              </tr>
            </tbody>
          </table>

          {/* Expenses Section */}
          <div className="px-5 py-3 bg-red-50 border-t border-b border-red-100">
            <h2 className="text-sm font-bold text-red-800 uppercase tracking-wide">Expenses</h2>
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-100">
              {report.expenses.map((a) => (
                <tr key={a.code} className="hover:bg-slate-50">
                  <td className="px-5 py-2 font-mono text-slate-500 w-24">{a.code}</td>
                  <td className="px-4 py-2 text-slate-800">{a.name}</td>
                  <td className="px-5 py-2 text-right font-medium text-red-700">{fmt(a.balance)}</td>
                </tr>
              ))}
              <tr className="bg-red-50">
                <td colSpan={2} className="px-5 py-3 font-bold text-red-800">Total Expenses</td>
                <td className="px-5 py-3 text-right font-bold text-red-800">{fmt(report.totalExpenses)}</td>
              </tr>
            </tbody>
          </table>

          {/* Net Income */}
          <div className={`px-5 py-4 flex justify-between items-center border-t-2 ${report.netIncome >= 0 ? "border-emerald-300 bg-emerald-50" : "border-red-300 bg-red-50"}`}>
            <span className={`text-base font-bold ${report.netIncome >= 0 ? "text-emerald-800" : "text-red-800"}`}>Net Income</span>
            <span className={`text-lg font-bold ${report.netIncome >= 0 ? "text-emerald-700" : "text-red-700"}`}>{fmt(report.netIncome)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
