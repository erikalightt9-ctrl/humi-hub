"use client";

import { useEffect, useState, useCallback } from "react";
import {
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Pencil,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type FilterTab = "all" | "pending" | "approved" | "rejected";
type Plan = "TRIAL" | "STARTER" | "PROFESSIONAL" | "ENTERPRISE";

interface TenantSubscription {
  id: string;
  tenantId: string;
  tenantName: string;
  tenantEmail: string;
  plan: Plan;
  status: string;
  normalizedStatus: "pending" | "approved" | "rejected";
  amountCents: number;
  currency: string;
  periodStart: string;
  periodEnd: string;
  paymentMethod: string | null;
  paymentRef: string | null;
  paidAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
}

interface FinancialStats {
  pendingCount: number;
  approvedThisMonth: number;
  rejectedThisMonth: number;
  totalRevenueThisMonth: number;
}

interface ApiResponse {
  success: boolean;
  data: { stats: FinancialStats; subscriptions: TenantSubscription[] };
  meta: { total: number; page: number; limit: number };
}

const TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

const PLANS: Plan[] = ["TRIAL", "STARTER", "PROFESSIONAL", "ENTERPRISE"];

const PLAN_COLORS: Record<Plan, string> = {
  TRIAL: "bg-amber-50 text-amber-700 border-amber-200",
  STARTER: "bg-blue-50 text-blue-700 border-blue-200",
  PROFESSIONAL: "bg-purple-50 text-purple-700 border-purple-200",
  ENTERPRISE: "bg-indigo-50 text-indigo-700 border-indigo-200",
};

function formatAmount(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: currency === "PHP" ? "PHP" : "USD",
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

function toDateInput(iso: string): string {
  return iso.slice(0, 10);
}

function StatusBadge({ status }: { status: "pending" | "approved" | "rejected" }) {
  const styles = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rejected: "bg-red-50 text-red-700 border-red-200",
  };
  const labels = { pending: "Pending", approved: "Approved", rejected: "Rejected" };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Edit Drawer                                                         */
/* ------------------------------------------------------------------ */

interface EditForm {
  plan: Plan;
  amountCents: number;
  currency: string;
  periodStart: string;
  periodEnd: string;
  paymentMethod: string;
  paymentRef: string;
}

interface EditDrawerProps {
  subscription: TenantSubscription;
  onSave: (form: EditForm) => Promise<void>;
  onClose: () => void;
  saving: boolean;
}

function EditDrawer({ subscription, onSave, onClose, saving }: EditDrawerProps) {
  const [form, setForm] = useState<EditForm>({
    plan: subscription.plan,
    amountCents: subscription.amountCents,
    currency: subscription.currency,
    periodStart: toDateInput(subscription.periodStart),
    periodEnd: toDateInput(subscription.periodEnd),
    paymentMethod: subscription.paymentMethod ?? "",
    paymentRef: subscription.paymentRef ?? "",
  });

  function set<K extends keyof EditForm>(key: K, value: EditForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Edit Subscription</h2>
            <p className="text-xs text-slate-500 mt-0.5">{subscription.tenantName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Fields */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {/* Plan */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
              Plan
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PLANS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => set("plan", p)}
                  className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                    form.plan === p
                      ? PLAN_COLORS[p] + " border"
                      : "border-slate-200 text-slate-500 hover:border-slate-300"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
              Amount
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                  {form.currency}
                </span>
                <input
                  type="number"
                  min={0}
                  step={100}
                  className="w-full border border-slate-200 rounded-lg pl-12 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  value={form.amountCents / 100}
                  onChange={(e) => set("amountCents", Math.round(parseFloat(e.target.value || "0") * 100))}
                />
              </div>
              <select
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                value={form.currency}
                onChange={(e) => set("currency", e.target.value)}
              >
                <option value="PHP">PHP</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          {/* Period */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Period Start
              </label>
              <input
                type="date"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                value={form.periodStart}
                onChange={(e) => set("periodStart", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Period End
              </label>
              <input
                type="date"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                value={form.periodEnd}
                onChange={(e) => set("periodEnd", e.target.value)}
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
              Payment Method
            </label>
            <select
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              value={form.paymentMethod}
              onChange={(e) => set("paymentMethod", e.target.value)}
            >
              <option value="">— None —</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="gcash">GCash</option>
              <option value="paymongo">PayMongo</option>
              <option value="stripe">Stripe</option>
              <option value="manual">Manual</option>
            </select>
          </div>

          {/* Reference */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
              Payment Reference
            </label>
            <input
              type="text"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="e.g. TXN-123456"
              value={form.paymentRef}
              onChange={(e) => set("paymentRef", e.target.value)}
              maxLength={200}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-200 flex gap-3">
          <Button variant="outline" size="sm" className="flex-1" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
            onClick={() => onSave(form)}
            disabled={saving}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

const LIMIT = 20;

export default function FinancialControlPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>("pending");
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState<FinancialStats | null>(null);
  const [subscriptions, setSubscriptions] = useState<TenantSubscription[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<TenantSubscription | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/superadmin/financial?filter=${activeTab}&page=${page}&limit=${LIMIT}`
      );
      const json: ApiResponse = await res.json();
      if (!json.success) throw new Error("Failed to load");
      setStats(json.data.stats);
      setSubscriptions(json.data.subscriptions);
      setTotal(json.meta.total);
    } catch {
      setError("Failed to load financial data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [activeTab, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleTabChange(tab: FilterTab) {
    setActiveTab(tab);
    setPage(1);
  }

  async function patchSubscription(id: string, body: object) {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/superadmin/financial/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      await fetchData();
    } catch {
      setError("Action failed. Please try again.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleApprove(sub: TenantSubscription) {
    await patchSubscription(sub.id, { action: "approve" });
  }

  async function handleReject(sub: TenantSubscription) {
    await patchSubscription(sub.id, { action: "reject" });
  }

  async function handleSaveEdit(form: EditForm) {
    if (!editTarget) return;
    await patchSubscription(editTarget.id, {
      action: "edit",
      plan: form.plan,
      amountCents: form.amountCents,
      currency: form.currency,
      periodStart: new Date(form.periodStart).toISOString(),
      periodEnd: new Date(form.periodEnd).toISOString(),
      paymentMethod: form.paymentMethod || null,
      paymentRef: form.paymentRef || null,
    });
    setEditTarget(null);
  }

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Financial Control</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Tenant subscription revenue tracking and payment approvals
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-amber-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-amber-100 rounded-lg">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Pending
              </span>
            </div>
            <p className="text-2xl font-bold text-amber-700">{stats.pendingCount}</p>
            <p className="text-xs text-slate-400 mt-0.5">Awaiting review</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-emerald-100 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Approved
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.approvedThisMonth}</p>
            <p className="text-xs text-slate-400 mt-0.5">This month</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-red-100 rounded-lg">
                <XCircle className="h-4 w-4 text-red-500" />
              </div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Rejected
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.rejectedThisMonth}</p>
            <p className="text-xs text-slate-400 mt-0.5">This month</p>
          </div>

          <div className="bg-white rounded-xl border border-indigo-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-indigo-100 rounded-lg">
                <TrendingUp className="h-4 w-4 text-indigo-600" />
              </div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Revenue
              </span>
            </div>
            <p className="text-2xl font-bold text-indigo-700">
              {formatAmount(stats.totalRevenueThisMonth, "PHP")}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">This month</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 flex-1">{error}</p>
          <button className="text-xs text-red-600 underline" onClick={fetchData}>
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-4 pt-3 gap-0.5">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors pb-3 ${
                activeTab === tab.key
                  ? "text-indigo-700 border-b-2 border-indigo-600"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
              {tab.key === "pending" && stats && stats.pendingCount > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 text-xs bg-amber-500 text-white rounded-full">
                  {stats.pendingCount > 9 ? "9+" : stats.pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <DollarSign className="h-10 w-10 mb-3 opacity-40" />
            <p className="text-sm font-medium">No subscriptions found</p>
            <p className="text-xs mt-1">
              {activeTab === "pending" ? "All subscriptions reviewed." : "None match this filter."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Tenant
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Plan
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Amount
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Period
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Payment
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subscriptions.map((sub) => {
                  const isActioning = actionLoading === sub.id;
                  return (
                    <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{sub.tenantName}</p>
                        <p className="text-xs text-slate-400">{sub.tenantEmail}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${PLAN_COLORS[sub.plan as Plan] ?? ""}`}
                        >
                          {sub.plan}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="font-semibold text-slate-900">
                          {formatAmount(sub.amountCents, sub.currency)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-slate-600">{formatDate(sub.periodStart)}</p>
                        <p className="text-xs text-slate-400">to {formatDate(sub.periodEnd)}</p>
                      </td>
                      <td className="px-4 py-3">
                        {sub.paymentMethod ? (
                          <p className="text-xs text-slate-600 capitalize">{sub.paymentMethod}</p>
                        ) : (
                          <p className="text-xs text-slate-300">—</p>
                        )}
                        {sub.paymentRef && (
                          <p className="text-xs text-slate-400 font-mono">#{sub.paymentRef}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={sub.normalizedStatus} />
                        {sub.paidAt && (
                          <p className="text-xs text-slate-400 mt-1">{formatDate(sub.paidAt)}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {sub.normalizedStatus === "pending" && (
                            <>
                              <Button
                                size="sm"
                                className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                                onClick={() => handleApprove(sub)}
                                disabled={isActioning}
                              >
                                {isActioning ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  "Approve"
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2.5 text-red-600 border-red-200 hover:bg-red-50 text-xs"
                                onClick={() => handleReject(sub)}
                                disabled={isActioning}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 w-7 p-0 text-slate-500 hover:text-indigo-600 hover:border-indigo-300"
                            onClick={() => setEditTarget(sub)}
                            disabled={isActioning}
                            title="Edit subscription"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50">
            <p className="text-xs text-slate-500">
              Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs text-slate-700 px-2 font-medium">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Drawer */}
      {editTarget && (
        <EditDrawer
          subscription={editTarget}
          onSave={handleSaveEdit}
          onClose={() => setEditTarget(null)}
          saving={actionLoading === editTarget.id}
        />
      )}
    </div>
  );
}
