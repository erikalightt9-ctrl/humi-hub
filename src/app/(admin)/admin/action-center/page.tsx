"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle2, XCircle, Clock, Loader2, RefreshCw,
  ClipboardList, DollarSign, Wrench, ChevronDown, AlertCircle,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type LeaveReq = {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: string;
  createdAt: string;
  employee: {
    id: string; firstName: string; lastName: string;
    employeeNumber: string; department: string | null; position: string | null;
  };
};

type PayrollRun = {
  id: string; runNumber: number;
  periodStart: string; periodEnd: string;
  totalGross: number | null; totalDeductions: number | null; totalNet: number | null;
  notes: string | null; createdAt: string;
  _count: { lines: number };
};

type RepairLog = {
  id: string; itemName: string; itemType: string | null;
  status: string; dateReported: string; description: string | null;
  technician: string | null; cost: number | null; notes: string | null;
};

type ActionData = {
  leaveRequests: LeaveReq[];
  payrollRuns:   PayrollRun[];
  repairs:       RepairLog[];
  total:         number;
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const LEAVE_LABEL: Record<string, string> = {
  SICK: "Sick Leave", VACATION: "Vacation", EMERGENCY: "Emergency",
  MATERNITY: "Maternity", PATERNITY: "Paternity",
  BEREAVEMENT: "Bereavement", OTHER: "Other",
};

const REPAIR_STATUS_NEXT: Record<string, string> = {
  PENDING:     "IN_PROGRESS",
  IN_PROGRESS: "COMPLETED",
};
const REPAIR_NEXT_LABEL: Record<string, string> = {
  PENDING:     "Start Work",
  IN_PROGRESS: "Mark Completed",
};

const fmt = (d: string) =>
  new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });

const fmtPeso = (n: number | null) =>
  n != null ? `₱${Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2 })}` : "—";

const daysAgo = (d: string) => {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  return diff === 0 ? "today" : diff === 1 ? "yesterday" : `${diff}d ago`;
};

/* ------------------------------------------------------------------ */
/*  Section header                                                     */
/* ------------------------------------------------------------------ */

function SectionHeader({
  icon: Icon, label, count, color,
}: { icon: React.ComponentType<{ className?: string }>; label: string; count: number; color: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <h2 className="text-base font-semibold text-slate-900">{label}</h2>
      <span className="ml-auto text-xs font-semibold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">
        {count}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Leave section                                                      */
/* ------------------------------------------------------------------ */

function LeaveSection({
  items, onAction,
}: { items: LeaveReq[]; onAction: (id: string, action: "APPROVED" | "REJECTED", note?: string) => Promise<void> }) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [expandedId,   setExpandedId]   = useState<string | null>(null);
  const [note,         setNote]         = useState("");

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-slate-200" />
        <p className="text-sm">No pending leave requests</p>
      </div>
    );
  }

  async function act(id: string, action: "APPROVED" | "REJECTED") {
    setProcessingId(id);
    try {
      await onAction(id, action, note.trim() || undefined);
      setExpandedId(null);
      setNote("");
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="divide-y divide-slate-100">
      {items.map((req) => {
        const isExpanded = expandedId === req.id;
        const isBusy     = processingId === req.id;
        return (
          <div key={req.id} className="py-3">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 text-indigo-700 font-semibold text-sm">
                {req.employee.firstName.charAt(0)}{req.employee.lastName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-slate-900 text-sm">
                    {req.employee.firstName} {req.employee.lastName}
                  </p>
                  <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                    {LEAVE_LABEL[req.leaveType] ?? req.leaveType}
                  </span>
                  {req.employee.department && (
                    <span className="text-xs text-slate-400">{req.employee.department}</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {fmt(req.startDate)} – {fmt(req.endDate)} · {Number(req.totalDays)} day{Number(req.totalDays) !== 1 ? "s" : ""}
                  <span className="ml-2 text-slate-400">Filed {daysAgo(req.createdAt)}</span>
                </p>
                {req.reason && <p className="text-xs text-slate-600 mt-1 italic">"{req.reason}"</p>}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => { setExpandedId(isExpanded ? null : req.id); setNote(""); }}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
                  title="Add note"
                >
                  <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                </button>
                <button
                  disabled={isBusy}
                  onClick={() => void act(req.id, "APPROVED")}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  {isBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                  Approve
                </button>
                <button
                  disabled={isBusy}
                  onClick={() => void act(req.id, "REJECTED")}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 disabled:opacity-50 transition-colors border border-red-200"
                >
                  {isBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                  Reject
                </button>
              </div>
            </div>
            {isExpanded && (
              <div className="mt-2 ml-12 flex gap-2">
                <input
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Optional note for the employee…"
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <button
                  disabled={isBusy}
                  onClick={() => void act(req.id, "APPROVED")}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 disabled:opacity-50"
                >Approve with note</button>
                <button
                  disabled={isBusy}
                  onClick={() => void act(req.id, "REJECTED")}
                  className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 disabled:opacity-50"
                >Reject with note</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Payroll section                                                    */
/* ------------------------------------------------------------------ */

function PayrollSection({
  items, onApprove,
}: { items: PayrollRun[]; onApprove: (id: string) => Promise<void> }) {
  const [processingId, setProcessingId] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-slate-200" />
        <p className="text-sm">No draft payroll runs</p>
      </div>
    );
  }

  async function approve(id: string) {
    setProcessingId(id);
    try { await onApprove(id); }
    finally { setProcessingId(null); }
  }

  return (
    <div className="divide-y divide-slate-100">
      {items.map((run) => {
        const isBusy = processingId === run.id;
        return (
          <div key={run.id} className="py-3 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-900 text-sm">
                Payroll Run #{run.runNumber}
                <span className="ml-2 text-xs text-slate-400 font-normal">
                  {run._count.lines} employee{run._count.lines !== 1 ? "s" : ""}
                </span>
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {fmt(run.periodStart)} – {fmt(run.periodEnd)}
              </p>
              {run.notes && <p className="text-xs text-slate-400 mt-0.5 italic">"{run.notes}"</p>}
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-semibold text-slate-900">{fmtPeso(run.totalNet)}</p>
              <p className="text-xs text-slate-400">net pay</p>
            </div>
            <button
              disabled={isBusy}
              onClick={() => void approve(run.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors shrink-0"
            >
              {isBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
              Approve
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Repairs section                                                    */
/* ------------------------------------------------------------------ */

const REPAIR_STATUS_STYLE: Record<string, string> = {
  PENDING:     "bg-amber-50 text-amber-700 border-amber-200",
  IN_PROGRESS: "bg-blue-50 text-blue-700 border-blue-200",
};

function RepairsSection({
  items, onUpdate,
}: { items: RepairLog[]; onUpdate: (id: string, status: string) => Promise<void> }) {
  const [processingId, setProcessingId] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-slate-200" />
        <p className="text-sm">No open repairs</p>
      </div>
    );
  }

  async function advance(id: string, currentStatus: string) {
    const next = REPAIR_STATUS_NEXT[currentStatus];
    if (!next) return;
    setProcessingId(id);
    try { await onUpdate(id, next); }
    finally { setProcessingId(null); }
  }

  return (
    <div className="divide-y divide-slate-100">
      {items.map((rep) => {
        const isBusy  = processingId === rep.id;
        const nextBtn = REPAIR_NEXT_LABEL[rep.status];
        return (
          <div key={rep.id} className="py-3 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-slate-900 text-sm">{rep.itemName}</p>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${REPAIR_STATUS_STYLE[rep.status] ?? ""}`}>
                  {rep.status.replace("_", " ")}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Reported {fmt(rep.dateReported)}
                {rep.technician && <span className="ml-2">· {rep.technician}</span>}
              </p>
              {rep.description && <p className="text-xs text-slate-400 mt-0.5 truncate max-w-sm italic">"{rep.description}"</p>}
            </div>
            {nextBtn && (
              <button
                disabled={isBusy}
                onClick={() => void advance(rep.id, rep.status)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 text-white text-xs font-medium hover:bg-slate-900 disabled:opacity-50 transition-colors shrink-0"
              >
                {isBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Clock className="h-3 w-3" />}
                {nextBtn}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function ActionCenterPage() {
  const [data,     setData]     = useState<ActionData | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date>(new Date());

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res  = await fetch("/api/admin/action-center");
      const json = await res.json() as { success: boolean; data: ActionData; error: string | null };
      if (!json.success) throw new Error(json.error ?? "Failed to load");
      setData(json.data);
      setLastSync(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  /* ── Action handlers ──────────────────────────────────────────── */
  async function handleLeaveAction(id: string, action: "APPROVED" | "REJECTED", note?: string) {
    const res  = await fetch(`/api/admin/hr/leave/${id}/review`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...(note ? { reviewNote: note } : {}) }),
    });
    const json = await res.json() as { success: boolean; error?: string };
    if (!json.success) throw new Error(json.error ?? "Failed");
    setData((d) => d ? { ...d, leaveRequests: d.leaveRequests.filter(r => r.id !== id), total: d.total - 1 } : d);
  }

  async function handlePayrollApprove(id: string) {
    const res  = await fetch(`/api/admin/hr/payroll/${id}/approve`, { method: "POST" });
    const json = await res.json() as { success: boolean; error?: string };
    if (!json.success) throw new Error(json.error ?? "Failed");
    setData((d) => d ? { ...d, payrollRuns: d.payrollRuns.filter(r => r.id !== id), total: d.total - 1 } : d);
  }

  async function handleRepairUpdate(id: string, status: string) {
    const res  = await fetch(`/api/admin/dept/repair-logs?id=${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const json = await res.json() as { success: boolean; error?: string };
    if (!json.success) throw new Error(json.error ?? "Failed");
    // If completed, remove from list; otherwise update status inline
    if (status === "COMPLETED") {
      setData((d) => d ? { ...d, repairs: d.repairs.filter(r => r.id !== id), total: d.total - 1 } : d);
    } else {
      setData((d) => d ? {
        ...d,
        repairs: d.repairs.map(r => r.id === id ? { ...r, status } : r),
      } : d);
    }
  }

  /* ── Render ────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl px-4 py-3">
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
        </div>
      </div>
    );
  }

  const d = data!;

  return (
    <div className="p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Action Center</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {d.total === 0
              ? "Everything is up to date."
              : `${d.total} item${d.total !== 1 ? "s" : ""} need${d.total === 1 ? "s" : ""} your attention`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">
            Last updated {lastSync.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}
          </span>
          <button onClick={() => void load()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-600 text-sm hover:bg-slate-200 transition-colors">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* All-done banner */}
      {d.total === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">You&apos;re all caught up!</h2>
          <p className="text-sm text-slate-500 mt-1">No pending approvals or open items at this time.</p>
        </div>
      )}

      {/* Leave Requests */}
      {d.leaveRequests.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <SectionHeader icon={ClipboardList} label="Leave Requests" count={d.leaveRequests.length} color="bg-indigo-600" />
          <LeaveSection items={d.leaveRequests} onAction={handleLeaveAction} />
        </div>
      )}

      {/* Payroll */}
      {d.payrollRuns.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <SectionHeader icon={DollarSign} label="Payroll Approval" count={d.payrollRuns.length} color="bg-blue-600" />
          <PayrollSection items={d.payrollRuns} onApprove={handlePayrollApprove} />
        </div>
      )}

      {/* Repairs */}
      {d.repairs.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <SectionHeader icon={Wrench} label="Open Repairs" count={d.repairs.length} color="bg-amber-600" />
          <RepairsSection items={d.repairs} onUpdate={handleRepairUpdate} />
        </div>
      )}
    </div>
  );
}
