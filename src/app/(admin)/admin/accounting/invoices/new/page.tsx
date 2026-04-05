"use client";

import { useState } from "react";
import { Loader2, AlertCircle, Plus, Trash2, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface LineItem {
  description: string;
  qty: string;
  unitPrice: string;
  taxRate: string;
}

const EMPTY_LINE: LineItem = { description: "", qty: "1", unitPrice: "", taxRate: "0" };

const fmt = (n: number) => `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

function calcLine(line: LineItem) {
  const qty = parseFloat(line.qty) || 0;
  const price = parseFloat(line.unitPrice) || 0;
  return qty * price;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineItem[]>([{ ...EMPTY_LINE }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateLine = (idx: number, field: keyof LineItem, value: string) => {
    setLines(lines.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));
  };

  const subtotal = lines.reduce((s, l) => s + calcLine(l), 0);
  const taxTotal = lines.reduce((s, l) => {
    const amount = calcLine(l);
    const rate = parseFloat(l.taxRate) || 0;
    return s + amount * (rate / 100);
  }, 0);
  const total = subtotal + taxTotal;

  const handleSave = async () => {
    if (!customerName || !issueDate || !dueDate) {
      setError("Customer name, issue date, and due date are required");
      return;
    }
    const validLines = lines.filter((l) => l.description && (parseFloat(l.unitPrice) > 0));
    if (validLines.length === 0) {
      setError("At least one line item is required");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/accounting/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerEmail: email || undefined,
          customerAddress: address || undefined,
          issueDate,
          dueDate,
          notes: notes || undefined,
          lines: validLines.map((l) => ({
            description: l.description,
            quantity: parseFloat(l.qty) || 1,
            unitPrice: parseFloat(l.unitPrice) || 0,
            taxRate: parseFloat(l.taxRate) || 0,
          })),
        }),
      });
      if (!res.ok) throw new Error("Failed to create invoice");
      const data = await res.json();
      const id = data.data?.id ?? data.id;
      router.push(`/admin/accounting/invoices/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/accounting/invoices" className="text-slate-400 hover:text-slate-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Create Invoice</h1>
          <p className="text-sm text-slate-500 mt-0.5">New customer invoice</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Customer Info */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">Customer Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Customer Name *</label>
            <input
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Customer or company name"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Email</label>
            <input
              type="email"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="customer@example.com"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-slate-500 mb-1">Address (optional)</label>
            <input
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Billing address"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Issue Date *</label>
            <input
              type="date"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Due Date *</label>
            <input
              type="date"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Line Items</h2>
          <button
            onClick={() => setLines([...lines, { ...EMPTY_LINE }])}
            className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Add Line
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500">Description</th>
              <th className="text-right px-4 py-2 text-xs font-semibold text-slate-500 w-20">Qty</th>
              <th className="text-right px-4 py-2 text-xs font-semibold text-slate-500 w-28">Unit Price</th>
              <th className="text-right px-4 py-2 text-xs font-semibold text-slate-500 w-20">Tax %</th>
              <th className="text-right px-4 py-2 text-xs font-semibold text-slate-500 w-28">Amount</th>
              <th className="px-2 py-2 w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lines.map((line, idx) => (
              <tr key={idx}>
                <td className="px-4 py-2">
                  <input
                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    value={line.description}
                    onChange={(e) => updateLine(idx, "description", e.target.value)}
                    placeholder="Item description"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="number" min="1" step="1"
                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    value={line.qty}
                    onChange={(e) => updateLine(idx, "qty", e.target.value)}
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="number" min="0" step="0.01"
                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    value={line.unitPrice}
                    onChange={(e) => updateLine(idx, "unitPrice", e.target.value)}
                    placeholder="0.00"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="number" min="0" step="0.01"
                    className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    value={line.taxRate}
                    onChange={(e) => updateLine(idx, "taxRate", e.target.value)}
                  />
                </td>
                <td className="px-4 py-2 text-right text-slate-700 font-medium">{fmt(calcLine(line))}</td>
                <td className="px-2 py-2">
                  <button
                    onClick={() => setLines(lines.filter((_, i) => i !== idx))}
                    disabled={lines.length <= 1}
                    className="text-slate-400 hover:text-red-500 disabled:opacity-30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-5 py-4 border-t border-slate-100 flex justify-end">
          <div className="space-y-1 w-56">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Subtotal</span><span>{fmt(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-600">
              <span>Tax</span><span>{fmt(taxTotal)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-slate-900 pt-1 border-t border-slate-200">
              <span>Total</span><span>{fmt(total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <label className="block text-xs text-slate-500 mb-1">Notes (optional)</label>
        <textarea
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional notes for the customer..."
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Create Invoice
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
