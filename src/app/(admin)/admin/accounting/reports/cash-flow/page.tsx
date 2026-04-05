"use client";

import { useState } from "react";
import { Loader2, AlertCircle, Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface CFItem { label: string; amount: number; }

interface CashFlowReport {
  operating: CFItem[];
  investing: CFItem[];
  financing: CFItem[];
  netOperating: number;
  netInvesting: number;
  netFinancing: number;
  netChange: number;
  openingBalance: number;
  closingBalance: number;
}

const fmt = (n: number) => `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

function getDefaultFrom() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
}

function Section({ title, items, total, colorClass }: { title: string; items: CFItem[]; total: number; colorClass: string }) {
  return (
    <>
      <div className={`px-5 py-3 border-b ${colorClass}`}>
        <h2 className="text-sm font-bold uppercase tracking-wide">{title}</h2>
      </div>
      <table className="w-full text-sm">
        <tbody className="divide-y divide-slate-100">
          {items.map((item, i) => (
            <tr key={i} className="hover:bg-slate-50">
              <td className="px-5 py-2 text-slate-800">{item.label}</td>
              <td className={`px-5 py-2 text-right font-medium ${item.amount >= 0 ? "text-slate-700" : "text-red-600"}`}>
                {item.amount >= 0 ? fmt(item.amount) : `(${fmt(Math.abs(item.amount))})`}
              </td>
            </tr>
          ))}
          <tr className="bg-slate-50">
            <td className="px-5 py-3 font-bold text-slate-700">Net {title}</td>
            <td className={`px-5 py-3 text-right font-bold ${total >= 0 ? "text-emerald-700" : "text-red-700"}`}>{fmt(total)}</td>
          </tr>
        </tbody>
      </table>
    </>
  );
}

export default function CashFlowPage() {
  const [dateFrom, setDateFrom] = useState(getDefaultFrom());
  const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0]);
  const [report, setReport] = useState<CashFlowReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/accounting/reports/cash-flow?dateFrom=${dateFrom}&dateTo=${dateTo}`);
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
          <h1 className="text-xl font-bold text-slate-900">Cash Flow Statement</h1>
          <p className="text-sm text-slate-500 mt-0.5">Cash inflows and outflows</p>
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
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <Section title="Operating Activities" items={report.operating} total={report.netOperating} colorClass="bg-emerald-50 text-emerald-800 border-emerald-100" />
          <Section title="Investing Activities" items={report.investing} total={report.netInvesting} colorClass="bg-blue-50 text-blue-800 border-blue-100" />
          <Section title="Financing Activities" items={report.financing} total={report.netFinancing} colorClass="bg-purple-50 text-purple-800 border-purple-100" />

          <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 space-y-2">
            {[
              ["Opening Balance", report.openingBalance],
              ["Net Change in Cash", report.netChange],
            ].map(([label, value]) => (
              <div key={label as string} className="flex justify-between text-sm">
                <span className="text-slate-600">{label}</span>
                <span className={`font-medium ${(value as number) >= 0 ? "text-slate-700" : "text-red-700"}`}>{fmt(value as number)}</span>
              </div>
            ))}
            <div className="flex justify-between text-base font-bold pt-2 border-t border-slate-200">
              <span className="text-slate-700">Closing Balance</span>
              <span className={report.closingBalance >= 0 ? "text-emerald-700" : "text-red-700"}>{fmt(report.closingBalance)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
