"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart3, Users, CalendarDays, DollarSign,
  Loader2, RefreshCw, TrendingUp,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface LeaveByType   { leaveType: string; days: number; requests: number }
interface LeaveByStatus { status: string; requests: number }
interface PayrollRun    {
  id: string; runNumber: string;
  periodStart: string; periodEnd: string;
  status: string; totalGross: number; totalNet: number; lineCount: number;
}
interface HeadcountRow  { status: string; count: number }
interface AttRow        { status: string; count: number }

interface ReportsData {
  year:                number;
  leaveByType:         LeaveByType[];
  leaveByStatus:       LeaveByStatus[];
  payrollRuns:         PayrollRun[];
  headcount:           HeadcountRow[];
  attendanceThisMonth: AttRow[];
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmtPeso(n: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency", currency: "PHP", maximumFractionDigits: 0,
  }).format(n);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function capitalize(s: string) {
  return s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, " ");
}

const LEAVE_COLORS: Record<string, string> = {
  SICK:        "bg-red-100 text-red-700",
  VACATION:    "bg-blue-100 text-blue-700",
  EMERGENCY:   "bg-orange-100 text-orange-700",
  MATERNITY:   "bg-pink-100 text-pink-700",
  PATERNITY:   "bg-indigo-100 text-indigo-700",
  BEREAVEMENT: "bg-gray-100 text-gray-700",
  OTHER:       "bg-slate-100 text-slate-700",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING:  "bg-yellow-50 text-yellow-700 border-yellow-200",
  APPROVED: "bg-green-50 text-green-700 border-green-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
  DRAFT:    "bg-gray-50 text-gray-600 border-gray-200",
  PAID:     "bg-emerald-50 text-emerald-700 border-emerald-200",
  ACTIVE:   "bg-green-50 text-green-700 border-green-200",
  INACTIVE: "bg-gray-50 text-gray-500 border-gray-200",
  RESIGNED: "bg-red-50 text-red-600 border-red-200",
};

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
          <p className="text-xl font-bold text-gray-900 leading-tight">{value}</p>
          {sub && <p className="text-xs text-gray-400">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function HrAnalyticsPage() {
  const [data, setData]         = useState<ReportsData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/admin/reports");
      const json = await res.json() as { success: boolean; data: ReportsData };
      if (json.success) {
        setData(json.data);
        setLastSync(new Date());
      }
    } catch {
      // non-fatal
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const activeCount   = data?.headcount.find((h) => h.status === "ACTIVE")?.count ?? 0;
  const totalLeave    = data?.leaveByType.reduce((s, r) => s + r.days, 0) ?? 0;
  const latestRun     = data?.payrollRuns[0];
  const presentCount  = data?.attendanceThisMonth.find((a) => a.status === "PRESENT")?.count ?? 0;

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">HR Analytics</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {data ? `${data.year} · ` : ""}
              {lastSync ? `Updated ${lastSync.toLocaleTimeString()}` : "Loading…"}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {loading && !data ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : data ? (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={Users} label="Active Employees" value={activeCount}
                sub="currently on roster" color="bg-blue-100 text-blue-600"
              />
              <StatCard
                icon={CalendarDays} label="Leave Days Used" value={totalLeave}
                sub={`approved in ${data.year}`} color="bg-purple-100 text-purple-600"
              />
              <StatCard
                icon={DollarSign} label="Latest Payroll Net"
                value={latestRun ? fmtPeso(latestRun.totalNet) : "—"}
                sub={latestRun?.runNumber} color="bg-emerald-100 text-emerald-600"
              />
              <StatCard
                icon={TrendingUp} label="Attendance This Month" value={presentCount}
                sub="present logs" color="bg-orange-100 text-orange-600"
              />
            </div>

            {/* Leave charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* By type */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <CalendarDays className="h-4 w-4 text-gray-400" />
                  <h2 className="font-semibold text-gray-900 text-sm">
                    Leave by Type ({data.year})
                  </h2>
                </div>
                {data.leaveByType.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">No approved leave yet</p>
                ) : (
                  <div className="space-y-3">
                    {[...data.leaveByType].sort((a, b) => b.days - a.days).map((r) => {
                      const max   = Math.max(...data.leaveByType.map((x) => x.days), 1);
                      const width = Math.round((r.days / max) * 100);
                      return (
                        <div key={r.leaveType} className="flex items-center gap-3">
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full w-20 text-center shrink-0 ${LEAVE_COLORS[r.leaveType] ?? "bg-gray-100 text-gray-600"}`}>
                            {capitalize(r.leaveType)}
                          </span>
                          <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all"
                              style={{ width: `${width}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600 w-16 text-right shrink-0">
                            {r.days}d · {r.requests}req
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* By status */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="h-4 w-4 text-gray-400" />
                  <h2 className="font-semibold text-gray-900 text-sm">
                    Leave Status ({data.year})
                  </h2>
                </div>
                {data.leaveByStatus.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">No leave requests yet</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {data.leaveByStatus.map((r) => (
                      <div
                        key={r.status}
                        className={`rounded-xl border px-4 py-3 ${STATUS_COLORS[r.status] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}
                      >
                        <p className="text-2xl font-bold leading-tight">{r.requests}</p>
                        <p className="text-xs font-medium mt-0.5">{capitalize(r.status)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Payroll table */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="h-4 w-4 text-gray-400" />
                <h2 className="font-semibold text-gray-900 text-sm">Recent Payroll Runs</h2>
              </div>
              {data.payrollRuns.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No payroll runs yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left text-xs font-medium text-gray-500 pb-2 pr-4">Run</th>
                        <th className="text-left text-xs font-medium text-gray-500 pb-2 pr-4">Period</th>
                        <th className="text-right text-xs font-medium text-gray-500 pb-2 pr-4">Employees</th>
                        <th className="text-right text-xs font-medium text-gray-500 pb-2 pr-4">Gross</th>
                        <th className="text-right text-xs font-medium text-gray-500 pb-2">Net</th>
                        <th className="text-right text-xs font-medium text-gray-500 pb-2 pl-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {data.payrollRuns.map((r) => (
                        <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-2.5 pr-4 font-medium text-gray-900">{r.runNumber}</td>
                          <td className="py-2.5 pr-4 text-gray-500 text-xs">
                            {fmtDate(r.periodStart)} – {fmtDate(r.periodEnd)}
                          </td>
                          <td className="py-2.5 pr-4 text-right text-gray-700">{r.lineCount}</td>
                          <td className="py-2.5 pr-4 text-right text-gray-700">{fmtPeso(r.totalGross)}</td>
                          <td className="py-2.5 text-right font-semibold text-gray-900">{fmtPeso(r.totalNet)}</td>
                          <td className="py-2.5 pl-4 text-right">
                            <span className={`inline-flex text-[10px] font-medium px-2 py-0.5 rounded-full border ${STATUS_COLORS[r.status] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
                              {capitalize(r.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Headcount */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-4 w-4 text-gray-400" />
                <h2 className="font-semibold text-gray-900 text-sm">Workforce Headcount</h2>
              </div>
              <div className="flex flex-wrap gap-3">
                {data.headcount.map((r) => (
                  <div
                    key={r.status}
                    className={`rounded-xl border px-5 py-3 ${STATUS_COLORS[r.status] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}
                  >
                    <p className="text-2xl font-bold leading-tight">{r.count}</p>
                    <p className="text-xs font-medium mt-0.5">{capitalize(r.status)}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </AdminLayout>
  );
}
