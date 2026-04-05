"use client";

import { useEffect, useState } from "react";
import { Loader2, AlertCircle, Plus, Landmark } from "lucide-react";
import Link from "next/link";

interface BankAccount {
  id: string;
  name: string;
  bankName: string;
  accountNumber: string;
  balance: number;
  matchedCount: number;
  unmatchedCount: number;
}

const fmt = (n: number) => `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

const EMPTY_FORM = { name: "", bankName: "", accountNumber: "", openingBalance: "" };

export default function BankPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const res = await fetch("/api/admin/accounting/bank-accounts");
      if (!res.ok) throw new Error("Failed to load bank accounts");
      const d = await res.json();
      setAccounts(d.data ?? d ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.name || !form.bankName || !form.accountNumber) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/accounting/bank-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          bankName: form.bankName,
          accountNumber: form.accountNumber,
          openingBalance: parseFloat(form.openingBalance) || 0,
        }),
      });
      if (!res.ok) throw new Error("Failed to add bank account");
      setForm(EMPTY_FORM);
      setShowForm(false);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  const maskAccount = (num: string) => {
    if (num.length <= 4) return num;
    return "•".repeat(num.length - 4) + num.slice(-4);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 text-emerald-600 animate-spin" /></div>;
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Bank Accounts</h1>
          <p className="text-sm text-slate-500 mt-1">{accounts.length} accounts</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Add Bank Account
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          <AlertCircle className="h-5 w-5 flex-shrink-0" /><span>{error}</span>
        </div>
      )}

      {/* Inline Add Form */}
      {showForm && (
        <div className="bg-white border border-emerald-200 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-700">Add Bank Account</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Account Name *</label>
              <input
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Main Operations Account"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Bank Name *</label>
              <input
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                placeholder="e.g. BDO"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Account Number *</label>
              <input
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                placeholder="Account number"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Opening Balance</label>
              <input
                type="number" min="0" step="0.01"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={form.openingBalance} onChange={(e) => setForm({ ...form, openingBalance: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50">
              {saving && <Loader2 className="h-3 w-3 animate-spin" />}Save
            </button>
            <button onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
              className="px-4 py-2 text-sm border border-slate-300 rounded-lg text-slate-600">Cancel</button>
          </div>
        </div>
      )}

      {/* Account Cards */}
      {accounts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <Landmark className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No bank accounts added yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc) => (
            <div key={acc.id} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{acc.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{acc.bankName}</p>
                </div>
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <Landmark className="h-4 w-4 text-emerald-600" />
                </div>
              </div>
              <p className="text-xs font-mono text-slate-500">{maskAccount(acc.accountNumber)}</p>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Balance</p>
                <p className="text-lg font-bold text-emerald-700">{fmt(acc.balance)}</p>
              </div>
              <div className="flex gap-4 text-xs text-slate-500">
                <span><span className="font-medium text-emerald-600">{acc.matchedCount}</span> matched</span>
                <span><span className="font-medium text-amber-600">{acc.unmatchedCount}</span> unmatched</span>
              </div>
              <Link
                href={`/admin/accounting/bank/${acc.id}`}
                className="block text-center text-sm text-emerald-600 border border-emerald-200 rounded-lg py-2 hover:bg-emerald-50 transition-colors"
              >
                Reconcile
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
