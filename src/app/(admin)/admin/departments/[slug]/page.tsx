"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, Plus, CheckCircle, DollarSign, AlertCircle } from "lucide-react";

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
}

interface PayrollRun {
  id: string; runNumber: string;
  periodStart: string; periodEnd: string; payDate: string | null;
  status: "DRAFT" | "APPROVED" | "PAID" | "VOIDED";
  totalGross: number; totalDeductions: number; totalNet: number;
  _count: { lines: number };
}

type Tab = "members" | "activity" | "payroll" | "settings";

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
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function AdminDepartmentDetailPage() {
  const params = useParams();
  const slug   = typeof params.slug === "string" ? params.slug : "";
  const dept   = DEPARTMENTS.find((d) => d.slug === slug) ?? null;

  const isFinance = slug === "finance-payroll";
  const TABS: Tab[] = isFinance
    ? ["members", "payroll", "activity", "settings"]
    : ["members", "activity", "settings"];

  const [tab, setTab]           = useState<Tab>("members");
  const [members, setMembers]   = useState<Employee[]>([]);
  const [headId, setHeadId]     = useState<string | null>(null);
  const [search, setSearch]     = useState("");
  const [loading, setLoading]   = useState(true);
  const [deptName, setDeptName] = useState(dept?.name ?? "");
  const [deptDesc, setDeptDesc] = useState(dept?.description ?? "");

  useEffect(() => {
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
          setHeadId(list[0]?.id ?? null);
        }
      })
      .finally(() => setLoading(false));
  }, [dept?.name]);

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
          <RippleButton className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl shadow active:scale-95 transition text-sm font-medium">Add Member</RippleButton>
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
            {t === "payroll" ? "💵 Payroll Runs" : t}
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
