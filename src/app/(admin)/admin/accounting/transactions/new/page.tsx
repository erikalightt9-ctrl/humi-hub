"use client";

import { useEffect, useState } from "react";
import { Loader2, AlertCircle, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface AccountOption {
  id: string;
  code: string;
  name: string;
}

interface TxLine {
  accountId: string;
  description: string;
  debit: string;
  credit: string;
}

const EMPTY_LINE: TxLine = { accountId: "", description: "", debit: "", credit: "" };

const fmt = (n: number) => `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

export default function NewTransactionPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [reference, setReference] = useState("");
  const [lines, setLines] = useState<TxLine[]>([{ ...EMPTY_LINE }, { ...EMPTY_LINE }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/accounting/accounts")
      .then((r) => r.json())
      .then((d) => setAccounts(d.data ?? d ?? []))
      .catch(() => {});
  }, []);

  const totalDebits = lines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0);
  const totalCredits = lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.001 && totalDebits > 0;

  const updateLine = (idx: number, field: keyof TxLine, value: string) => {
    setLines(lines.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));
  };

  const addLine = () => setLines([...lines, { ...EMPTY_LINE }]);

  const removeLine = (idx: number) => {
    if (lines.length <= 2) return;
    setLines(lines.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!description || !date) {
      setError("Date and description are required");
      return;
    }
    if (!isBalanced) {
      setError("Transaction must be balanced (debits must equal credits)");
      return;
    }
    const validLines = lines.filter((l) => l.accountId && (parseFloat(l.debit) > 0 || parseFloat(l.credit) > 0));
    if (validLines.length < 2) {
      setError("At least 2 lines with accounts and amounts are required");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/accounting/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          description,
          reference: reference || undefined,
          lines: validLines.map((l) => ({
            accountId: l.accountId,
            description: l.description || undefined,
            debit: parseFloat(l.debit) || 0,
            credit: parseFloat(l.credit) || 0,
          })),
        }),
      });
      if (!res.ok) throw new Error("Failed to create transaction");
      const data = await res.json();
      const id = data.data?.id ?? data.id;
      router.push(`/admin/accounting/transactions/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">New Journal Entry</h1>
        <p className="text-sm text-slate-500 mt-1">Create a new double-entry transaction</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Header Fields */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Date *</label>
            <input
              type="date"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Description *</label>
            <input
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Transaction description"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Reference (optional)</label>
            <input
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. INV-001"
            />
          </div>
        </div>
      </div>

      {/* Lines */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Journal Lines</h2>
          <button
            onClick={addLine}
            className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Add Line
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500">Account</th>
              <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500">Description</th>
              <th className="text-right px-4 py-2 text-xs font-semibold text-slate-500">Debit</th>
              <th className="text-right px-4 py-2 text-xs font-semibold text-slate-500">Credit</th>
              <th className="px-2 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lines.map((line, idx) => (
              <tr key={idx}>
                <td className="px-4 py-2 w-56">
                  <select
                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    value={line.accountId}
                    onChange={(e) => updateLine(idx, "accountId", e.target.value)}
                  >
                    <option value="">Select account</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2">
                  <input
                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    value={line.description}
                    onChange={(e) => updateLine(idx, "description", e.target.value)}
                    placeholder="Line description"
                  />
                </td>
                <td className="px-4 py-2 w-32">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    value={line.debit}
                    onChange={(e) => updateLine(idx, "debit", e.target.value)}
                    placeholder="0.00"
                  />
                </td>
                <td className="px-4 py-2 w-32">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    value={line.credit}
                    onChange={(e) => updateLine(idx, "credit", e.target.value)}
                    placeholder="0.00"
                  />
                </td>
                <td className="px-2 py-2">
                  <button
                    onClick={() => removeLine(idx)}
                    disabled={lines.length <= 2}
                    className="text-slate-400 hover:text-red-500 disabled:opacity-30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-200 bg-slate-50">
              <td colSpan={2} className="px-4 py-3 text-sm font-semibold text-slate-700">Totals</td>
              <td className="px-4 py-3 text-right text-sm font-bold text-slate-800">{fmt(totalDebits)}</td>
              <td className="px-4 py-3 text-right text-sm font-bold text-slate-800">{fmt(totalCredits)}</td>
              <td className="px-2 py-3">
                {totalDebits > 0 && (
                  <span className={`text-xs font-medium ${isBalanced ? "text-emerald-600" : "text-red-600"}`}>
                    {isBalanced ? "✓" : "✗"}
                  </span>
                )}
              </td>
            </tr>
          </tfoot>
        </table>
        {totalDebits > 0 && !isBalanced && (
          <div className="px-4 py-2 bg-red-50 border-t border-red-100">
            <p className="text-xs text-red-600">
              Out of balance by {fmt(Math.abs(totalDebits - totalCredits))}
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save as Draft
        </button>
        <button
          onClick={() => router.back()}
          className="px-5 py-2 text-sm border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
