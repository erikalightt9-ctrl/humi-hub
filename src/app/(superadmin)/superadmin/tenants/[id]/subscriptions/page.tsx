"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CreditCard,
  Plus,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SubscriptionStatus = "PENDING" | "ACTIVE" | "PAST_DUE" | "EXPIRED" | "CANCELLED";
type TenantPlan = "TRIAL" | "STARTER" | "PROFESSIONAL" | "ENTERPRISE";

interface Subscription {
  id: string;
  plan: TenantPlan;
  status: SubscriptionStatus;
  periodStart: string;
  periodEnd: string;
  amountCents: number;
  currency: string;
  paymentMethod: string | null;
  paymentRef: string | null;
  paidAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_STYLES: Record<SubscriptionStatus, { bg: string; text: string; icon: React.ReactNode }> = {
  PENDING:   { bg: "bg-amber-50",   text: "text-amber-700",  icon: <Clock className="h-3 w-3" /> },
  ACTIVE:    { bg: "bg-emerald-50", text: "text-emerald-700",icon: <CheckCircle2 className="h-3 w-3" /> },
  PAST_DUE:  { bg: "bg-orange-50",  text: "text-orange-700", icon: <AlertCircle className="h-3 w-3" /> },
  EXPIRED:   { bg: "bg-slate-100",  text: "text-slate-600",  icon: <XCircle className="h-3 w-3" /> },
  CANCELLED: { bg: "bg-red-50",     text: "text-red-600",    icon: <XCircle className="h-3 w-3" /> },
};

const PLAN_BADGE: Record<TenantPlan, string> = {
  TRIAL:        "bg-amber-100 text-amber-700",
  STARTER:      "bg-blue-100 text-blue-700",
  PROFESSIONAL: "bg-purple-100 text-purple-700",
  ENTERPRISE:   "bg-emerald-100 text-emerald-700",
};

const PLAN_PRICES: Record<TenantPlan, number> = {
  TRIAL: 0,
  STARTER: 4900,
  PROFESSIONAL: 12900,
  ENTERPRISE: 29900,
};

function formatMoney(cents: number, currency = "PHP") {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency }).format(cents / 100);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ---------------------------------------------------------------------------
// New Subscription Form
// ---------------------------------------------------------------------------

function NewSubscriptionForm({
  tenantId,
  onCreated,
  onCancel,
}: {
  tenantId: string;
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [plan, setPlan] = useState<TenantPlan>("STARTER");
  const [periodStart, setPeriodStart] = useState(() => new Date().toISOString().slice(0, 10));
  const [periodEnd, setPeriodEnd] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [amountCents, setAmountCents] = useState(PLAN_PRICES.STARTER);
  const [currency, setCurrency] = useState("PHP");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handlePlanChange(p: TenantPlan) {
    setPlan(p);
    setAmountCents(PLAN_PRICES[p]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/superadmin/tenants/${tenantId}/subscriptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          periodStart: new Date(periodStart).toISOString(),
          periodEnd: new Date(periodEnd).toISOString(),
          amountCents,
          currency,
          paymentMethod: paymentMethod.trim() || null,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Failed to create subscription.");
        return;
      }
      onCreated();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
      <h3 className="font-semibold text-slate-800 flex items-center gap-2">
        <Plus className="h-4 w-4" />
        New Subscription
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Plan *</Label>
          <select
            value={plan}
            onChange={(e) => handlePlanChange(e.target.value as TenantPlan)}
            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="TRIAL">Trial (free)</option>
            <option value="STARTER">Starter</option>
            <option value="PROFESSIONAL">Professional</option>
            <option value="ENTERPRISE">Enterprise</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label>Currency</Label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="PHP">PHP</option>
            <option value="USD">USD</option>
            <option value="SGD">SGD</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1">
          <Label>Period Start *</Label>
          <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label>Period End *</Label>
          <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label>Amount ({currency})</Label>
          <Input
            type="number"
            value={amountCents / 100}
            onChange={(e) => setAmountCents(Math.round(parseFloat(e.target.value) * 100) || 0)}
            min={0}
            step={0.01}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label>Payment Method (optional)</Label>
        <Input
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          placeholder="GCash, Bank Transfer, Card…"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={saving} className="gap-1.5">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Create Subscription
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Status action buttons
// ---------------------------------------------------------------------------

function SubscriptionActions({
  sub,
  tenantId,
  onRefresh,
}: {
  sub: Subscription;
  tenantId: string;
  onRefresh: () => void;
}) {
  const [loading, setLoading] = useState(false);

  async function transition(newStatus: "ACTIVE" | "CANCELLED") {
    setLoading(true);
    try {
      await fetch(`/api/superadmin/tenants/${tenantId}/subscriptions/${sub.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_status", status: newStatus }),
      });
      onRefresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-1">
      {sub.status === "PENDING" && (
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs gap-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
          onClick={() => transition("ACTIVE")}
          disabled={loading}
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
          Activate
        </Button>
      )}
      {(sub.status === "PENDING" || sub.status === "ACTIVE") && (
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs gap-1 text-red-500 border-red-200 hover:bg-red-50"
          onClick={() => transition("CANCELLED")}
          disabled={loading}
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
          Cancel
        </Button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TenantSubscriptionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [tenantName, setTenantName] = useState("");

  async function loadData() {
    setLoading(true);
    try {
      const [subRes, tenantRes] = await Promise.all([
        fetch(`/api/superadmin/tenants/${id}/subscriptions`),
        fetch(`/api/superadmin/tenants/${id}`),
      ]);
      const subJson = await subRes.json();
      const tenantJson = await tenantRes.json();

      if (subJson.success) {
        setSubscriptions(subJson.data.data);
        setTotal(subJson.data.total);
      }
      if (tenantJson.success) {
        setTenantName(tenantJson.data.name);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, [id]);

  // Revenue summary
  const totalRevenue = subscriptions
    .filter((s) => s.status === "ACTIVE" || s.paidAt)
    .reduce((sum, s) => sum + s.amountCents, 0);

  const activeSubscription = subscriptions.find((s) => s.status === "ACTIVE");

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/superadmin/tenants/${id}`} className="text-slate-400 hover:text-slate-700 transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Subscriptions</h1>
            <p className="text-sm text-slate-500 mt-0.5">{tenantName}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadData} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setShowNewForm(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            New Subscription
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-400">Total Subscriptions</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{total}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-400">Current Plan</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {activeSubscription ? (
              <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${PLAN_BADGE[activeSubscription.plan]}`}>
                {activeSubscription.plan}
              </span>
            ) : "—"}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-400">Total Revenue</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{formatMoney(totalRevenue)}</p>
        </div>
      </div>

      {/* New subscription form */}
      {showNewForm && (
        <NewSubscriptionForm
          tenantId={id}
          onCreated={() => { setShowNewForm(false); loadData(); }}
          onCancel={() => setShowNewForm(false)}
        />
      )}

      {/* Subscriptions table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
          <CreditCard className="h-4 w-4 text-slate-400" />
          <h2 className="font-semibold text-slate-800">Subscription History</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No subscriptions yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left">
                <th className="px-4 py-3 font-medium text-slate-500">Plan</th>
                <th className="px-4 py-3 font-medium text-slate-500">Status</th>
                <th className="px-4 py-3 font-medium text-slate-500">Period</th>
                <th className="px-4 py-3 font-medium text-slate-500 text-right">Amount</th>
                <th className="px-4 py-3 font-medium text-slate-500">Method</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {subscriptions.map((sub) => {
                const s = STATUS_STYLES[sub.status];
                return (
                  <tr key={sub.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PLAN_BADGE[sub.plan]}`}>
                        {sub.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>
                        {s.icon}
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">
                      {formatDate(sub.periodStart)} → {formatDate(sub.periodEnd)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">
                      {formatMoney(sub.amountCents, sub.currency)}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {sub.paymentMethod ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <SubscriptionActions sub={sub} tenantId={id} onRefresh={loadData} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
