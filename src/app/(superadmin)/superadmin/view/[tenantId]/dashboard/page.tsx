"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import { Users, BookOpen, TrendingUp, DollarSign, Clock } from "lucide-react";

interface Org {
  id: string;
  name: string;
  slug: string;
  plan: string;
  isActive: boolean;
  email: string;
  subdomain: string | null;
  createdAt: string;
}

interface RecentEnrollment {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
  course: { title: string };
}

interface DashboardData {
  org: Org;
  studentCount: number;
  courseCount: number;
  enrollmentCount: number;
  recentEnrollments: RecentEnrollment[];
}

interface PageProps {
  readonly params: Promise<{ tenantId: string }>;
}

const PLAN_BADGE: Record<string, string> = {
  TRIAL: "bg-amber-100 text-amber-700",
  STARTER: "bg-blue-100 text-blue-700",
  PROFESSIONAL: "bg-purple-100 text-purple-700",
  ENTERPRISE: "bg-emerald-100 text-emerald-700",
};

export default function TenantViewDashboard({ params }: PageProps) {
  const { tenantId } = use(params);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/superadmin/view/${tenantId}/dashboard`)
      .then((r) => r.json())
      .then((res: { success: boolean; data: DashboardData; error: string }) => {
        if (res.success) {
          setData(res.data);
        } else {
          setError(res.error ?? "Failed to load dashboard");
        }
      })
      .catch(() => setError("Network error — could not load tenant data"))
      .finally(() => setLoading(false));
  }, [tenantId]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-xl" />
          ))}
        </div>
        <div className="h-48 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-sm font-semibold text-red-700">Error loading tenant dashboard</p>
        <p className="text-xs text-red-500 mt-1">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const { org, studentCount, courseCount, enrollmentCount, recentEnrollments } = data;

  const stats = [
    {
      label: "Students",
      value: studentCount,
      sub: "Registered students",
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Active Courses",
      value: courseCount,
      sub: "Published courses",
      icon: BookOpen,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Enrollments",
      value: enrollmentCount,
      sub: "Total applications",
      icon: TrendingUp,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Plan",
      value: org.plan,
      sub: org.isActive ? "Active tenant" : "Inactive tenant",
      icon: DollarSign,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{org.name}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {org.subdomain ? (
              <span className="font-mono">{org.subdomain}.va-training.com</span>
            ) : (
              org.email
            )}
          </p>
        </div>
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full ${
            PLAN_BADGE[org.plan] ?? "bg-slate-100 text-slate-600"
          }`}
        >
          {org.plan}
        </span>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-slate-500">{label}</p>
              <span className={`p-2 rounded-lg ${bg}`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-400 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Recent enrollments */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-700">Recent Enrollments</h2>
        </div>
        {recentEnrollments.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <TrendingUp className="h-7 w-7 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No enrollments yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-5 py-3 font-medium text-slate-500">Student</th>
                <th className="text-left px-5 py-3 font-medium text-slate-500">Course</th>
                <th className="text-right px-5 py-3 font-medium text-slate-500">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentEnrollments.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900">{e.fullName}</p>
                    <p className="text-xs text-slate-400">{e.email}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{e.course.title}</td>
                  <td className="px-5 py-3 text-right text-slate-400 text-xs">
                    {new Date(e.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
