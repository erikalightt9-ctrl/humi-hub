"use client";

import { useEffect, useState } from "react";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Expense {
  id: string;
  expenseNumber: string;
  vendor: string;
  description: string;
  category: string;
  amount: number;
  taxAmount: number;
  date: string;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "PAID";
  receiptUrl?: string;
  accountCode?: string;
  accountName?: string;
  paymentAccountCode?: string;
  paymentAccountName?: string;
  rejectionReason?: string;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  SUBMITTED: "bg-blue-100 text-blue-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
  PAID: "bg-purple-100 text-purple-700",
};

const fmt = (n: number) => `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-PH");

export default function ExpenseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [approving, setApproving] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [voiding, setVoiding] = useState(false);

  const load = async () => {
    try {
      const res = await fetch(`/api/admin/accounting/expenses/${id}`);
      if (!res.ok) throw new Error("Failed to load expense");
      const d = await res.json();
      setExpense(d.data ?? d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const action = async (endpoint: string, body?: object, setter?: (v: boolean) => void) => {
    setter?.(true);
    try {
      const res = await fetch(`/api/admin/accounting/expenses/${id}/${endpoint}`, {
        method: "POST",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) throw new Error(`Action failed: ${endpoint}`);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error");
    } finally {
      setter?.(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 text-emerald-600 animate-spin" /></div>;
  if (error || !expense) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          <AlertCircle className="h-5 w-5 flex-shrink-0" /><span>{error ?? "Expense not found"}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div className="flex items-start gap-3">
        <Link href="/admin/accounting/expenses" className="text-slate-400 hover:text-slate-600 mt-1">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900">{expense.expenseNumber}</h1>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[expense.status]}`}>
              {expense.status}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">{expense.vendor}</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          {expense.status === "DRAFT" && (
            <button onClick={() => action("submit", undefined, setSubmitting)} disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {submitting && <Loader2 className="h-3 w-3 animate-spin" />}Submit
            </button>
          )}
          {expense.status === "SUBMITTED" && (
            <>
              <button onClick={() => action("approve", undefined, setApproving)} disabled={approving}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50">
                {approving && <Loader2 className="h-3 w-3 animate-spin" />}Approve
              </button>
              <button onClick={() => setShowRejectModal(true)}
                className="px-4 py-2 border border-red-300 text-red-600 text-sm rounded-lg hover:bg-red-50">
                Reject
              </button>
            </>
          )}
          {expense.status !== "PAID" && expense.status !== "REJECTED" && (
            <button onClick={() => setShowVoidModal(true)}
              className="px-4 py-2 border border-slate-300 text-slate-600 text-sm rounded-lg hover:bg-slate-50">
              Void
            </button>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {[
            ["Vendor", expense.vendor],
            ["Category", expense.category],
            ["Date", fmtDate(expense.date)],
            ["Amount", fmt(expense.amount)],
            ["Tax Amount", fmt(expense.taxAmount)],
            ["Total", fmt(expense.amount + expense.taxAmount)],
            ...(expense.accountName ? [["Expense Account", `${expense.accountCode} — ${expense.accountName}`]] : []),
            ...(expense.paymentAccountName ? [["Payment Account", `${expense.paymentAccountCode} — ${expense.paymentAccountName}`]] : []),
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-xs text-slate-500 mb-1">{label}</p>
              <p className="text-sm font-medium text-slate-800">{value}</p>
            </div>
          ))}
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Description</p>
          <p className="text-sm text-slate-800">{expense.description}</p>
        </div>
        {expense.receiptUrl && (
          <div>
            <p className="text-xs text-slate-500 mb-1">Receipt</p>
            <a href={expense.receiptUrl} target="_blank" rel="noopener noreferrer"
              className="text-sm text-emerald-600 hover:underline">View Receipt</a>
          </div>
        )}
        {expense.status === "REJECTED" && expense.rejectionReason && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
            <p className="text-xs text-slate-500 mb-1">Rejection Reason</p>
            <p className="text-sm text-red-700">{expense.rejectionReason}</p>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl space-y-4">
            <h3 className="text-base font-semibold text-slate-900">Reject Expense</h3>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Reason *</label>
              <textarea className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Reason for rejection..." />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowRejectModal(false)} className="px-4 py-2 text-sm border border-slate-300 rounded-lg text-slate-600">Cancel</button>
              <button
                onClick={async () => {
                  if (!rejectReason.trim()) return;
                  setRejecting(true);
                  await action("reject", { reason: rejectReason });
                  setShowRejectModal(false);
                  setRejectReason("");
                  setRejecting(false);
                }}
                disabled={rejecting || !rejectReason.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {rejecting && <Loader2 className="h-3 w-3 animate-spin" />}Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Void Modal */}
      {showVoidModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl space-y-4">
            <h3 className="text-base font-semibold text-slate-900">Void Expense</h3>
            <p className="text-sm text-slate-500">Are you sure you want to void this expense?</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowVoidModal(false)} className="px-4 py-2 text-sm border border-slate-300 rounded-lg text-slate-600">Cancel</button>
              <button
                onClick={async () => { await action("void", undefined, setVoiding); setShowVoidModal(false); }}
                disabled={voiding}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {voiding && <Loader2 className="h-3 w-3 animate-spin" />}Void
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
