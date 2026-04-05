"use client";

import { useEffect, useState } from "react";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface AccountOption { id: string; code: string; name: string; }

const CATEGORIES = [
  "Office Supplies", "Travel", "Meals & Entertainment", "Utilities",
  "Rent", "Software", "Hardware", "Marketing", "Professional Services",
  "Insurance", "Repairs & Maintenance", "Other",
];

export default function NewExpensePage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [form, setForm] = useState({
    vendor: "",
    description: "",
    category: "",
    amount: "",
    taxAmount: "",
    date: new Date().toISOString().split("T")[0],
    receiptUrl: "",
    accountId: "",
    paymentAccountId: "",
  });
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/accounting/accounts")
      .then((r) => r.json())
      .then((d) => setAccounts(d.data ?? d ?? []))
      .catch(() => {});
  }, []);

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const validate = () => {
    if (!form.vendor || !form.description || !form.category || !form.amount || !form.date) {
      setError("Vendor, description, category, amount, and date are required");
      return false;
    }
    return true;
  };

  const save = async (status: "DRAFT" | "SUBMITTED") => {
    if (!validate()) return;
    const setter = status === "DRAFT" ? setSaving : setSubmitting;
    setter(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/accounting/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor: form.vendor,
          description: form.description,
          category: form.category,
          amount: parseFloat(form.amount),
          taxAmount: parseFloat(form.taxAmount) || 0,
          date: form.date,
          receiptUrl: form.receiptUrl || undefined,
          accountId: form.accountId || undefined,
          paymentAccountId: form.paymentAccountId || undefined,
          status,
        }),
      });
      if (!res.ok) throw new Error("Failed to save expense");
      const data = await res.json();
      const id = data.data?.id ?? data.id;
      router.push(`/admin/accounting/expenses/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setter(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/accounting/expenses" className="text-slate-400 hover:text-slate-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">New Expense</h1>
          <p className="text-sm text-slate-500 mt-0.5">Submit an expense for approval</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Vendor *</label>
            <input
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={form.vendor} onChange={(e) => update("vendor", e.target.value)}
              placeholder="Vendor name"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Category *</label>
            <select
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={form.category} onChange={(e) => update("category", e.target.value)}
            >
              <option value="">Select category</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-slate-500 mb-1">Description *</label>
            <input
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={form.description} onChange={(e) => update("description", e.target.value)}
              placeholder="Expense description"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Amount *</label>
            <input
              type="number" min="0" step="0.01"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={form.amount} onChange={(e) => update("amount", e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Tax Amount</label>
            <input
              type="number" min="0" step="0.01"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={form.taxAmount} onChange={(e) => update("taxAmount", e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Date *</label>
            <input
              type="date"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={form.date} onChange={(e) => update("date", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Receipt URL (optional)</label>
            <input
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={form.receiptUrl} onChange={(e) => update("receiptUrl", e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Expense Account (optional)</label>
            <select
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={form.accountId} onChange={(e) => update("accountId", e.target.value)}
            >
              <option value="">Select account</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Payment Account (optional)</label>
            <select
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={form.paymentAccountId} onChange={(e) => update("paymentAccountId", e.target.value)}
            >
              <option value="">Select account</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => save("DRAFT")}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2 border border-slate-300 text-slate-700 text-sm rounded-lg hover:bg-slate-50 disabled:opacity-50"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}Save Draft
        </button>
        <button
          onClick={() => save("SUBMITTED")}
          disabled={submitting}
          className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}Submit for Approval
        </button>
        <button
          onClick={() => router.back()}
          className="px-5 py-2 text-sm text-slate-500 hover:text-slate-700"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
