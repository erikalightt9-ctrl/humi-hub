"use client";

import { useEffect, useState } from "react";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface InvoiceLine {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  amount: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: "DRAFT" | "SENT" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "VOIDED";
  customerName: string;
  customerEmail?: string;
  customerAddress?: string;
  issueDate: string;
  dueDate: string;
  notes?: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  voidReason?: string;
  lines: InvoiceLine[];
}

interface AccountOption { id: string; code: string; name: string; }

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  SENT: "bg-blue-100 text-blue-700",
  PARTIALLY_PAID: "bg-amber-100 text-amber-700",
  PAID: "bg-emerald-100 text-emerald-700",
  OVERDUE: "bg-red-100 text-red-700",
  VOIDED: "bg-gray-100 text-gray-500",
};

const fmt = (n: number) => `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-PH");

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payAccountId, setPayAccountId] = useState("");
  const [paying, setPaying] = useState(false);
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [voidReason, setVoidReason] = useState("");
  const [voiding, setVoiding] = useState(false);

  const load = async () => {
    try {
      const [invRes, accRes] = await Promise.all([
        fetch(`/api/admin/accounting/invoices/${id}`),
        fetch("/api/admin/accounting/accounts"),
      ]);
      if (!invRes.ok) throw new Error("Failed to load invoice");
      const d = await invRes.json();
      setInvoice(d.data ?? d);
      if (accRes.ok) {
        const ad = await accRes.json();
        setAccounts(ad.data ?? ad ?? []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleSend = async () => {
    setSending(true);
    try {
      const res = await fetch(`/api/admin/accounting/invoices/${id}/send`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to send invoice");
      await load();
    } catch (e) { alert(e instanceof Error ? e.message : "Error"); }
    finally { setSending(false); }
  };

  const handlePay = async () => {
    if (!payAmount) return;
    setPaying(true);
    try {
      const res = await fetch(`/api/admin/accounting/invoices/${id}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseFloat(payAmount), accountId: payAccountId || undefined }),
      });
      if (!res.ok) throw new Error("Failed to record payment");
      setShowPayModal(false);
      setPayAmount("");
      await load();
    } catch (e) { alert(e instanceof Error ? e.message : "Error"); }
    finally { setPaying(false); }
  };

  const handleVoid = async () => {
    if (!voidReason.trim()) return;
    setVoiding(true);
    try {
      const res = await fetch(`/api/admin/accounting/invoices/${id}/void`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: voidReason }),
      });
      if (!res.ok) throw new Error("Failed to void invoice");
      setShowVoidModal(false);
      await load();
    } catch (e) { alert(e instanceof Error ? e.message : "Error"); }
    finally { setVoiding(false); }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 text-emerald-600 animate-spin" /></div>;
  }
  if (error || !invoice) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          <AlertCircle className="h-5 w-5 flex-shrink-0" /><span>{error ?? "Invoice not found"}</span>
        </div>
      </div>
    );
  }

  const balanceDue = invoice.totalAmount - invoice.paidAmount;
  const canPay = ["SENT", "OVERDUE", "PARTIALLY_PAID"].includes(invoice.status);

  return (
    <div className="p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href="/admin/accounting/invoices" className="text-slate-400 hover:text-slate-600 mt-1">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900">{invoice.invoiceNumber}</h1>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[invoice.status]}`}>
              {invoice.status.replace("_", " ")}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">{invoice.customerName}</p>
        </div>
        <div className="flex gap-2">
          {invoice.status === "DRAFT" && (
            <button onClick={handleSend} disabled={sending}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {sending && <Loader2 className="h-3 w-3 animate-spin" />}Send Invoice
            </button>
          )}
          {canPay && (
            <button onClick={() => setShowPayModal(true)}
              className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700">
              Record Payment
            </button>
          )}
          {invoice.status !== "VOIDED" && (
            <button onClick={() => setShowVoidModal(true)}
              className="px-4 py-2 border border-red-300 text-red-600 text-sm rounded-lg hover:bg-red-50">
              Void
            </button>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div><p className="text-xs text-slate-500 mb-1">Customer</p><p className="text-sm font-medium text-slate-800">{invoice.customerName}</p></div>
          {invoice.customerEmail && <div><p className="text-xs text-slate-500 mb-1">Email</p><p className="text-sm text-slate-700">{invoice.customerEmail}</p></div>}
          <div><p className="text-xs text-slate-500 mb-1">Issue Date</p><p className="text-sm text-slate-700">{fmtDate(invoice.issueDate)}</p></div>
          <div><p className="text-xs text-slate-500 mb-1">Due Date</p><p className="text-sm text-slate-700">{fmtDate(invoice.dueDate)}</p></div>
        </div>
        {invoice.voidReason && (
          <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg">
            <p className="text-xs text-slate-500 mb-1">Void Reason</p>
            <p className="text-sm text-red-700">{invoice.voidReason}</p>
          </div>
        )}
      </div>

      {/* Lines */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Description</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Qty</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Unit Price</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tax %</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoice.lines.map((l) => (
              <tr key={l.id}>
                <td className="px-4 py-3 text-slate-800">{l.description}</td>
                <td className="px-4 py-3 text-right text-slate-600">{l.quantity}</td>
                <td className="px-4 py-3 text-right text-slate-600">{fmt(l.unitPrice)}</td>
                <td className="px-4 py-3 text-right text-slate-600">{l.taxRate}%</td>
                <td className="px-4 py-3 text-right font-medium text-slate-800">{fmt(l.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-5 py-4 border-t border-slate-100 flex justify-end">
          <div className="space-y-1 w-64">
            <div className="flex justify-between text-sm text-slate-600"><span>Subtotal</span><span>{fmt(invoice.subtotal)}</span></div>
            <div className="flex justify-between text-sm text-slate-600"><span>Tax</span><span>{fmt(invoice.taxAmount)}</span></div>
            <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-200"><span>Total</span><span>{fmt(invoice.totalAmount)}</span></div>
            <div className="flex justify-between text-sm text-emerald-700"><span>Paid</span><span>{fmt(invoice.paidAmount)}</span></div>
            <div className={`flex justify-between text-sm font-bold pt-1 border-t border-slate-200 ${balanceDue > 0 ? "text-red-700" : "text-emerald-700"}`}>
              <span>Balance Due</span><span>{fmt(balanceDue)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl space-y-4">
            <h3 className="text-base font-semibold text-slate-900">Record Payment</h3>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Amount *</label>
              <input type="number" min="0" step="0.01"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Payment Account</label>
              <select className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={payAccountId} onChange={(e) => setPayAccountId(e.target.value)}>
                <option value="">Select account</option>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
              </select>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowPayModal(false)} className="px-4 py-2 text-sm border border-slate-300 rounded-lg text-slate-600">Cancel</button>
              <button onClick={handlePay} disabled={paying || !payAmount}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50">
                {paying && <Loader2 className="h-3 w-3 animate-spin" />}Record Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Void Modal */}
      {showVoidModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl space-y-4">
            <h3 className="text-base font-semibold text-slate-900">Void Invoice</h3>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Reason *</label>
              <textarea className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                rows={3} value={voidReason} onChange={(e) => setVoidReason(e.target.value)} placeholder="Reason for voiding..." />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowVoidModal(false)} className="px-4 py-2 text-sm border border-slate-300 rounded-lg text-slate-600">Cancel</button>
              <button onClick={handleVoid} disabled={voiding || !voidReason.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50">
                {voiding && <Loader2 className="h-3 w-3 animate-spin" />}Void Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
