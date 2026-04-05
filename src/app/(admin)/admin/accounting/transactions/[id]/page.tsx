"use client";

import { useEffect, useState } from "react";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface TxLine {
  id: string;
  accountCode: string;
  accountName: string;
  description?: string;
  debit: number;
  credit: number;
}

interface Transaction {
  id: string;
  transactionNumber: string;
  date: string;
  description: string;
  status: "DRAFT" | "POSTED" | "VOIDED";
  reference?: string;
  voidReason?: string;
  voidedAt?: string;
  lines: TxLine[];
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  POSTED: "bg-emerald-100 text-emerald-700",
  VOIDED: "bg-red-100 text-red-700",
};

const fmt = (n: number) => `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-PH");

export default function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tx, setTx] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [voidReason, setVoidReason] = useState("");
  const [voiding, setVoiding] = useState(false);

  const loadTx = async () => {
    try {
      const res = await fetch(`/api/admin/accounting/transactions/${id}`);
      if (!res.ok) throw new Error("Failed to load transaction");
      const data = await res.json();
      setTx(data.data ?? data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTx(); }, [id]);

  const handlePost = async () => {
    setPosting(true);
    try {
      const res = await fetch(`/api/admin/accounting/transactions/${id}/post`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to post transaction");
      await loadTx();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error posting transaction");
    } finally {
      setPosting(false);
    }
  };

  const handleVoid = async () => {
    if (!voidReason.trim()) return;
    setVoiding(true);
    try {
      const res = await fetch(`/api/admin/accounting/transactions/${id}/void`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: voidReason }),
      });
      if (!res.ok) throw new Error("Failed to void transaction");
      setShowVoidModal(false);
      setVoidReason("");
      await loadTx();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error voiding transaction");
    } finally {
      setVoiding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (error || !tx) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error ?? "Transaction not found"}</span>
        </div>
      </div>
    );
  }

  const totalDebits = tx.lines.reduce((s, l) => s + l.debit, 0);
  const totalCredits = tx.lines.reduce((s, l) => s + l.credit, 0);

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/accounting/transactions" className="text-slate-400 hover:text-slate-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900">{tx.transactionNumber}</h1>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[tx.status]}`}>
              {tx.status}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">{tx.description}</p>
        </div>
        <div className="flex gap-2">
          {tx.status === "DRAFT" && (
            <button
              onClick={handlePost}
              disabled={posting}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {posting && <Loader2 className="h-3 w-3 animate-spin" />}
              Post Transaction
            </button>
          )}
          {tx.status === "POSTED" && (
            <button
              onClick={() => setShowVoidModal(true)}
              className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
            >
              Void Transaction
            </button>
          )}
        </div>
      </div>

      {/* Header Info */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-xs text-slate-500 mb-1">Date</p>
            <p className="text-sm font-medium text-slate-800">{fmtDate(tx.date)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Reference</p>
            <p className="text-sm font-medium text-slate-800">{tx.reference ?? "—"}</p>
          </div>
          {tx.status === "VOIDED" && tx.voidedAt && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Voided On</p>
              <p className="text-sm font-medium text-slate-800">{fmtDate(tx.voidedAt)}</p>
            </div>
          )}
        </div>
        {tx.status === "VOIDED" && tx.voidReason && (
          <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg">
            <p className="text-xs text-slate-500 mb-1">Void Reason</p>
            <p className="text-sm text-red-700">{tx.voidReason}</p>
          </div>
        )}
      </div>

      {/* Lines Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">Journal Lines</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Code</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Account</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Description</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Debit</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Credit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tx.lines.map((line) => (
              <tr key={line.id}>
                <td className="px-4 py-3 font-mono text-slate-600">{line.accountCode}</td>
                <td className="px-4 py-3 text-slate-800">{line.accountName}</td>
                <td className="px-4 py-3 text-slate-500">{line.description ?? "—"}</td>
                <td className="px-4 py-3 text-right text-slate-800">{line.debit > 0 ? fmt(line.debit) : "—"}</td>
                <td className="px-4 py-3 text-right text-slate-800">{line.credit > 0 ? fmt(line.credit) : "—"}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-200 bg-slate-50">
              <td colSpan={3} className="px-4 py-3 text-sm font-bold text-slate-700">Total</td>
              <td className="px-4 py-3 text-right text-sm font-bold text-slate-800">{fmt(totalDebits)}</td>
              <td className="px-4 py-3 text-right text-sm font-bold text-slate-800">{fmt(totalCredits)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Void Modal */}
      {showVoidModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl space-y-4">
            <h3 className="text-base font-semibold text-slate-900">Void Transaction</h3>
            <p className="text-sm text-slate-500">This action cannot be undone. Please provide a reason.</p>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Reason *</label>
              <textarea
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                rows={3}
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="Reason for voiding..."
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowVoidModal(false); setVoidReason(""); }}
                className="px-4 py-2 text-sm border border-slate-300 rounded-lg text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleVoid}
                disabled={voiding || !voidReason.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {voiding && <Loader2 className="h-3 w-3 animate-spin" />}
                Void Transaction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
