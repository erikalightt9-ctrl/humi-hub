"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Loader2, AlertCircle, Plus, Search, Download, UserX,
  ChevronDown, MoreHorizontal, Eye, Pencil, FileText,
  Users, UserCheck, Clock, TrendingDown, Filter, X,
} from "lucide-react";
import { StatusBadge, TypeBadge } from "./_components/StatusBadge";
import { AddEmployeeModal } from "./_components/AddEmployeeModal";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  position: string;
  department: string | null;
  status: string;
  employmentType: string;
  hireDate: string;
  regularizationDate: string | null;
  contracts: { basicSalary: number }[];
}

interface Stats {
  total: number;
  active: number;
  onLeave: number;
  inactive: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                           */
/* ------------------------------------------------------------------ */

const STATUS_OPTIONS = [
  { value: "ACTIVE",     label: "Active" },
  { value: "ON_LEAVE",   label: "On Leave" },
  { value: "AWOL",       label: "AWOL" },
  { value: "RESIGNED",   label: "Resigned" },
  { value: "TERMINATED", label: "Terminated" },
];

const TYPE_OPTIONS = [
  { value: "",             label: "All Types" },
  { value: "REGULAR",      label: "Regular" },
  { value: "PROBATIONARY", label: "Probationary" },
  { value: "CONTRACTUAL",  label: "Contractual" },
  { value: "PART_TIME",    label: "Part-time" },
  { value: "INTERN",       label: "Intern" },
];

const AVATAR_PALETTES = [
  "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300",
  "bg-blue-100   text-blue-700   dark:bg-blue-900/50   dark:text-blue-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
  "bg-amber-100  text-amber-700  dark:bg-amber-900/50  dark:text-amber-300",
  "bg-rose-100   text-rose-700   dark:bg-rose-900/50   dark:text-rose-300",
  "bg-cyan-100   text-cyan-700   dark:bg-cyan-900/50   dark:text-cyan-300",
  "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300",
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function initials(f: string, l: string) { return `${f[0] ?? ""}${l[0] ?? ""}`.toUpperCase(); }
function palette(n: string) { return AVATAR_PALETTES[n.charCodeAt(0) % AVATAR_PALETTES.length]; }
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}
function fmtPeso(n: number) {
  return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 0 })}`;
}

/* ------------------------------------------------------------------ */
/*  StatusChanger — inline dropdown                                     */
/* ------------------------------------------------------------------ */

function StatusChanger({ emp, onChanged }: { emp: Employee; onChanged: (id: string, s: string) => void }) {
  const [open, setOpen]     = useState(false);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const locked = ["RESIGNED", "TERMINATED"].includes(emp.status);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function update(status: string) {
    setOpen(false);
    setSaving(true);
    try {
      const res  = await fetch(`/api/admin/hr/employees/${emp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (json.success) onChanged(emp.id, status);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        disabled={locked || saving}
        onClick={() => setOpen(p => !p)}
        title={locked ? "Cannot change status of separated employees" : "Click to update status"}
        className={`flex items-center gap-1 group/sbtn ${locked ? "cursor-default" : "cursor-pointer"}`}
      >
        <StatusBadge
          status={emp.status}
          tooltip={
            emp.regularizationDate
              ? `Regularized ${fmtDate(emp.regularizationDate)}`
              : undefined
          }
        />
        {!locked && (
          saving
            ? <Loader2 className="h-3 w-3 text-slate-400 animate-spin ml-0.5" />
            : <ChevronDown className={`h-3 w-3 text-slate-400 ml-0.5 transition-transform group-hover/sbtn:text-slate-600 dark:group-hover/sbtn:text-slate-300 ${open ? "rotate-180" : ""}`} />
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-8 z-30 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1.5 min-w-[148px]">
          <p className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Change Status</p>
          {STATUS_OPTIONS.filter(o => o.value !== emp.status).map(opt => (
            <button key={opt.value} onClick={() => update(opt.value)}
              className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors">
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ActionsMenu                                                         */
/* ------------------------------------------------------------------ */

function ActionsMenu({ emp }: { emp: Employee }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(p => !p)}
        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors opacity-0 group-hover/row:opacity-100">
        <MoreHorizontal className="h-4 w-4 text-slate-500 dark:text-slate-400" />
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-30 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1.5 min-w-[168px]">
          <Link href={`/admin/hr/employees/${emp.id}`} onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors">
            <Eye className="h-4 w-4 text-slate-400" /> View 201 File
          </Link>
          <Link href={`/admin/hr/employees/${emp.id}`} onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors">
            <Pencil className="h-4 w-4 text-slate-400" /> Edit Profile
          </Link>
          <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
          <a href={`/api/admin/hr/employees/${emp.id}/export201`}
            className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors">
            <FileText className="h-4 w-4 text-slate-400" /> Export 201 PDF
          </a>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [stats, setStats]         = useState<Stats>({ total: 0, active: 0, onLeave: 0, inactive: 0 });
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const [search, setSearch]           = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter]     = useState("");
  const [deptFilter, setDeptFilter]     = useState("");
  const [showFilters, setShowFilters]   = useState(false);
  const [showModal, setShowModal]       = useState(false);

  const hasFilters = !!(search || statusFilter || typeFilter || deptFilter);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const p = new URLSearchParams({ limit: "500" });
      if (search)       p.set("search",        search);
      if (statusFilter) p.set("status",         statusFilter);
      if (typeFilter)   p.set("employmentType", typeFilter);
      if (deptFilter)   p.set("department",     deptFilter);

      const [empRes, statsRes] = await Promise.all([
        fetch(`/api/admin/hr/employees?${p}`),
        fetch(`/api/admin/hr/employees?stats=1`),
      ]);
      const empJson   = await empRes.json();
      const statsJson = await statsRes.json();
      if (!empJson.success) throw new Error(empJson.error);
      setEmployees(empJson.data.data ?? []);
      if (statsJson.success) setStats(statsJson.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, typeFilter, deptFilter]);

  useEffect(() => { load(); }, [load]);

  /* Auto-regularize: Probationary + Active + hired 6+ months ago → Regular */
  useEffect(() => {
    if (employees.length === 0) return;
    const today = new Date();
    const toRegularize = employees.filter(emp => {
      if (emp.employmentType !== "PROBATIONARY" || emp.status !== "ACTIVE") return false;
      const sixMonths = new Date(emp.hireDate);
      sixMonths.setMonth(sixMonths.getMonth() + 6);
      return today >= sixMonths;
    });
    if (toRegularize.length === 0) return;

    // Optimistically update UI
    setEmployees(prev => prev.map(emp => {
      const match = toRegularize.find(r => r.id === emp.id);
      if (!match) return emp;
      const sixMonths = new Date(emp.hireDate);
      sixMonths.setMonth(sixMonths.getMonth() + 6);
      return { ...emp, employmentType: "REGULAR", regularizationDate: sixMonths.toISOString().split("T")[0] };
    }));

    // Persist to DB in background (fire-and-forget)
    toRegularize.forEach(emp => {
      const sixMonths = new Date(emp.hireDate);
      sixMonths.setMonth(sixMonths.getMonth() + 6);
      fetch(`/api/admin/hr/employees/${emp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employmentType:    "REGULAR",
          regularizationDate: sixMonths.toISOString().split("T")[0],
        }),
      }).catch(() => { /* silent — UI already updated */ });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employees.length]);

  function handleStatusChanged(id: string, status: string) {
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, status } : e));
    setStats(prev => {
      const emp = employees.find(e => e.id === id);
      if (!emp) return prev;
      const next = { ...prev };
      if (emp.status === "ACTIVE")  next.active   = Math.max(0, next.active  - 1);
      if (emp.status === "ON_LEAVE") next.onLeave  = Math.max(0, next.onLeave - 1);
      if (status === "ACTIVE")   next.active  += 1;
      if (status === "ON_LEAVE") next.onLeave += 1;
      return next;
    });
  }

  const STAT_CARDS = [
    { label: "Total Staff",  value: stats.total,   icon: Users,       ring: "bg-indigo-50  dark:bg-indigo-950/60",  text: "text-indigo-600  dark:text-indigo-400" },
    { label: "Active",       value: stats.active,  icon: UserCheck,   ring: "bg-emerald-50 dark:bg-emerald-950/60", text: "text-emerald-600 dark:text-emerald-400" },
    { label: "On Leave",     value: stats.onLeave, icon: Clock,       ring: "bg-amber-50   dark:bg-amber-950/60",   text: "text-amber-600   dark:text-amber-400" },
    { label: "Separated",    value: stats.inactive,icon: TrendingDown, ring: "bg-slate-100  dark:bg-slate-800",      text: "text-slate-500   dark:text-slate-400" },
  ];

  return (
    <div className="p-6 space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Employees</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {stats.total.toLocaleString()} team members across all departments
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/hr/employees/resigned"
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <UserX className="h-4 w-4" /> Separated
          </Link>
          <a href="/api/admin/hr/employees/export"
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <Download className="h-4 w-4" /> Export Excel
          </a>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-xl font-medium transition-colors shadow-sm shadow-indigo-200 dark:shadow-none">
            <Plus className="h-4 w-4" /> Add Employee
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STAT_CARDS.map(({ label, value, icon: Icon, ring, text }) => (
          <div key={label}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
              <div className={`w-8 h-8 ${ring} rounded-lg flex items-center justify-center`}>
                <Icon className={`h-4 w-4 ${text}`} />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white tabular-nums">{value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, email, position…"
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>

        <button
          onClick={() => setShowFilters(p => !p)}
          className={`flex items-center gap-1.5 px-3 py-2.5 text-sm border rounded-xl transition-colors ${
            showFilters || hasFilters
              ? "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
              : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
          }`}>
          <Filter className="h-4 w-4" />
          Filters
          {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400" />}
        </button>

        {hasFilters && (
          <button onClick={() => { setSearch(""); setStatusFilter(""); setTypeFilter(""); setDeptFilter(""); }}
            className="flex items-center gap-1 px-3 py-2.5 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        )}
      </div>

      {/* ── Filter Drawer ── */}
      {showFilters && (
        <div className="flex flex-wrap gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">All Status</option>
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            className="border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
            {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <input value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
            placeholder="Filter by department…"
            className="border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-48" />
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl p-4 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* ── Table ── */}
      {loading ? (
        <div className="flex items-center justify-center py-24 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                  <th className="px-5 py-3.5 text-left">Employee</th>
                  <th className="px-5 py-3.5 text-left">Role & Department</th>
                  <th className="px-5 py-3.5 text-left">Status</th>
                  <th className="px-5 py-3.5 text-left hidden lg:table-cell">Hire Date</th>
                  <th className="px-5 py-3.5 text-right hidden md:table-cell">Salary</th>
                  <th className="px-5 py-3.5 text-right w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                          <Users className="h-7 w-7 text-slate-300 dark:text-slate-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-500 dark:text-slate-400">No employees found</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                            {hasFilters ? "Try adjusting your filters" : "Add your first employee to get started"}
                          </p>
                        </div>
                        {hasFilters && (
                          <button onClick={() => { setSearch(""); setStatusFilter(""); setTypeFilter(""); setDeptFilter(""); }}
                            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                            Clear all filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : employees.map(emp => (
                  <tr key={emp.id}
                    className="group/row hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors duration-100">

                    {/* Employee */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${palette(emp.firstName)}`}>
                          {initials(emp.firstName, emp.lastName)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-white truncate leading-snug">
                            {emp.lastName}, {emp.firstName}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
                            {emp.employeeNumber} · {emp.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-800 dark:text-slate-200 leading-snug">{emp.position}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{emp.department ?? "—"}</p>
                    </td>

                    {/* Status + Type (stacked) */}
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1.5 items-start">
                        <StatusChanger emp={emp} onChanged={handleStatusChanged} />
                        <TypeBadge
                          type={emp.employmentType}
                          tooltip={
                            emp.employmentType === "REGULAR" && emp.regularizationDate
                              ? `Regularized on ${fmtDate(emp.regularizationDate)}`
                              : undefined
                          }
                        />
                      </div>
                    </td>

                    {/* Hire Date */}
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <p className="text-sm text-slate-700 dark:text-slate-300">{fmtDate(emp.hireDate)}</p>
                      {emp.regularizationDate && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                          Reg. {fmtDate(emp.regularizationDate)}
                        </p>
                      )}
                    </td>

                    {/* Salary */}
                    <td className="px-5 py-4 text-right hidden md:table-cell">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                        {emp.contracts[0] ? fmtPeso(Number(emp.contracts[0].basicSalary)) : <span className="text-slate-300 dark:text-slate-600 font-normal">—</span>}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/admin/hr/employees/${emp.id}`}
                          className="px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-lg transition-colors opacity-0 group-hover/row:opacity-100">
                          View 201
                        </Link>
                        <ActionsMenu emp={emp} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          {employees.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Showing <span className="font-semibold text-slate-600 dark:text-slate-300">{employees.length}</span> of <span className="font-semibold text-slate-600 dark:text-slate-300">{stats.total}</span> employees
              </p>
              {hasFilters && (
                <p className="text-xs text-indigo-600 dark:text-indigo-400">Filters active</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Add Employee Modal ── */}
      <AddEmployeeModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onCreated={load}
      />
    </div>
  );
}
