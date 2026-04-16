"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Loader2, Plus, CheckCircle, DollarSign, AlertCircle,
  Monitor, Package, UserCheck, Wrench, Trash2, Archive,
  ChevronRight, Search, X as XIcon,
  Users, Calendar, TrendingUp, PhoneCall, Briefcase,
  ClipboardList, Clock,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Department config                                                  */
/* ------------------------------------------------------------------ */

interface DeptConfig {
  slug: string;
  name: string;
  description: string;
  emoji: string;
  activities: string[];
}

const DEPARTMENTS: DeptConfig[] = [
  { slug: "administration-hr",     name: "Administration & HR",     description: "Employee management, recruitment, policies",  emoji: "🧑‍💼", activities: ["New employee onboarding completed", "Company policy updated", "Recruitment drive launched"] },
  { slug: "finance-payroll",       name: "Finance & Payroll",       description: "Budgeting, payroll, financial reports",        emoji: "💵",  activities: ["Payroll processed for this month", "Budget report submitted", "Government contributions filed"] },
  { slug: "operations",            name: "Operations",               description: "Daily operations and workflow",                emoji: "⚙️",  activities: ["Weekly ops review conducted", "New workflow process approved", "SLA targets updated"] },
  { slug: "sales-marketing",       name: "Sales & Marketing",       description: "Sales, branding, lead generation",             emoji: "📈",  activities: ["Q2 sales targets achieved", "New marketing campaign launched", "Lead generation report submitted"] },
  { slug: "it-systems",            name: "IT & Systems",             description: "System management and support",                emoji: "💻",  activities: ["System maintenance completed", "Security audit passed", "New software licenses acquired"] },
  { slug: "logistics-procurement", name: "Logistics & Procurement", description: "Suppliers, inventory, fleet",                  emoji: "🚚",  activities: ["Supplier contracts renewed", "Inventory audit completed", "Fleet fuel logs reviewed"] },
];

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Employee {
  id: string; firstName: string; lastName: string;
  email: string; phone: string | null;
  position: string; status: string; employeeNumber: string | null;
  department?: string | null;
}

interface PayrollRun {
  id: string; runNumber: string;
  periodStart: string; periodEnd: string; payDate: string | null;
  status: "DRAFT" | "APPROVED" | "PAID" | "VOIDED";
  totalGross: number; totalDeductions: number; totalNet: number;
  _count: { lines: number };
}

type Tab = "members" | "activity" | "payroll" | "assets" | "hr" | "crm" | "settings";

/* ------------------------------------------------------------------ */
/*  IT Asset types                                                      */
/* ------------------------------------------------------------------ */

interface ItAsset {
  id: string; assetTag: string; assetName: string;
  brand: string | null; model: string | null; serialNumber: string | null;
  status: string; condition: string; location: string | null;
  warrantyEnd: string | null; purchaseCost: number | null;
  category: { name: string } | null;
  assignedTo: { firstName: string; lastName: string; position: string } | null;
}

interface ItStats {
  total: number; available: number; assigned: number;
  inRepair: number; forDisposal: number; retired: number;
}

/* ------------------------------------------------------------------ */
/*  HR Overview types                                                   */
/* ------------------------------------------------------------------ */

interface LeaveRequest {
  id: string; leaveType: string; startDate: string; endDate: string;
  status: string; reason: string;
  employee: { firstName: string; lastName: string; position: string } | null;
}

interface AttendanceRecord {
  id: string; clockIn: string; clockOut: string | null; status: string;
  employee: { firstName: string; lastName: string } | null;
}

/* ------------------------------------------------------------------ */
/*  CRM types                                                           */
/* ------------------------------------------------------------------ */

interface CrmDashboard {
  kpis: { totalContacts: number; totalDeals: number; pipelineValue: number; wonThisMonth: number };
  funnel: Array<{ stage: string; count: number; totalValue: number }>;
  recentActivities: Array<{
    id: string; activityType: string; subject: string; createdAt: string;
    deal: { title: string } | null;
    contact: { firstName: string; lastName: string } | null;
  }>;
  overdueTasks: Array<{ id: string; title: string; dueDate: string; deal: { title: string } | null }>;
}

/* ------------------------------------------------------------------ */
/*  Add Member Modal                                                    */
/* ------------------------------------------------------------------ */

interface AddMemberModalProps {
  deptName: string;
  currentMemberIds: Set<string>;
  onClose: () => void;
  onAdded: () => void;
}

function AddMemberModal({ deptName, currentMemberIds, onClose, onAdded }: AddMemberModalProps) {
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [adding, setAdding]     = useState<string | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/hr/employees?limit=500")
      .then((r) => r.json())
      .then((j) => {
        if (j.success) {
          setAllEmployees(
            j.data.data.map((e: {
              id: string; firstName: string; lastName: string;
              email: string; phone?: string | null;
              position: string; status: string; employeeNumber?: string | null;
              department?: string | null;
            }) => ({
              id: e.id, firstName: e.firstName, lastName: e.lastName,
              email: e.email, phone: e.phone ?? null,
              position: e.position, status: e.status,
              employeeNumber: e.employeeNumber ?? null,
              department: (e as { department?: string | null }).department ?? null,
            }))
          );
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const candidates = allEmployees
    .filter((e) => !currentMemberIds.has(e.id))
    .filter((e) =>
      `${e.firstName} ${e.lastName} ${e.email} ${e.position}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );

  async function handleAdd(empId: string) {
    setAdding(empId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/hr/employees/${empId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ department: deptName }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed to add member");
      setSuccessId(empId);
      setTimeout(() => {
        setAllEmployees((prev) => prev.filter((e) => e.id !== empId));
        setSuccessId(null);
        onAdded();
      }, 600);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setAdding(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-semibold text-slate-800">Add Member</h2>
            <p className="text-xs text-slate-400 mt-0.5">Assign an employee to {deptName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-slate-100 shrink-0">
          <input
            type="text"
            placeholder="Search employees by name, email, or position…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {error && (
          <div className="mx-6 mt-3 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        {/* Employee list */}
        <div className="flex-1 overflow-y-auto px-6 py-3">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : candidates.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-slate-400">
                {search ? "No matching employees found." : "All employees are already in this department."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {candidates.map((emp) => (
                <div
                  key={emp.id}
                  className={`flex items-center justify-between p-3 border rounded-xl transition-colors ${
                    successId === emp.id
                      ? "border-green-300 bg-green-50"
                      : "border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {emp.firstName} {emp.lastName}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {emp.position}
                      {(emp as { department?: string | null }).department
                        ? ` · ${(emp as { department?: string | null }).department}`
                        : " · No department"}
                    </p>
                  </div>
                  {successId === emp.id ? (
                    <span className="flex items-center gap-1 text-green-600 text-xs font-medium shrink-0">
                      <CheckCircle className="h-4 w-4" /> Added
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAdd(emp.id)}
                      disabled={adding === emp.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg disabled:opacity-50 transition-colors shrink-0"
                    >
                      {adding === emp.id
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Plus className="h-3.5 w-3.5" />}
                      Add
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const fmt = (n: number) =>
  `₱${Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

const PAYROLL_STATUS_STYLES: Record<string, string> = {
  DRAFT:    "bg-slate-100 text-slate-600",
  APPROVED: "bg-blue-100 text-blue-700",
  PAID:     "bg-green-100 text-green-700",
  VOIDED:   "bg-red-100 text-red-600",
};

/* ------------------------------------------------------------------ */
/*  Ripple button                                                      */
/* ------------------------------------------------------------------ */

interface Ripple { id: number; x: number; y: number; size: number }

function RippleButton({
  children, className = "", onClick, disabled = false,
}: {
  children: React.ReactNode; className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
}) {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  function createRipple(e: React.MouseEvent<HTMLButtonElement>) {
    if (disabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const id   = Date.now();
    setRipples((p) => [...p, { id, x: e.clientX - rect.left - size / 2, y: e.clientY - rect.top - size / 2, size }]);
    setTimeout(() => setRipples((p) => p.filter((r) => r.id !== id)), 600);
  }

  return (
    <button
      disabled={disabled}
      onClick={(e) => { createRipple(e); onClick?.(e); }}
      className={`relative overflow-hidden ${className}`}
    >
      {children}
      {ripples.map((r) => (
        <span key={r.id} className="absolute rounded-full bg-white/40 animate-ripple pointer-events-none"
          style={{ width: r.size, height: r.size, top: r.y, left: r.x }} />
      ))}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  SVG icons                                                          */
/* ------------------------------------------------------------------ */

function DepartmentIcon() {
  return (
    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow shrink-0">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white">
        <rect x="3"  y="10" width="6" height="10" stroke="currentColor" strokeWidth="1.5" />
        <rect x="9"  y="6"  width="6" height="14" stroke="currentColor" strokeWidth="1.5" />
        <rect x="15" y="12" width="6" height="8"  stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

function CrownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M3 10L7 4L12 10L17 4L21 10V20H3V10Z" stroke="#EAB308" strokeWidth="1.5" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Status badge (employees)                                           */
/* ------------------------------------------------------------------ */

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ACTIVE:     "bg-green-100 text-green-700",
    ON_LEAVE:   "bg-amber-100 text-amber-700",
    INACTIVE:   "bg-slate-100 text-slate-500",
    RESIGNED:   "bg-red-50 text-red-600",
    TERMINATED: "bg-red-100 text-red-700",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? "bg-slate-100 text-slate-500"}`}>
      {status.replace("_", " ")}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Stat card                                                          */
/* ------------------------------------------------------------------ */

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className={`text-xs mt-1 font-medium ${accent}`}>{label}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Payroll runs tab content                                           */
/* ------------------------------------------------------------------ */

function PayrollRunsTab() {
  const [runs, setRuns]           = useState<PayrollRun[]>([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [actioning, setActioning] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      const res  = await fetch(`/api/admin/hr/payroll?${params}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setRuns(json.data.data);
      setTotal(json.data.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const approve = async (id: string) => {
    setActioning(id);
    try {
      const res  = await fetch(`/api/admin/hr/payroll/${id}/approve`, { method: "POST" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    } finally {
      setActioning(null);
    }
  };

  const markPaid = async (id: string) => {
    const payDate = prompt("Enter pay date (YYYY-MM-DD):", new Date().toISOString().split("T")[0]);
    if (!payDate) return;
    setActioning(id);
    try {
      const res  = await fetch(`/api/admin/hr/payroll/${id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payDate }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    } finally {
      setActioning(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Sub-header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-slate-800">Payroll Runs</p>
          <p className="text-xs text-slate-400 mt-0.5">{total} total payroll runs</p>
        </div>
        <Link
          href="/admin/hr/payroll/new"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-xl transition font-medium"
        >
          <Plus className="h-4 w-4" /> New Payroll Run
        </Link>
      </div>

      {/* Filter */}
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <option value="">All Status</option>
        <option value="DRAFT">Draft</option>
        <option value="APPROVED">Approved</option>
        <option value="PAID">Paid</option>
      </select>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : runs.length === 0 ? (
        <div className="border border-dashed border-slate-200 rounded-xl p-10 text-center">
          <DollarSign className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium text-sm">No payroll runs yet</p>
          <p className="text-xs text-slate-400 mt-1">Create your first payroll run to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {runs.map((run) => (
            <motion.div
              key={run.id}
              whileHover={{ scale: 1.005 }}
              className="bg-slate-50 border border-slate-200 rounded-xl p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono font-semibold text-slate-800">{run.runNumber}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PAYROLL_STATUS_STYLES[run.status]}`}>
                      {run.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">
                    Period: {new Date(run.periodStart).toLocaleDateString("en-PH")} — {new Date(run.periodEnd).toLocaleDateString("en-PH")}
                    {run.payDate && ` · Pay Date: ${new Date(run.payDate).toLocaleDateString("en-PH")}`}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{run._count.lines} employees</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-slate-400">Total Net Pay</p>
                  <p className="text-lg font-bold text-indigo-700">{fmt(run.totalNet)}</p>
                  <p className="text-xs text-slate-400">
                    Gross: {fmt(run.totalGross)} · Deductions: {fmt(run.totalDeductions)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-200">
                <Link
                  href={`/admin/hr/payroll/${run.id}`}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  View Payslips
                </Link>
                {run.status === "DRAFT" && (
                  <RippleButton
                    onClick={() => approve(run.id)}
                    disabled={actioning === run.id}
                    className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
                  >
                    {actioning === run.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <CheckCircle className="h-3.5 w-3.5" />}
                    Approve
                  </RippleButton>
                )}
                {run.status === "APPROVED" && (
                  <RippleButton
                    onClick={() => markPaid(run.id)}
                    disabled={actioning === run.id}
                    className="flex items-center gap-1.5 text-sm text-green-600 hover:text-green-800 font-medium disabled:opacity-50"
                  >
                    {actioning === run.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <DollarSign className="h-3.5 w-3.5" />}
                    Mark as Paid
                  </RippleButton>
                )}
                {run.status === "PAID" && (
                  <span className="flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Paid on {run.payDate ? new Date(run.payDate).toLocaleDateString("en-PH") : "—"}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  IT Assets Tab                                                       */
/* ------------------------------------------------------------------ */

const IT_STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  AVAILABLE:    { label: "Available",    bg: "bg-green-100",  text: "text-green-700",  icon: <Package     className="h-3.5 w-3.5" /> },
  ASSIGNED:     { label: "Assigned",     bg: "bg-blue-100",   text: "text-blue-700",   icon: <UserCheck   className="h-3.5 w-3.5" /> },
  IN_REPAIR:    { label: "In Repair",    bg: "bg-amber-100",  text: "text-amber-700",  icon: <Wrench      className="h-3.5 w-3.5" /> },
  FOR_DISPOSAL: { label: "For Disposal", bg: "bg-red-100",    text: "text-red-600",    icon: <Trash2      className="h-3.5 w-3.5" /> },
  RETIRED:      { label: "Retired",      bg: "bg-slate-100",  text: "text-slate-500",  icon: <Archive     className="h-3.5 w-3.5" /> },
};

function ItStatusBadge({ status }: { status: string }) {
  const cfg = IT_STATUS_CONFIG[status] ?? { label: status, bg: "bg-slate-100", text: "text-slate-500", icon: null };
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>{cfg.icon}{cfg.label}</span>;
}

function ItAssetsTab() {
  const [assets, setAssets]     = useState<ItAsset[]>([]);
  const [stats, setStats]       = useState<ItStats | null>(null);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [statusF, setStatusF]   = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (statusF) p.set("status", statusF);
      if (search)  p.set("search", search);
      p.set("limit", "100");

      const [aRes, sRes] = await Promise.all([
        fetch(`/api/admin/it/assets?${p}`),
        fetch("/api/admin/it/assets?stats=1"),
      ]);
      const [aJson, sJson] = await Promise.all([aRes.json(), sRes.json()]);
      if (aJson.success) setAssets(aJson.data.data);
      if (sJson.success) setStats(sJson.data);
    } catch { /* */ } finally {
      setLoading(false);
    }
  }, [statusF, search]);

  useEffect(() => { load(); }, [load]);

  const peso = (n: number | null) => n != null ? `₱${Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2 })}` : "—";

  return (
    <div className="space-y-5">
      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {([
            { label: "Total",      value: stats.total,       color: "text-slate-900" },
            { label: "Available",  value: stats.available,   color: "text-green-700" },
            { label: "Assigned",   value: stats.assigned,    color: "text-blue-700" },
            { label: "In Repair",  value: stats.inRepair,    color: "text-amber-700" },
            { label: "Disposal",   value: stats.forDisposal, color: "text-red-600" },
            { label: "Retired",    value: stats.retired,     color: "text-slate-500" },
          ] as const).map((c) => (
            <div key={c.label} className="bg-slate-50 rounded-xl p-3 text-center">
              <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{c.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search assets…"
            className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <select value={statusF} onChange={(e) => setStatusF(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">All Status</option>
          <option value="AVAILABLE">Available</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="IN_REPAIR">In Repair</option>
          <option value="FOR_DISPOSAL">For Disposal</option>
          <option value="RETIRED">Retired</option>
        </select>
        <Link href="/admin/it/assets" className="ml-auto text-sm text-indigo-600 hover:text-indigo-800 font-medium">
          Open Full View →
        </Link>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : assets.length === 0 ? (
        <div className="text-center py-10">
          <Monitor className="h-10 w-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No IT assets yet</p>
          <Link href="/admin/it/assets" className="text-sm text-indigo-600 hover:underline mt-1 inline-block">Add your first asset →</Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-2.5 text-left">Asset</th>
                <th className="px-4 py-2.5 text-center">Status</th>
                <th className="px-4 py-2.5 text-left">Assigned To</th>
                <th className="px-4 py-2.5 text-right">Cost</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assets.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{a.assetName}</p>
                    <p className="text-xs text-slate-400">{a.assetTag}{a.brand ? ` · ${a.brand}` : ""}{a.model ? ` ${a.model}` : ""}</p>
                  </td>
                  <td className="px-4 py-3 text-center"><ItStatusBadge status={a.status} /></td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    {a.assignedTo ? `${a.assignedTo.firstName} ${a.assignedTo.lastName}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-slate-600 font-mono">{peso(a.purchaseCost)}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/it/assets/${a.id}`} className="text-indigo-600 hover:text-indigo-800">
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  HR Overview Tab (Administration & HR)                              */
/* ------------------------------------------------------------------ */

const LEAVE_STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  PENDING:  { label: "Pending",  bg: "bg-amber-100",  text: "text-amber-700" },
  APPROVED: { label: "Approved", bg: "bg-green-100",  text: "text-green-700" },
  REJECTED: { label: "Rejected", bg: "bg-red-100",    text: "text-red-600"   },
};

function HrOverviewTab() {
  const [leaves, setLeaves]         = useState<LeaveRequest[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loadingL, setLoadingL]     = useState(true);
  const [loadingA, setLoadingA]     = useState(true);

  useEffect(() => {
    fetch("/api/admin/hr/leave?status=PENDING&limit=8")
      .then((r) => r.json())
      .then((j) => { if (j.success) setLeaves(j.data.data ?? []); })
      .finally(() => setLoadingL(false));

    const today = new Date().toISOString().split("T")[0];
    fetch(`/api/admin/hr/attendance?date=${today}`)
      .then((r) => r.json())
      .then((j) => { if (j.success) setAttendance(j.data ?? []); })
      .finally(() => setLoadingA(false));
  }, []);

  const present  = attendance.filter((a) => a.status === "PRESENT").length;
  const late     = attendance.filter((a) => a.status === "LATE").length;
  const absent   = attendance.filter((a) => a.status === "ABSENT").length;

  return (
    <div className="space-y-6">
      {/* Today's Attendance */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-500" /> Today&apos;s Attendance
          </h3>
          <Link href="/admin/hr/attendance" className="text-xs text-indigo-600 hover:underline">View All →</Link>
        </div>
        {loadingA ? (
          <div className="flex items-center justify-center py-6 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {([
              { label: "Present", value: present, color: "text-green-700", bg: "bg-green-50" },
              { label: "Late",    value: late,    color: "text-amber-700", bg: "bg-amber-50" },
              { label: "Absent",  value: absent,  color: "text-red-600",   bg: "bg-red-50"   },
            ]).map((s) => (
              <div key={s.label} className={`${s.bg} rounded-xl p-4 text-center`}>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Leave Requests */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-indigo-500" /> Pending Leave Requests
          </h3>
          <Link href="/admin/hr/leave" className="text-xs text-indigo-600 hover:underline">View All →</Link>
        </div>
        {loadingL ? (
          <div className="flex items-center justify-center py-6 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : leaves.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-8 w-8 text-green-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No pending leave requests</p>
          </div>
        ) : (
          <div className="space-y-2">
            {leaves.map((req) => {
              const cfg = LEAVE_STATUS_CONFIG[req.status] ?? { label: req.status, bg: "bg-slate-100", text: "text-slate-600" };
              const start = new Date(req.startDate).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
              const end   = new Date(req.endDate).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
              return (
                <div key={req.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800">
                      {req.employee ? `${req.employee.firstName} ${req.employee.lastName}` : "—"}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {req.leaveType.replace(/_/g, " ")} · {start} – {end}
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                    {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
        {([
          { label: "Employees",   href: "/admin/hr/employees",          icon: <Users className="h-4 w-4" /> },
          { label: "Leave",       href: "/admin/hr/leave",              icon: <Calendar className="h-4 w-4" /> },
          { label: "Attendance",  href: "/admin/hr/attendance",         icon: <ClipboardList className="h-4 w-4" /> },
        ]).map((l) => (
          <Link key={l.label} href={l.href}
            className="flex items-center gap-2 p-3 border border-slate-200 rounded-xl text-sm text-slate-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/40 transition">
            {l.icon} {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CRM Tab (Sales & Marketing)                                        */
/* ------------------------------------------------------------------ */

const CRM_STAGE_LABELS: Record<string, string> = {
  NEW_LEAD: "New Lead", QUALIFIED: "Qualified", PROPOSAL: "Proposal",
  NEGOTIATION: "Negotiation", WON: "Won", LOST: "Lost",
};

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  CALL:    <PhoneCall className="h-3.5 w-3.5" />,
  EMAIL:   <Briefcase className="h-3.5 w-3.5" />,
  MEETING: <Users className="h-3.5 w-3.5" />,
};

function CrmTab() {
  const [data, setData]       = useState<CrmDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/sales/dashboard")
      .then((r) => r.json())
      .then((j) => { if (j.success) setData(j.data); })
      .finally(() => setLoading(false));
  }, []);

  const peso = (n: number) =>
    `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 0 })}`;

  if (loading) {
    return <div className="flex items-center justify-center py-12 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }

  if (!data) {
    return (
      <div className="text-center py-10">
        <AlertCircle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-500">Unable to load CRM data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {([
          { label: "Contacts",       value: data.kpis.totalContacts,              icon: <Users className="h-4 w-4 text-indigo-500" />,  color: "text-indigo-700" },
          { label: "Deals",          value: data.kpis.totalDeals,                 icon: <Briefcase className="h-4 w-4 text-purple-500" />, color: "text-purple-700" },
          { label: "Pipeline Value", value: peso(data.kpis.pipelineValue),        icon: <TrendingUp className="h-4 w-4 text-green-500" />, color: "text-green-700" },
          { label: "Won This Month", value: peso(data.kpis.wonThisMonth),         icon: <CheckCircle className="h-4 w-4 text-emerald-500" />, color: "text-emerald-700" },
        ]).map((k) => (
          <div key={k.label} className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">{k.icon}<p className="text-xs text-slate-500">{k.label}</p></div>
            <p className={`text-lg font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Deal Funnel */}
      {data.funnel.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-indigo-500" /> Deal Pipeline
          </h3>
          <div className="space-y-2">
            {data.funnel.map((stage) => (
              <div key={stage.stage} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-28 shrink-0">{CRM_STAGE_LABELS[stage.stage] ?? stage.stage}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-indigo-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (stage.count / Math.max(1, data.funnel[0]?.count ?? 1)) * 100)}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-slate-700 w-6 text-right">{stage.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activities */}
      {data.recentActivities.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-700">Recent Activity</h3>
            <Link href="/admin/sales/activities" className="text-xs text-indigo-600 hover:underline">View All →</Link>
          </div>
          <div className="space-y-2">
            {data.recentActivities.slice(0, 5).map((act) => (
              <div key={act.id} className="flex items-start gap-3 p-3 border border-slate-100 rounded-xl">
                <div className="mt-0.5 text-slate-400">{ACTIVITY_ICONS[act.activityType] ?? <PhoneCall className="h-3.5 w-3.5" />}</div>
                <div className="min-w-0">
                  <p className="text-sm text-slate-700 truncate">{act.subject}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {act.contact ? `${act.contact.firstName} ${act.contact.lastName}` : ""}
                    {act.deal ? ` · ${act.deal.title}` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
        {([
          { label: "Contacts", href: "/admin/sales/contacts",    icon: <Users className="h-4 w-4" /> },
          { label: "Deals",    href: "/admin/sales/deals",       icon: <Briefcase className="h-4 w-4" /> },
          { label: "Pipeline", href: "/admin/sales",             icon: <TrendingUp className="h-4 w-4" /> },
          { label: "Tasks",    href: "/admin/sales/tasks",       icon: <ClipboardList className="h-4 w-4" /> },
        ]).map((l) => (
          <Link key={l.label} href={l.href}
            className="flex items-center gap-2 p-3 border border-slate-200 rounded-xl text-sm text-slate-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/40 transition">
            {l.icon} {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function AdminDepartmentDetailPage() {
  const params = useParams();
  const slug   = typeof params.slug === "string" ? params.slug : "";
  const dept   = DEPARTMENTS.find((d) => d.slug === slug) ?? null;

  const isFinance = slug === "finance-payroll";
  const isIT      = slug === "it-systems";
  const isHR      = slug === "administration-hr";
  const isSales   = slug === "sales-marketing";
  const TABS: Tab[] = isFinance
    ? ["members", "payroll", "activity", "settings"]
    : isIT
      ? ["members", "assets", "activity", "settings"]
      : isHR
        ? ["members", "hr", "activity", "settings"]
        : isSales
          ? ["members", "crm", "activity", "settings"]
          : ["members", "activity", "settings"];

  const [tab, setTab]             = useState<Tab>("members");
  const [members, setMembers]     = useState<Employee[]>([]);
  const [headId, setHeadId]       = useState<string | null>(null);
  const [search, setSearch]       = useState("");
  const [loading, setLoading]     = useState(true);
  const [deptName, setDeptName]   = useState(dept?.name ?? "");
  const [deptDesc, setDeptDesc]   = useState(dept?.description ?? "");
  const [showAddModal, setShowAddModal] = useState(false);

  const loadMembers = useCallback(() => {
    if (!dept) return;
    setLoading(true);
    fetch(`/api/admin/hr/employees?department=${encodeURIComponent(dept.name)}&limit=100`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success) {
          const list: Employee[] = j.data.data.map((e: {
            id: string; firstName: string; lastName: string;
            email: string; phone?: string | null;
            position: string; status: string; employeeNumber?: string | null;
          }) => ({ id: e.id, firstName: e.firstName, lastName: e.lastName, email: e.email, phone: e.phone ?? null, position: e.position, status: e.status, employeeNumber: e.employeeNumber ?? null }));
          setMembers(list);
          setHeadId((prev) => (list.find((m) => m.id === prev) ? prev : list[0]?.id ?? null));
        }
      })
      .finally(() => setLoading(false));
  }, [dept]);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  if (!dept) {
    return (
      <div className="p-6">
        <Link href="/admin/departments" className="text-indigo-600 hover:underline text-sm">← Back to Departments</Link>
        <p className="mt-4 text-slate-500 text-sm">Department not found.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const filtered = members.filter((m) =>
    `${m.firstName} ${m.lastName}`.toLowerCase().includes(search.toLowerCase()),
  );
  const head     = members.find((m) => m.id === headId);
  const active   = members.filter((m) => m.status === "ACTIVE").length;
  const onLeave  = members.filter((m) => m.status === "ON_LEAVE").length;
  const inactive = members.filter((m) => !["ACTIVE", "ON_LEAVE"].includes(m.status)).length;

  function removeMember(id: string) {
    setMembers((p) => p.filter((m) => m.id !== id));
    if (headId === id) setHeadId(members.find((m) => m.id !== id)?.id ?? null);
  }

  return (
    <div className="p-6 space-y-6">
      <style>{`
        @keyframes ripple { 0% { transform: scale(0); opacity: 0.6; } 100% { transform: scale(2); opacity: 0; } }
        .animate-ripple { animation: ripple 0.6s linear; }
      `}</style>

      {/* Add Member Modal */}
      {showAddModal && (
        <AddMemberModal
          deptName={dept.name}
          currentMemberIds={new Set(members.map((m) => m.id))}
          onClose={() => setShowAddModal(false)}
          onAdded={loadMembers}
        />
      )}

      {/* Back */}
      <Link href="/admin/departments" className="text-indigo-600 hover:underline text-sm">
        ← Back to Departments
      </Link>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4"
      >
        <div className="flex gap-4 items-center">
          <DepartmentIcon />
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{deptName}</h1>
            <p className="text-slate-500 text-sm">{deptDesc}</p>
            <p className="text-sm mt-2 text-slate-600">
              {members.length} Members
              {head && <> • Head: <span className="font-medium">{head.firstName} {head.lastName}</span></>}
            </p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <RippleButton className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm transition">Edit</RippleButton>
          <RippleButton onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl shadow active:scale-95 transition text-sm font-medium">Add Member</RippleButton>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Members" value={members.length} accent="text-indigo-600" />
        <StatCard label="Active"        value={active}         accent="text-green-600" />
        <StatCard label="On Leave"      value={onLeave}        accent="text-amber-600" />
        <StatCard label="Inactive"      value={inactive}       accent="text-slate-400" />
      </div>

      {/* Tabs */}
      <div className="flex gap-3 flex-wrap">
        {TABS.map((t) => (
          <motion.button
            key={t}
            whileTap={{ scale: 0.95 }}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-sm capitalize transition ${
              tab === t
                ? "bg-indigo-600 text-white shadow"
                : "bg-white border border-slate-200 hover:bg-slate-50 text-slate-600"
            }`}
          >
            {t === "payroll" ? "💵 Payroll Runs"
              : t === "assets" ? "💻 IT Assets"
              : t === "hr"     ? "👥 HR Overview"
              : t === "crm"    ? "📈 Sales & CRM"
              : t}
          </motion.button>
        ))}
      </div>

      {/* Content */}
      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6"
      >
        {/* ── Members ── */}
        {tab === "members" && (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Search members..."
              className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {filtered.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No members found.</p>
            ) : (
              <div className="space-y-2">
                {filtered.map((m) => (
                  <motion.div
                    key={m.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex justify-between items-center p-4 border border-slate-100 rounded-xl"
                  >
                    <div>
                      <div className="font-medium text-slate-900 flex items-center gap-2">
                        {m.firstName} {m.lastName}
                        {m.id === headId && (
                          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-600 font-medium">
                            <CrownIcon /> Head
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-slate-500">{m.email}</div>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4">
                      <span className="text-sm text-slate-500 hidden sm:block">{m.position}</span>
                      <StatusBadge status={m.status} />
                      {m.id !== headId && (
                        <RippleButton onClick={() => setHeadId(m.id)} className="text-indigo-600 text-xs font-medium hover:underline">Set Head</RippleButton>
                      )}
                      <RippleButton onClick={() => removeMember(m.id)} className="text-red-500 text-xs font-medium hover:underline">Remove</RippleButton>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Payroll Runs (Finance & Payroll only) ── */}
        {tab === "payroll" && <PayrollRunsTab />}

        {/* ── IT Assets (IT & Systems only) ── */}
        {tab === "assets" && <ItAssetsTab />}

        {/* ── HR Overview (Administration & HR only) ── */}
        {tab === "hr" && <HrOverviewTab />}

        {/* ── CRM / Sales (Sales & Marketing only) ── */}
        {tab === "crm" && <CrmTab />}

        {/* ── Activity ── */}
        {tab === "activity" && (
          <div className="space-y-3">
            {dept.activities.map((text, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3"
              >
                <div className="w-2 h-2 mt-2 rounded-full bg-indigo-500 shrink-0" />
                <div className="text-sm text-slate-700">{text}</div>
              </motion.div>
            ))}
          </div>
        )}

        {/* ── Settings ── */}
        {tab === "settings" && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Department Name</label>
              <input className="w-full border border-slate-200 rounded-xl px-4 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={deptName} onChange={(e) => setDeptName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Description</label>
              <input className="w-full border border-slate-200 rounded-xl px-4 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={deptDesc} onChange={(e) => setDeptDesc(e.target.value)} />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <RippleButton className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition">Save Changes</RippleButton>
              <RippleButton className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition">Delete Department</RippleButton>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
