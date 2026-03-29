"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DollarSign,
  TrendingUp,
  Clock,
  Users,
  Search,
  Plus,
  X,
  Loader2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  BarChart2,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface DashboardData {
  totalRevenue:    number;
  thisMonth:       number;
  pendingAmount:   number;
  paidEnrollments: number;
  chartData:       Array<{ month: string; revenue: number }>;
  topCourses:      Array<{ title: string; total: number }>;
}

interface Payment {
  id:              string;
  studentName:     string;
  studentEmail:    string;
  courseTitle:     string;
  courseTier:      string;
  currency:        string;
  amount:          number;
  method:          string;
  status:          "PAID" | "PENDING_PAYMENT" | "FAILED" | "REFUNDED";
  referenceNumber: string | null;
  paidAt:          string | null;
  createdAt:       string;
}

interface Enrollment {
  id:       string;
  fullName: string;
  email:    string;
  course:   { title: string };
}

type StatusFilter = "ALL" | "PAID" | "PENDING_PAYMENT" | "FAILED" | "REFUNDED";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STATUS_TABS: Array<{ value: StatusFilter; label: string }> = [
  { value: "ALL",             label: "All" },
  { value: "PAID",            label: "Paid" },
  { value: "PENDING_PAYMENT", label: "Pending" },
  { value: "FAILED",          label: "Failed" },
  { value: "REFUNDED",        label: "Refunded" },
];

const STATUS_STYLES: Record<string, string> = {
  PAID:            "bg-green-50 text-green-700",
  PENDING_PAYMENT: "bg-amber-50 text-amber-700",
  FAILED:          "bg-red-50 text-red-700",
  REFUNDED:        "bg-gray-100 text-gray-500",
};

const PAYMENT_METHODS = ["Bank Transfer", "GCash", "Maya", "Cash", "Stripe", "PayMongo", "Other"];

function fmt(n: number, currency = "PHP") {
  return new Intl.NumberFormat("en-PH", {
    style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(n);
}

function fmtMonth(key: string) {
  const [year, month] = key.split("-");
  return new Date(Number(year), Number(month) - 1).toLocaleString("default", {
    month: "short", year: "2-digit",
  });
}

/* ------------------------------------------------------------------ */
/*  Mini bar chart                                                     */
/* ------------------------------------------------------------------ */

function RevenueChart({ data }: { data: Array<{ month: string; revenue: number }> }) {
  const max = Math.max(...data.map((d) => d.revenue), 1);
  return (
    <div className="flex items-end gap-2 h-28">
      {data.map(({ month, revenue }) => (
        <div key={month} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[9px] text-gray-400 font-medium">
            {revenue > 0 ? fmt(revenue).replace(/[₱,]/g, "").replace("PHP", "") : ""}
          </span>
          <div className="w-full relative">
            <div
              className="w-full rounded-t-sm bg-blue-500 transition-all duration-500"
              style={{ height: `${Math.max((revenue / max) * 80, revenue > 0 ? 4 : 1)}px` }}
            />
          </div>
          <span className="text-[9px] text-gray-400">{fmtMonth(month)}</span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  KPI Card                                                           */
/* ------------------------------------------------------------------ */

function KpiCard({
  label, value, sub, icon: Icon, color,
}: {
  label: string; value: string; sub?: string;
  icon: React.ComponentType<{ className?: string }>; color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4">
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-xl font-bold text-gray-900 mt-0.5 truncate">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Record Payment Modal                                               */
/* ------------------------------------------------------------------ */

function RecordPaymentModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [enrollSearch, setEnrollSearch] = useState("");
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const [enrollmentId, setEnrollmentId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState(PAYMENT_METHODS[0]);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [markAsPaid, setMarkAsPaid] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enrollSearch.trim()) { setEnrollments([]); return; }
    setLoadingEnrollments(true);
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/admin/enrollees?search=${encodeURIComponent(enrollSearch)}&limit=10`);
        const json = await r.json();
        if (json.success) setEnrollments(json.data ?? []);
      } finally {
        setLoadingEnrollments(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [enrollSearch]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!enrollmentId) { setError("Please select an enrollment"); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/revenue/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enrollmentId,
          amount: parseFloat(amount),
          method,
          referenceNumber: referenceNumber || undefined,
          notes: notes || undefined,
          markAsPaid,
        }),
      });
      const json = await res.json();
      if (!json.success) { setError(json.error ?? "Failed to record"); return; }
      onSaved();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const selectedEnrollment = enrollments.find((e) => e.id === enrollmentId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Record Payment</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* Enrollment search */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-600">Student / Enrollment *</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                value={enrollSearch}
                onChange={(e) => { setEnrollSearch(e.target.value); setEnrollmentId(""); }}
                placeholder="Search by name or email…"
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {loadingEnrollments && (
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Searching…
              </p>
            )}
            {enrollments.length > 0 && !enrollmentId && (
              <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm max-h-40 overflow-y-auto">
                {enrollments.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => { setEnrollmentId(e.id); setEnrollSearch(e.fullName); setEnrollments([]); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 border-b border-gray-50 last:border-0"
                  >
                    <span className="font-medium text-gray-800">{e.fullName}</span>
                    <span className="text-gray-400 ml-2 text-xs">{e.course.title}</span>
                  </button>
                ))}
              </div>
            )}
            {selectedEnrollment && (
              <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-lg">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                {selectedEnrollment.fullName} — {selectedEnrollment.course.title}
              </div>
            )}
          </div>

          {/* Amount + Method */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-600">Amount *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                placeholder="0.00"
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-600">Method *</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Reference */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-600">Reference Number</label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g. TXN-123456"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-600">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Optional notes…"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Mark as paid toggle */}
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={markAsPaid}
              onChange={(e) => setMarkAsPaid(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-700 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Mark as paid immediately</span>
          </label>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white bg-[#1E3A8A] hover:bg-[#1e40af] transition-colors disabled:opacity-70"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? "Saving…" : "Record Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function TenantRevenueClient() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [payments, setPayments]   = useState<Payment[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [search, setSearch]       = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loadingDash, setLoadingDash] = useState(true);
  const [loadingPay,  setLoadingPay]  = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "payments">("overview");

  const LIMIT = 20;

  const fetchDashboard = useCallback(async () => {
    setLoadingDash(true);
    try {
      const r = await fetch("/api/admin/revenue/dashboard");
      const json = await r.json();
      if (json.success) setDashboard(json.data);
    } finally {
      setLoadingDash(false);
    }
  }, []);

  const fetchPayments = useCallback(async () => {
    setLoadingPay(true);
    try {
      const params = new URLSearchParams({
        page:  String(page),
        limit: String(LIMIT),
        ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
        ...(search ? { search } : {}),
      });
      const r = await fetch(`/api/admin/revenue/payments?${params}`);
      const json = await r.json();
      if (json.success) { setPayments(json.data); setTotal(json.total); }
    } finally {
      setLoadingPay(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => { void fetchDashboard(); }, [fetchDashboard]);
  useEffect(() => { void fetchPayments();  }, [fetchPayments]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-50 rounded-lg p-2">
            <DollarSign className="h-5 w-5 text-blue-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Revenue</h1>
            <p className="text-sm text-gray-500">Track and manage your enrollment income.</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#1E3A8A] hover:bg-[#1e40af] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Record Payment
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {(["overview", "payments"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-5 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
              activeTab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "overview" ? "Overview" : "Payments"}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ── */}
      {activeTab === "overview" && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiCard
              label="Total Revenue"
              value={loadingDash ? "—" : fmt(dashboard?.totalRevenue ?? 0)}
              sub="All paid enrollments"
              icon={DollarSign}
              color="bg-blue-50 text-blue-700"
            />
            <KpiCard
              label="This Month"
              value={loadingDash ? "—" : fmt(dashboard?.thisMonth ?? 0)}
              sub={new Date().toLocaleString("default", { month: "long", year: "numeric" })}
              icon={TrendingUp}
              color="bg-emerald-50 text-emerald-700"
            />
            <KpiCard
              label="Pending"
              value={loadingDash ? "—" : fmt(dashboard?.pendingAmount ?? 0)}
              sub="Awaiting payment"
              icon={Clock}
              color="bg-amber-50 text-amber-700"
            />
            <KpiCard
              label="Paid Enrollments"
              value={loadingDash ? "—" : String(dashboard?.paidEnrollments ?? 0)}
              sub="Students fully paid"
              icon={Users}
              color="bg-purple-50 text-purple-700"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Monthly chart */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-5">
                <BarChart2 className="h-4 w-4 text-blue-600" />
                <h2 className="font-semibold text-gray-900 text-sm">Monthly Revenue</h2>
                <span className="text-xs text-gray-400 ml-1">Last 6 months</span>
              </div>
              {loadingDash ? (
                <div className="h-28 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                </div>
              ) : (
                <RevenueChart data={dashboard?.chartData ?? []} />
              )}
            </div>

            {/* Top courses */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 text-sm mb-4">Top Courses</h2>
              {loadingDash ? (
                <div className="flex items-center justify-center h-24">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                </div>
              ) : (dashboard?.topCourses ?? []).length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No data yet</p>
              ) : (
                <div className="space-y-3">
                  {(dashboard?.topCourses ?? []).map(({ title, total: t }, i) => {
                    const max = dashboard?.topCourses[0]?.total ?? 1;
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-700 truncate max-w-[140px]">{title}</span>
                          <span className="font-semibold text-gray-900">{fmt(t)}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all"
                            style={{ width: `${(t / max) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Payments Tab ── */}
      {activeTab === "payments" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search student, course…"
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1 flex-wrap">
              {STATUS_TABS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => { setStatusFilter(value); setPage(1); }}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                    statusFilter === value
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-5 py-3 font-semibold text-gray-600 text-xs">Student</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Course</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Method</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs">Amount</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600 text-xs">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Ref #</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loadingPay ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-400 mx-auto" />
                      </td>
                    </tr>
                  ) : payments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-sm text-gray-400">
                        No payments found
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-gray-900">{p.studentName}</p>
                          <p className="text-xs text-gray-400">{p.studentEmail}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-gray-700 truncate max-w-[160px]">{p.courseTitle}</p>
                          <p className="text-xs text-gray-400 capitalize">{p.courseTier.toLowerCase()}</p>
                        </td>
                        <td className="px-4 py-3.5 text-gray-600">{p.method}</td>
                        <td className="px-4 py-3.5 text-right font-semibold text-gray-900">
                          {fmt(p.amount, p.currency)}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[p.status] ?? "bg-gray-100 text-gray-500"}`}>
                            {p.status === "PENDING_PAYMENT" ? "Pending" : p.status.charAt(0) + p.status.slice(1).toLowerCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-gray-500 text-xs font-mono">
                          {p.referenceNumber ?? "—"}
                        </td>
                        <td className="px-4 py-3.5 text-gray-400 text-xs">
                          {new Date(p.paidAt ?? p.createdAt).toLocaleDateString("en-PH", {
                            month: "short", day: "numeric", year: "numeric",
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
                </p>
                <div className="flex gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showModal && (
        <RecordPaymentModal
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            void fetchDashboard();
            void fetchPayments();
          }}
        />
      )}
    </div>
  );
}
