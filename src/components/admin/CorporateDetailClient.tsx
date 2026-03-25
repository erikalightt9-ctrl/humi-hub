"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Building2, Users, BookOpen, ChevronLeft, Mail, Briefcase,
  Shield, Upload, TrendingUp, BarChart2, CheckCircle2, AlertCircle,
  UserPlus, Search, Trash2, X, Loader2, Phone, Tag,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Manager {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  department?: string | null;
  phone?: string | null;
}

interface Course {
  id: string;
  title: string;
  isActive: boolean;
}

interface CourseStat {
  courseId: string;
  title: string;
  enrolledCount: number;
  avgProgress: number;
}

interface AuditLogEntry {
  id: string;
  actorId: string;
  actorRole: string;
  action: string;
  entity: string;
  entityId: string | null;
  meta: Record<string, unknown> | null;
  createdAt: string;
}

interface DashboardStats {
  totalEmployees: number;
  totalManagers: number;
  activeCourses: number;
  avgProgress: number;
  courseStats: CourseStat[];
}

interface OrgDetail {
  id: string;
  name: string;
  email: string;
  industry: string | null;
  maxSeats: number;
  isActive: boolean;
  plan: string;
  planExpiresAt: string | null;
  createdAt: string;
  managers: Manager[];
  employees: Employee[];
  students: Employee[];
  courses: Course[];
  counts: { employees: number; managers: number; courses: number };
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const PLAN_COLORS: Record<string, string> = {
  TRIAL: "bg-gray-100 text-gray-600 border border-gray-200",
  STARTER: "bg-blue-50 text-blue-700 border border-blue-200",
  PROFESSIONAL: "bg-purple-50 text-purple-700 border border-purple-200",
  ENTERPRISE: "bg-amber-50 text-amber-700 border border-amber-200",
};

type Tab = "employees" | "managers" | "courses" | "reports";

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const colors = [
    "bg-blue-100 text-blue-700",
    "bg-purple-100 text-purple-700",
    "bg-emerald-100 text-emerald-700",
    "bg-amber-100 text-amber-700",
    "bg-rose-100 text-rose-700",
    "bg-cyan-100 text-cyan-700",
  ];
  const color = colors[name.charCodeAt(0) % colors.length];
  const sz = size === "sm" ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm";
  return (
    <div className={`${sz} rounded-full ${color} font-semibold flex items-center justify-center shrink-0`}>
      {initials}
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon, color, accent }: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  accent: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className={`h-4 w-4 ${accent}`} />
        </div>
      </div>
      <p className="text-3xl font-extrabold text-gray-900 leading-none">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1.5">{sub}</p>}
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  const color = pct >= 75 ? "bg-emerald-500" : pct >= 40 ? "bg-blue-500" : "bg-amber-400";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-gray-600 w-8 text-right">{pct}%</span>
    </div>
  );
}

function SeatBar({ used, total }: { used: number; total: number }) {
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
  const color = pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-400" : "bg-blue-500";
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-400">Seat usage</span>
        <span className="text-xs font-medium text-gray-600">{used} / {total}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Add Employee Modal                                                 */
/* ------------------------------------------------------------------ */

interface AddEmployeeModalProps {
  orgId: string;
  seatsLeft: number;
  onClose: () => void;
  onAdded: () => void;
}

function AddEmployeeModal({ orgId, seatsLeft, onClose, onAdded }: AddEmployeeModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/corporate/${orgId}/employees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), department: department.trim() || undefined, phone: phone.trim() || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        onAdded();
        onClose();
      } else {
        setError(data.error ?? "Failed to add employee.");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
              <UserPlus className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Add Employee</h2>
              <p className="text-xs text-gray-400">{seatsLeft} seat{seatsLeft !== 1 ? "s" : ""} remaining</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Maria Santos"
                required
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="employee@company.com"
                required
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Department + Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Department</label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Sales"
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 placeholder:text-gray-400"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+63 9XX XXX XXXX"
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 placeholder:text-gray-400"
                />
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-xl px-3 py-2 text-xs text-blue-700 border border-blue-100">
            A temporary password <strong>ChangeMe@123!</strong> will be assigned. The employee must change it on first login.
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim() || !email.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              {saving ? "Adding…" : "Add Employee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function CorporateDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [org, setOrg] = useState<OrgDetail | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("employees");
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  // Upload state
  const [uploadStatus, setUploadStatus] = useState<"idle" | "parsing" | "uploading" | "done" | "error">("idle");
  const [uploadResult, setUploadResult] = useState<{ created: number; skipped: number } | null>(null);
  const [uploadError, setUploadError] = useState("");

  const refreshData = useCallback(() => {
    return Promise.all([
      fetch(`/api/admin/corporate/${id}`).then((r) => r.json()),
      fetch(`/api/admin/corporate/${id}/dashboard`).then((r) => r.json()),
    ]).then(([orgRes, statsRes]) => {
      if (orgRes.success) setOrg(orgRes.data);
      if (statsRes.success) setStats(statsRes.data);
    });
  }, [id]);

  useEffect(() => {
    refreshData().finally(() => setLoading(false));
  }, [refreshData]);

  useEffect(() => {
    if (activeTab === "reports") {
      fetch(`/api/admin/corporate/${id}/audit-logs`)
        .then((r) => r.json())
        .then((d) => { if (d.success) setAuditLogs(d.data); })
        .catch(() => {});
    }
  }, [activeTab, id]);

  function parseCSV(text: string): { name: string; email: string }[] {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/["']/g, ""));
    const nameIdx = headers.findIndex((h) => h.includes("name"));
    const emailIdx = headers.findIndex((h) => h.includes("email"));
    if (nameIdx === -1 || emailIdx === -1) return [];
    return lines.slice(1).flatMap((line) => {
      const cols = line.split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""));
      const name = cols[nameIdx] ?? "";
      const email = cols[emailIdx] ?? "";
      if (!name || !email || !email.includes("@")) return [];
      return [{ name, email }];
    });
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadStatus("parsing");
    setUploadResult(null);
    setUploadError("");
    try {
      const text = await file.text();
      const employees = parseCSV(text);
      if (employees.length === 0) {
        setUploadError("No valid rows found. CSV must have 'name' and 'email' columns.");
        setUploadStatus("error");
        return;
      }
      setUploadStatus("uploading");
      const res = await fetch(`/api/admin/corporate/${id}/upload-employees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employees }),
      });
      const json = await res.json();
      if (json.success) {
        setUploadResult(json.data);
        setUploadStatus("done");
        refreshData();
      } else {
        setUploadError(json.error ?? "Upload failed.");
        setUploadStatus("error");
      }
    } catch {
      setUploadError("Failed to read file.");
      setUploadStatus("error");
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleRemoveEmployee(employeeId: string) {
    if (!confirm("Remove this employee from the organization?")) return;
    setDeletingId(employeeId);
    try {
      const res = await fetch(`/api/admin/corporate/${id}/employees?employeeId=${employeeId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        refreshData();
      }
    } catch { /* ignore */ }
    setDeletingId(null);
  }

  /* ---- Loading skeleton ---- */
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-100 rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!org) {
    return (
      <div className="text-center py-20">
        <Building2 className="h-12 w-12 text-gray-200 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">Company not found.</p>
        <button onClick={() => router.back()} className="mt-4 text-sm text-blue-600 hover:underline">← Go back</button>
      </div>
    );
  }

  const seatsLeft = Math.max(0, org.maxSeats - org.counts.employees);

  const tabs: { key: Tab; label: string; count?: number; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: "employees", label: "Employees", count: org.counts.employees, icon: Users },
    { key: "managers", label: "Managers", count: org.counts.managers, icon: Shield },
    { key: "courses", label: "Courses", count: org.counts.courses, icon: BookOpen },
    { key: "reports", label: "Reports", icon: BarChart2 },
  ];

  // Filtered employees by search
  const filteredEmployees = search.trim()
    ? org.employees.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.email.toLowerCase().includes(search.toLowerCase()) ||
          (s.department ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : org.employees;

  return (
    <>
      {showAddModal && (
        <AddEmployeeModal
          orgId={id}
          seatsLeft={seatsLeft}
          onClose={() => setShowAddModal(false)}
          onAdded={refreshData}
        />
      )}

      <div className="space-y-6">
        {/* Back + header */}
        <div>
          <button
            onClick={() => router.push("/admin/users/corporate")}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition mb-4"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Corporate
          </button>
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0 shadow-sm">
              <Building2 className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">{org.name}</h1>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${PLAN_COLORS[org.plan] ?? "bg-gray-100 text-gray-600"}`}>
                  {org.plan}
                </span>
                <span className={`inline-flex items-center gap-1 text-xs font-medium ${org.isActive ? "text-emerald-700" : "text-gray-400"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${org.isActive ? "bg-emerald-500" : "bg-gray-300"}`} />
                  {org.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">{org.email}</p>
            </div>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Total Employees"
            value={stats?.totalEmployees ?? org.counts.employees}
            sub={`${seatsLeft} seat${seatsLeft !== 1 ? "s" : ""} left`}
            icon={Users}
            color="bg-blue-100"
            accent="text-blue-600"
          />
          <StatCard
            label="Managers"
            value={stats?.totalManagers ?? org.counts.managers}
            icon={Shield}
            color="bg-purple-100"
            accent="text-purple-600"
          />
          <StatCard
            label="Active Courses"
            value={stats?.activeCourses ?? org.counts.courses}
            icon={BookOpen}
            color="bg-emerald-100"
            accent="text-emerald-600"
          />
          <StatCard
            label="Avg Progress"
            value={`${stats?.avgProgress ?? 0}%`}
            sub="across all courses"
            icon={TrendingUp}
            color="bg-amber-100"
            accent="text-amber-600"
          />
        </div>

        {/* Company Info Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-5">Company Information</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-xs text-gray-400 mb-1">Industry</p>
              <div className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
                <Briefcase className="h-3.5 w-3.5 text-gray-400" />
                {org.industry ?? "—"}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Contact</p>
              <div className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
                <Mail className="h-3.5 w-3.5 text-gray-400" />
                {org.email}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Seat Usage</p>
              <SeatBar used={org.counts.employees} total={org.maxSeats} />
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Member Since</p>
              <p className="text-sm font-medium text-gray-800">
                {new Date(org.createdAt).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-1.5 w-fit">
          {tabs.map(({ key, label, count, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === key
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
              {count !== undefined && (
                <span className={`text-xs rounded-full px-1.5 py-0.5 font-semibold min-w-[1.25rem] text-center ${
                  activeTab === key ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-500"
                }`}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

          {/* Employees toolbar */}
          {activeTab === "employees" && (
            <div className="px-5 py-3.5 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              {/* Search */}
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, email, department…"
                  className="w-full pl-8 pr-4 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 placeholder:text-gray-400"
                />
              </div>

              {/* Status messages */}
              <div className="flex items-center gap-2 shrink-0">
                {uploadStatus === "done" && uploadResult && (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1.5 rounded-lg">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {uploadResult.created} added{uploadResult.skipped > 0 ? `, ${uploadResult.skipped} skipped` : ""}
                  </span>
                )}
                {uploadStatus === "error" && (
                  <span className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-100 px-2.5 py-1.5 rounded-lg">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {uploadError}
                  </span>
                )}

                {/* Upload CSV */}
                <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadStatus === "uploading" || uploadStatus === "parsing"}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition"
                >
                  <Upload className="h-3.5 w-3.5" />
                  {uploadStatus === "parsing" ? "Parsing…" : uploadStatus === "uploading" ? "Uploading…" : "Upload CSV"}
                </button>

                {/* Add manually */}
                <button
                  onClick={() => setShowAddModal(true)}
                  disabled={seatsLeft === 0}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
                  title={seatsLeft === 0 ? "No seats remaining" : "Add employee manually"}
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Add Employee
                </button>
              </div>
            </div>
          )}

          {/* Managers toolbar */}
          {activeTab === "managers" && (
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-500">{org.counts.managers} manager{org.counts.managers !== 1 ? "s" : ""}</p>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">

              {/* Employees */}
              {activeTab === "employees" && (
                <>
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/70">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Employee</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Department</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Joined</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredEmployees.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-14 text-center">
                          {org.employees.length === 0 ? (
                            <div>
                              <Users className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                              <p className="text-sm font-medium text-gray-500 mb-1">No employees yet</p>
                              <p className="text-xs text-gray-400 mb-4">Add employees one by one or upload a CSV file</p>
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => setShowAddModal(true)}
                                  disabled={seatsLeft === 0}
                                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition"
                                >
                                  <UserPlus className="h-3.5 w-3.5" />
                                  Add Manually
                                </button>
                                <button
                                  onClick={() => fileRef.current?.click()}
                                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
                                >
                                  <Upload className="h-3.5 w-3.5" />
                                  Upload CSV
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-400">No results for &ldquo;{search}&rdquo;</p>
                          )}
                        </td>
                      </tr>
                    ) : (
                      filteredEmployees.map((s) => (
                        <tr key={s.id} className="hover:bg-blue-50/30 transition-colors group">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <Avatar name={s.name} size="sm" />
                              <span className="font-medium text-gray-900 text-sm">{s.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-gray-500 text-xs">{s.email}</td>
                          <td className="px-5 py-3.5 text-gray-400 text-xs">{s.department ?? "—"}</td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${s.isActive ? "text-emerald-700" : "text-gray-400"}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${s.isActive ? "bg-emerald-500" : "bg-gray-300"}`} />
                              {s.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-gray-400 text-xs">
                            {new Date(s.createdAt).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              onClick={() => handleRemoveEmployee(s.id)}
                              disabled={deletingId === s.id}
                              className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                              title="Remove employee"
                            >
                              {deletingId === s.id
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : <Trash2 className="h-3.5 w-3.5" />
                              }
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </>
              )}

              {/* Managers */}
              {activeTab === "managers" && (
                <>
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/70">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Manager</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Role</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {org.managers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-14 text-center">
                          <Shield className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                          <p className="text-sm text-gray-400">No managers assigned yet.</p>
                        </td>
                      </tr>
                    ) : (
                      org.managers.map((m) => (
                        <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <Avatar name={m.name} size="sm" />
                              <span className="font-medium text-gray-900 text-sm">{m.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-gray-500 text-xs">{m.email}</td>
                          <td className="px-5 py-3.5">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 capitalize">{m.role}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${m.isActive ? "text-emerald-700" : "text-gray-400"}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${m.isActive ? "bg-emerald-500" : "bg-gray-300"}`} />
                              {m.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </>
              )}

              {/* Courses */}
              {activeTab === "courses" && (
                <>
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/70">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Course Title</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {org.courses.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="px-5 py-14 text-center">
                          <BookOpen className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                          <p className="text-sm text-gray-400">No courses enrolled yet.</p>
                        </td>
                      </tr>
                    ) : (
                      org.courses.map((c) => (
                        <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-3.5 font-medium text-gray-900">{c.title}</td>
                          <td className="px-5 py-3.5">
                            <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${c.isActive ? "text-emerald-700" : "text-gray-400"}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${c.isActive ? "bg-emerald-500" : "bg-gray-300"}`} />
                              {c.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </>
              )}

              {/* Reports */}
              {activeTab === "reports" && (
                <>
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/70">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Course</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Enrolled</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider w-52">Avg Progress</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {!stats || stats.courseStats.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-5 py-14 text-center">
                          <BarChart2 className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                          <p className="text-sm text-gray-400">No progress data available yet.</p>
                        </td>
                      </tr>
                    ) : (
                      stats.courseStats.map((cs) => (
                        <tr key={cs.courseId} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-3.5 font-medium text-gray-900">{cs.title}</td>
                          <td className="px-5 py-3.5 text-gray-600">{cs.enrolledCount}</td>
                          <td className="px-5 py-3.5">
                            <ProgressBar value={cs.avgProgress} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </>
              )}
            </table>
          </div>

          {/* Audit log viewer — Reports tab only */}
          {activeTab === "reports" && auditLogs.length > 0 && (
            <div className="px-5 py-4 border-t border-gray-100">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Recent Activity</h3>
              <div className="space-y-2">
                {auditLogs.map((log) => (
                  <div key={log.id} className="flex items-center gap-3 text-xs">
                    <span className={`px-2 py-0.5 rounded-full font-medium ${
                      log.action.includes("CREATE") ? "bg-emerald-100 text-emerald-700" :
                      log.action.includes("DELETE") ? "bg-red-100 text-red-700" :
                      "bg-blue-100 text-blue-700"
                    }`}>
                      {log.action.replace("_", " ")}
                    </span>
                    <span className="text-gray-600">
                      {(log.meta as { name?: string })?.name ?? log.entityId ?? log.entity}
                    </span>
                    <span className="text-gray-400 ml-auto">
                      {new Date(log.createdAt).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer hint */}
          {activeTab === "employees" && org.employees.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-50 bg-gray-50/50 flex items-center justify-between">
              <p className="text-xs text-gray-400">
                CSV format: <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-500 font-mono">name,email</code> — one per row, max 500.
              </p>
              <p className="text-xs text-gray-400">{filteredEmployees.length} of {org.employees.length} shown</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
