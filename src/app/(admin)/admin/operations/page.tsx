"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import {
  Users, CheckSquare, Package, Wrench, Calendar, DollarSign,
  Ticket, RefreshCw, Loader2, AlertTriangle, ChevronRight,
  CheckCircle2, Clock, Activity,
} from "lucide-react";

type OpsData = {
  attendance: { currentlyIn: number; late: number; completed: number; absent: number; total: number };
  tasks: {
    openCount: number;
    items: Array<{ id: string; title: string; status: string; priority: string; assigneeName: string | null; dueDate: string | null }>;
    byStatus: { TODO: number; IN_PROGRESS: number; BLOCKED: number };
  };
  inventory: {
    lowStockCount: number;
    items: Array<{ id: string; name: string; totalStock: number; minThreshold: number; unit: string; category: { id: string; name: string; icon: string | null } | null }>;
  };
  repairs: {
    openCount: number;
    items: Array<{ id: string; itemName: string; status: string; dateReported: string; technician: string | null }>;
  };
  pendingLeave: number;
  draftPayroll: number;
  openTickets: number;
  asOf: string;
};

const REFRESH_MS = 60_000;

const PRIORITY_COLOR: Record<string, string> = {
  HIGH:   "bg-red-100 text-red-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  LOW:    "bg-slate-100 text-slate-500",
};

const STATUS_COLOR: Record<string, string> = {
  TODO:        "text-slate-500",
  IN_PROGRESS: "text-indigo-600",
  BLOCKED:     "text-red-600",
};

export default function OperationsDashboardPage() {
  const [data, setData] = useState<OpsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/admin/operations/dashboard");
      const json = await res.json();
      if (json.success) setData(json.data);
      else setError(json.error ?? "Failed");
    } catch { setError("Network error"); }
    finally { if (!silent) setLoading(false); }
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(true), REFRESH_MS);
    return () => clearInterval(t);
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!data) {
    return <div className="p-6 text-sm text-red-600">{error ?? "No data"}</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-600" />
            Operations Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time company pulse · Last updated {new Date(data.asOf).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
          </p>
        </div>
        <button
          onClick={() => void load()}
          className="flex items-center gap-1.5 px-3 py-2 text-xs border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
          {error}
        </div>
      )}

      {/* Top alert bar */}
      {(data.pendingLeave > 0 || data.draftPayroll > 0 || data.openTickets > 0) && (
        <div className="flex flex-wrap gap-3">
          {data.pendingLeave > 0 && (
            <Link href="/admin/hr/leave" className="flex items-center gap-2 px-3 py-2 rounded-xl border border-amber-200 bg-amber-50 text-xs font-medium text-amber-700 hover:bg-amber-100">
              <AlertTriangle className="h-3.5 w-3.5" />
              {data.pendingLeave} pending leave {data.pendingLeave === 1 ? "request" : "requests"}
            </Link>
          )}
          {data.draftPayroll > 0 && (
            <Link href="/admin/hr/payroll" className="flex items-center gap-2 px-3 py-2 rounded-xl border border-indigo-200 bg-indigo-50 text-xs font-medium text-indigo-700 hover:bg-indigo-100">
              <DollarSign className="h-3.5 w-3.5" />
              {data.draftPayroll} draft payroll {data.draftPayroll === 1 ? "run" : "runs"} pending
            </Link>
          )}
          {data.openTickets > 0 && (
            <Link href="/admin/tickets" className="flex items-center gap-2 px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 text-xs font-medium text-rose-700 hover:bg-rose-100">
              <Ticket className="h-3.5 w-3.5" />
              {data.openTickets} open support {data.openTickets === 1 ? "ticket" : "tickets"}
            </Link>
          )}
        </div>
      )}

      {/* 3-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Attendance widget */}
        <Widget
          title="Attendance — Today"
          icon={<Users className="h-4 w-4 text-emerald-600" />}
          href="/admin/hr/live"
          linkLabel="View live"
        >
          <div className="grid grid-cols-2 gap-2 mt-2">
            {[
              { label: "In Office",  value: data.attendance.currentlyIn, cls: "text-emerald-700" },
              { label: "Late",       value: data.attendance.late,        cls: "text-amber-700"   },
              { label: "Completed",  value: data.attendance.completed,   cls: "text-indigo-700"  },
              { label: "Absent",     value: data.attendance.absent,      cls: "text-red-700"     },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 text-center">
                <p className={`text-xl font-bold tabular-nums ${s.cls}`}>{s.value}</p>
                <p className="text-[11px] text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">of {data.attendance.total} active employees</p>
        </Widget>

        {/* Open Tasks widget */}
        <Widget
          title="Open Tasks"
          icon={<CheckSquare className="h-4 w-4 text-indigo-600" />}
          href="/admin/work"
          linkLabel="Manage all"
          count={data.tasks.openCount}
        >
          <div className="flex gap-3 mt-2 mb-3">
            {[
              { label: "To Do",       value: data.tasks.byStatus.TODO,        cls: "text-slate-600"  },
              { label: "In Progress", value: data.tasks.byStatus.IN_PROGRESS, cls: "text-indigo-600" },
              { label: "Blocked",     value: data.tasks.byStatus.BLOCKED,     cls: "text-red-600"    },
            ].map((s) => (
              <div key={s.label} className="flex-1 text-center rounded-xl bg-slate-50 border border-slate-100 py-2">
                <p className={`text-lg font-bold tabular-nums ${s.cls}`}>{s.value}</p>
                <p className="text-[10px] text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
          <ul className="space-y-1.5">
            {data.tasks.items.slice(0, 4).map((t) => (
              <li key={t.id} className="flex items-center gap-2 text-xs">
                <span className={`shrink-0 font-medium ${STATUS_COLOR[t.status] ?? "text-slate-500"}`}>
                  {t.status === "IN_PROGRESS" ? "▶" : t.status === "BLOCKED" ? "✕" : "○"}
                </span>
                <span className="flex-1 truncate text-slate-700">{t.title}</span>
                <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold ${PRIORITY_COLOR[t.priority] ?? ""}`}>
                  {t.priority}
                </span>
              </li>
            ))}
          </ul>
        </Widget>

        {/* Low Stock widget */}
        <Widget
          title="Low Stock Alerts"
          icon={<Package className="h-4 w-4 text-amber-600" />}
          href="/admin/admin/inventory"
          linkLabel="View inventory"
          count={data.inventory.lowStockCount}
          warn={data.inventory.lowStockCount > 0}
        >
          {data.inventory.lowStockCount === 0 ? (
            <div className="py-4 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-1" />
              <p className="text-xs text-emerald-600 font-medium">All stock levels OK</p>
            </div>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {data.inventory.items.map((item) => (
                <li key={item.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span>{item.category?.icon ?? "📦"}</span>
                    <span className="truncate text-slate-700">{item.name}</span>
                  </div>
                  <span className="shrink-0 font-semibold text-amber-700 ml-2">
                    {item.totalStock}/{item.minThreshold} {item.unit}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Widget>

        {/* Repair Logs widget */}
        <Widget
          title="Open Repairs"
          icon={<Wrench className="h-4 w-4 text-orange-600" />}
          href="/admin/admin/repair-logs"
          linkLabel="View all"
          count={data.repairs.openCount}
          warn={data.repairs.openCount > 0}
        >
          {data.repairs.openCount === 0 ? (
            <div className="py-4 text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-1" />
              <p className="text-xs text-emerald-600 font-medium">No open repairs</p>
            </div>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {data.repairs.items.slice(0, 5).map((r) => (
                <li key={r.id} className="flex items-start justify-between text-xs gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-slate-700 font-medium">{r.itemName}</p>
                    {r.technician && <p className="text-slate-400 truncate">{r.technician}</p>}
                  </div>
                  <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                    r.status === "IN_PROGRESS" ? "bg-indigo-100 text-indigo-700" : "bg-amber-100 text-amber-700"
                  }`}>
                    {r.status.replace("_", " ")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Widget>

        {/* Pending Approvals widget */}
        <Widget
          title="Pending Approvals"
          icon={<Clock className="h-4 w-4 text-violet-600" />}
        >
          <div className="mt-2 space-y-2">
            <Link href="/admin/hr/leave" className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
              <span className="flex items-center gap-2 text-xs text-slate-700">
                <Calendar className="h-4 w-4 text-slate-400" /> Leave Requests
              </span>
              <span className={`text-sm font-bold tabular-nums ${data.pendingLeave > 0 ? "text-amber-600" : "text-slate-400"}`}>
                {data.pendingLeave}
              </span>
            </Link>
            <Link href="/admin/hr/payroll" className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
              <span className="flex items-center gap-2 text-xs text-slate-700">
                <DollarSign className="h-4 w-4 text-slate-400" /> Draft Payroll Runs
              </span>
              <span className={`text-sm font-bold tabular-nums ${data.draftPayroll > 0 ? "text-indigo-600" : "text-slate-400"}`}>
                {data.draftPayroll}
              </span>
            </Link>
            <Link href="/admin/tickets" className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
              <span className="flex items-center gap-2 text-xs text-slate-700">
                <Ticket className="h-4 w-4 text-slate-400" /> Support Tickets
              </span>
              <span className={`text-sm font-bold tabular-nums ${data.openTickets > 0 ? "text-rose-600" : "text-slate-400"}`}>
                {data.openTickets}
              </span>
            </Link>
          </div>
        </Widget>

      </div>
    </div>
  );
}

function Widget({
  title, icon, href, linkLabel, count, warn, children,
}: {
  title: string;
  icon: React.ReactNode;
  href?: string;
  linkLabel?: string;
  count?: number;
  warn?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className={`rounded-2xl border bg-white p-4 ${warn ? "border-amber-200" : "border-slate-200"}`}>
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
          {icon}
          {title}
          {count !== undefined && (
            <span className={`text-xs font-bold ml-1 ${warn ? "text-amber-700" : "text-slate-400"}`}>
              ({count})
            </span>
          )}
        </h2>
        {href && linkLabel && (
          <Link href={href} className="flex items-center gap-0.5 text-[11px] text-indigo-600 hover:text-indigo-700 font-medium">
            {linkLabel} <ChevronRight className="h-3 w-3" />
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}
