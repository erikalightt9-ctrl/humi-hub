"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building2, Users, BookOpen, ChevronLeft, Mail, Briefcase, Shield } from "lucide-react";

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

type Tab = "employees" | "managers" | "courses";

export function CorporateDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const [org, setOrg] = useState<OrgDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("employees");

  useEffect(() => {
    fetch(`/api/admin/corporate/${id}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setOrg(res.data);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-100 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
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
        <button onClick={() => router.back()} className="mt-4 text-sm text-blue-600 hover:underline">
          Go back
        </button>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; count: number; icon: typeof Users }[] = [
    { key: "employees", label: "Employees", count: org.counts.students, icon: Users },
    { key: "managers", label: "Managers", count: org.counts.managers, icon: Shield },
    { key: "courses", label: "Courses", count: org.counts.courses, icon: BookOpen },
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
          {org.planExpiresAt && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Plan Expires</p>
              <p className="text-sm font-medium text-gray-800">
                {new Date(org.planExpiresAt).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}
              </p>
            </div>
          )}
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
            <span className={`text-xs rounded-full px-1.5 py-0.5 font-semibold ${activeTab === key ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-500"}`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
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
                      <td colSpan={4} className="px-6 py-10 text-center text-sm text-gray-400">No employees enrolled yet.</td>
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
                        <td className="px-6 py-4 text-gray-500 text-xs">
                          {new Date(s.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </>
            )}
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
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-sm text-gray-400">No managers assigned yet.</td>
                    </tr>
                  ) : (
                    org.managers.map((m) => (
                      <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">{m.name}</td>
                        <td className="px-6 py-4 text-gray-500">{m.email}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 capitalize">
                            {m.role}
                          </span>
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
                    <tr>
                      <td colSpan={2} className="px-6 py-10 text-center text-sm text-gray-400">No courses enrolled yet.</td>
                    </tr>
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
          </table>
        </div>
      </div>
    </div>
  );
}
