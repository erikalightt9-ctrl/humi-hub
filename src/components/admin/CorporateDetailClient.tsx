"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Building2, Users, BookOpen, ChevronLeft, Mail, Briefcase,
  Shield, Upload, TrendingUp, BarChart2, CheckCircle2, AlertCircle,
} from "lucide-react";

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
  students: Employee[];
  courses: Course[];
  counts: { students: number; managers: number; courses: number };
}

const PLAN_COLORS: Record<string, string> = {
  TRIAL: "bg-gray-100 text-gray-600",
  STARTER: "bg-blue-100 text-blue-700",
  PROFESSIONAL: "bg-purple-100 text-purple-700",
  ENTERPRISE: "bg-amber-100 text-amber-700",
};

type Tab = "employees" | "managers" | "courses" | "reports";

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-2xl font-extrabold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  const color = pct >= 75 ? "bg-emerald-500" : pct >= 40 ? "bg-blue-500" : "bg-amber-400";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-600 w-8 text-right">{pct}%</span>
    </div>
  );
}

export function CorporateDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [org, setOrg] = useState<OrgDetail | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("employees");

  // Upload state
  const [uploadStatus, setUploadStatus] = useState<"idle" | "parsing" | "uploading" | "done" | "error">("idle");
  const [uploadResult, setUploadResult] = useState<{ created: number; skipped: number } | null>(null);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/corporate/${id}`).then((r) => r.json()),
      fetch(`/api/admin/corporate/${id}/dashboard`).then((r) => r.json()),
    ]).then(([orgRes, statsRes]) => {
      if (orgRes.success) setOrg(orgRes.data);
      if (statsRes.success) setStats(statsRes.data);
    }).finally(() => setLoading(false));
  }, [id]);

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
        // Refresh org data
        fetch(`/api/admin/corporate/${id}`).then((r) => r.json()).then((res) => {
          if (res.success) setOrg(res.data);
        });
        fetch(`/api/admin/corporate/${id}/dashboard`).then((r) => r.json()).then((res) => {
          if (res.success) setStats(res.data);
        });
      } else {
        setUploadError(json.error ?? "Upload failed.");
        setUploadStatus("error");
      }
    } catch {
      setUploadError("Failed to read file. Make sure it's a valid CSV.");
      setUploadStatus("error");
    }

    // Reset input
    if (fileRef.current) fileRef.current.value = "";
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-100 rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="text-center py-16">
        <Building2 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Company not found.</p>
        <button onClick={() => router.back()} className="mt-4 text-sm text-blue-600 hover:underline">Go back</button>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; count?: number; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: "employees", label: "Employees", count: org.counts.students, icon: Users },
    { key: "managers", label: "Managers", count: org.counts.managers, icon: Shield },
    { key: "courses", label: "Courses", count: org.counts.courses, icon: BookOpen },
    { key: "reports", label: "Reports", icon: BarChart2 },
  ];

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div>
        <button
          onClick={() => router.push("/admin/users/corporate")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition mb-3"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Corporate
        </button>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
            <Building2 className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{org.name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{org.email}</p>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Employees"
          value={stats?.totalEmployees ?? org.counts.students}
          sub={`of ${org.maxSeats} seats`}
          icon={Users}
          color="text-blue-600 bg-blue-100"
        />
        <StatCard
          label="Managers"
          value={stats?.totalManagers ?? org.counts.managers}
          icon={Shield}
          color="text-purple-600 bg-purple-100"
        />
        <StatCard
          label="Active Courses"
          value={stats?.activeCourses ?? org.counts.courses}
          icon={BookOpen}
          color="text-emerald-600 bg-emerald-100"
        />
        <StatCard
          label="Avg Progress"
          value={`${stats?.avgProgress ?? 0}%`}
          sub="across all courses"
          icon={TrendingUp}
          color="text-amber-600 bg-amber-100"
        />
      </div>

      {/* Company Info Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Company Information</h2>
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
            <p className="text-sm font-medium text-gray-800">{org.counts.students} / {org.maxSeats}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Plan</p>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${PLAN_COLORS[org.plan] ?? "bg-gray-100 text-gray-600"}`}>
              {org.plan}
            </span>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Status</p>
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${org.isActive ? "text-emerald-700" : "text-gray-400"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${org.isActive ? "bg-emerald-500" : "bg-gray-300"}`} />
              {org.isActive ? "Active" : "Inactive"}
            </span>
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
      <div className="flex gap-1 bg-white rounded-2xl border border-gray-200 p-1 w-fit">
        {tabs.map(({ key, label, count, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === key
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
            {count !== undefined && (
              <span className={`text-xs rounded-full px-1.5 py-0.5 font-semibold ${activeTab === key ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-500"}`}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Employees tab toolbar */}
        {activeTab === "employees" && (
          <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500">{org.counts.students} employee{org.counts.students !== 1 ? "s" : ""}</p>
            <div className="flex items-center gap-2">
              {uploadStatus === "done" && uploadResult && (
                <span className="flex items-center gap-1.5 text-xs text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {uploadResult.created} added{uploadResult.skipped > 0 ? `, ${uploadResult.skipped} skipped` : ""}
                </span>
              )}
              {uploadStatus === "error" && (
                <span className="flex items-center gap-1.5 text-xs text-red-600">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {uploadError}
                </span>
              )}
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploadStatus === "uploading" || uploadStatus === "parsing"}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition"
              >
                <Upload className="h-3.5 w-3.5" />
                {uploadStatus === "parsing" ? "Parsing…" : uploadStatus === "uploading" ? "Uploading…" : "Upload CSV"}
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            {/* Employees */}
            {activeTab === "employees" && (
              <>
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {org.students.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-sm text-gray-400">
                        No employees yet. Upload a CSV to add employees in bulk.
                      </td>
                    </tr>
                  ) : (
                    org.students.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">{s.name}</td>
                        <td className="px-6 py-4 text-gray-500">{s.email}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${s.isActive ? "text-emerald-700" : "text-gray-400"}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${s.isActive ? "bg-emerald-500" : "bg-gray-300"}`} />
                            {s.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-xs">{new Date(s.createdAt).toLocaleDateString()}</td>
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
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {org.managers.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-10 text-center text-sm text-gray-400">No managers assigned yet.</td></tr>
                  ) : (
                    org.managers.map((m) => (
                      <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">{m.name}</td>
                        <td className="px-6 py-4 text-gray-500">{m.email}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 capitalize">{m.role}</span>
                        </td>
                        <td className="px-6 py-4">
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
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Course Title</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {org.courses.length === 0 ? (
                    <tr><td colSpan={2} className="px-6 py-10 text-center text-sm text-gray-400">No courses enrolled yet.</td></tr>
                  ) : (
                    org.courses.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">{c.title}</td>
                        <td className="px-6 py-4">
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
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Course</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Enrolled</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide w-48">Avg Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {!stats || stats.courseStats.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-10 text-center text-sm text-gray-400">
                        No progress data available yet.
                      </td>
                    </tr>
                  ) : (
                    stats.courseStats.map((cs) => (
                      <tr key={cs.courseId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">{cs.title}</td>
                        <td className="px-6 py-4 text-gray-600">{cs.enrolledCount}</td>
                        <td className="px-6 py-4">
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

        {/* CSV upload hint */}
        {activeTab === "employees" && (
          <div className="px-6 py-3 border-t border-gray-50 bg-gray-50/50">
            <p className="text-xs text-gray-400">
              CSV format: <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-600">name,email</code> — one employee per row. Max 500 rows per upload.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
