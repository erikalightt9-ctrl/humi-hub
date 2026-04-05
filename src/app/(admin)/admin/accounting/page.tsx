"use client";

import { useEffect, useState } from "react";
import { Loader2, AlertCircle, DollarSign, TrendingDown, FileText, AlertTriangle, ShieldAlert } from "lucide-react";

const fmt = (n: number) => `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-PH");

interface DashboardData {
  totalReceivable: number;
  monthlyExpenses: number;
  openInvoicesCount: number;
  overdueInvoicesCount: number;
  unresolvedForensicFlags: number;
}

interface OverdueInvoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  totalAmount: number;
  dueDate: string;
}

interface ForensicFlag {
  id: string;
  ruleCode: string;
  severity: string;
  description: string;
}

export default function AccountingDashboard() {
  const [kpis, setKpis] = useState<DashboardData | null>(null);
  const [overdue, setOverdue] = useState<OverdueInvoice[]>([]);
  const [flags, setFlags] = useState<ForensicFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [dashRes, overdueRes, flagsRes] = await Promise.all([
          fetch("/api/admin/accounting/dashboard"),
          fetch("/api/admin/accounting/invoices?status=OVERDUE"),
          fetch("/api/admin/accounting/forensic-flags?isResolved=false"),
        ]);

        if (!dashRes.ok) throw new Error("Failed to load dashboard data");
        const dashData = await dashRes.json();
        setKpis(dashData.data ?? dashData);

        if (overdueRes.ok) {
          const d = await overdueRes.json();
          setOverdue(d.data ?? d ?? []);
        }

        if (flagsRes.ok) {
          const d = await flagsRes.json();
          setFlags(d.data ?? d ?? []);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  const kpiCards = [
    {
      label: "Total Receivable",
      value: fmt(kpis?.totalReceivable ?? 0),
      icon: DollarSign,
      color: "emerald",
      bg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      textColor: "text-emerald-700",
    },
    {
      label: "Monthly Expenses",
      value: fmt(kpis?.monthlyExpenses ?? 0),
      icon: TrendingDown,
      color: "red",
      bg: "bg-red-50",
      iconColor: "text-red-600",
      textColor: "text-red-700",
    },
    {
      label: "Open Invoices",
      value: String(kpis?.openInvoicesCount ?? 0),
      icon: FileText,
      color: "blue",
      bg: "bg-blue-50",
      iconColor: "text-blue-600",
      textColor: "text-blue-700",
    },
    {
      label: "Overdue Invoices",
      value: String(kpis?.overdueInvoicesCount ?? 0),
      icon: AlertTriangle,
      color: "amber",
      bg: "bg-amber-50",
      iconColor: "text-amber-600",
      textColor: "text-amber-700",
    },
    {
      label: "Forensic Flags",
      value: String(kpis?.unresolvedForensicFlags ?? 0),
      icon: ShieldAlert,
      color: "purple",
      bg: "bg-purple-50",
      iconColor: "text-purple-600",
      textColor: "text-purple-700",
    },
  ];

  const severityColor: Record<string, string> = {
    CRITICAL: "bg-red-100 text-red-700",
    HIGH: "bg-orange-100 text-orange-700",
    MEDIUM: "bg-amber-100 text-amber-700",
    LOW: "bg-blue-100 text-blue-700",
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Accounting Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Financial overview and alerts</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white border border-slate-200 rounded-xl p-4">
              <div className={`inline-flex p-2 rounded-lg ${card.bg} mb-3`}>
                <Icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
              <p className="text-xs text-slate-500 mb-1">{card.label}</p>
              <p className={`text-lg font-bold ${card.textColor}`}>{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Two-column sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue Invoices */}
        <div className="bg-white border border-slate-200 rounded-xl">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700">Overdue Invoices</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {overdue.length === 0 ? (
              <p className="px-5 py-6 text-sm text-slate-400 text-center">No overdue invoices</p>
            ) : (
              overdue.slice(0, 8).map((inv) => (
                <div key={inv.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{inv.customerName}</p>
                    <p className="text-xs text-slate-500">Due {fmtDate(inv.dueDate)}</p>
                  </div>
                  <span className="text-sm font-semibold text-red-600">{fmt(inv.totalAmount)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Forensic Flags */}
        <div className="bg-white border border-slate-200 rounded-xl">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700">Recent Forensic Alerts</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {flags.length === 0 ? (
              <p className="px-5 py-6 text-sm text-slate-400 text-center">No active forensic flags</p>
            ) : (
              flags.slice(0, 8).map((flag) => (
                <div key={flag.id} className="px-5 py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${severityColor[flag.severity] ?? "bg-slate-100 text-slate-600"}`}>
                      {flag.severity}
                    </span>
                    <span className="text-xs font-mono text-slate-500">{flag.ruleCode}</span>
                  </div>
                  <p className="text-sm text-slate-700 line-clamp-2">{flag.description}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
