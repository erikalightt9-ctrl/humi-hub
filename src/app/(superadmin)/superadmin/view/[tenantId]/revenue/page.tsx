"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import { DollarSign, Clock, CheckCircle2, AlertCircle } from "lucide-react";

interface Payment {
  id: string;
  amount: string | number;
  status: string;
  method: string;
  createdAt: string;
  paidAt: string | null;
  enrollment: {
    fullName: string;
    email: string;
    course: { title: string };
  };
}

interface RevenueData {
  totalPaid: string | number;
  totalPending: string | number;
  recentPayments: Payment[];
}

interface PageProps {
  readonly params: Promise<{ tenantId: string }>;
}

const STATUS_BADGE: Record<string, string> = {
  PAID: "bg-emerald-100 text-emerald-700",
  PENDING_PAYMENT: "bg-amber-100 text-amber-700",
  FAILED: "bg-red-100 text-red-700",
  REFUNDED: "bg-slate-100 text-slate-600",
};

function formatAmount(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(num) ? "0.00" : num.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function TenantViewRevenue({ params }: PageProps) {
  const { tenantId } = use(params);
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/superadmin/view/${tenantId}/revenue`)
      .then((r) => r.json())
      .then((res: { success: boolean; data: RevenueData; error: string }) => {
        if (res.success) {
          setData(res.data);
        } else {
          setError(res.error ?? "Failed to load revenue data");
        }
      })
      .catch(() => setError("Network error — could not load revenue data"))
      .finally(() => setLoading(false));
  }, [tenantId]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-48" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-28 bg-slate-200 rounded-xl" />
          <div className="h-28 bg-slate-200 rounded-xl" />
        </div>
        <div className="h-64 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-sm font-semibold text-red-700">Error loading revenue</p>
        <p className="text-xs text-red-500 mt-1">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const { totalPaid, totalPending, recentPayments } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Revenue</h1>
        <p className="text-sm text-slate-500 mt-1">Payment overview for this tenant</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-slate-500">Total Revenue</p>
            <span className="p-2 rounded-lg bg-emerald-50">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            ₱{formatAmount(totalPaid)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Paid payments</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-slate-500">Pending</p>
            <span className="p-2 rounded-lg bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            ₱{formatAmount(totalPending)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Awaiting payment</p>
        </div>
      </div>

      {/* Recent payments */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-700">Recent Payments</h2>
        </div>

        {recentPayments.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No payments found for this tenant.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-5 py-3 font-medium text-slate-500">Student</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Course</th>
                <th className="text-right px-5 py-3 font-medium text-slate-500">Amount</th>
                <th className="text-center px-5 py-3 font-medium text-slate-500">Status</th>
                <th className="text-right px-5 py-3 font-medium text-slate-500">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentPayments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900">{p.enrollment.fullName}</p>
                    <p className="text-xs text-slate-400">{p.enrollment.email}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-600 text-xs">
                    {p.enrollment.course.title}
                  </td>
                  <td className="px-5 py-3 text-right font-medium text-slate-900">
                    ₱{formatAmount(p.amount)}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        STATUS_BADGE[p.status] ?? "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {p.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-slate-400 text-xs">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
