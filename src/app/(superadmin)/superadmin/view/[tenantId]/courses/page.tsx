"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import { BookOpen, CheckCircle2, XCircle, Info } from "lucide-react";

interface Course {
  id: string;
  title: string;
  isActive: boolean;
  currency: string;
  createdAt: string;
  _count: { enrollments: number };
}

interface PageProps {
  readonly params: Promise<{ tenantId: string }>;
}

export default function TenantViewCourses({ params }: PageProps) {
  const { tenantId } = use(params);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/superadmin/view/${tenantId}/courses`)
      .then((r) => r.json())
      .then((res: { success: boolean; data: Course[]; error: string }) => {
        if (res.success) {
          setCourses(res.data);
        } else {
          setError(res.error ?? "Failed to load courses");
        }
      })
      .catch(() => setError("Network error — could not load courses"))
      .finally(() => setLoading(false));
  }, [tenantId]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-48" />
        <div className="h-64 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-sm font-semibold text-red-700">Error loading courses</p>
        <p className="text-xs text-red-500 mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Courses</h1>
        <p className="text-sm text-slate-500 mt-1">{courses.length} course(s) for this tenant</p>
      </div>

      <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
        <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-blue-700">
          Viewing as Super Admin — read-only view. Course editing is not available here.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left px-5 py-3 font-medium text-slate-500">Title</th>
              <th className="text-center px-5 py-3 font-medium text-slate-500">Active</th>
              <th className="text-right px-5 py-3 font-medium text-slate-500">Enrollments</th>
              <th className="text-right px-5 py-3 font-medium text-slate-500">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {courses.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    <span className="font-medium text-slate-900">{c.title}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-center">
                  {c.isActive ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-400 mx-auto" />
                  )}
                </td>
                <td className="px-5 py-3 text-right text-slate-700">{c._count.enrollments}</td>
                <td className="px-5 py-3 text-right text-slate-400 text-xs">
                  {new Date(c.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {courses.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No courses found for this tenant.</p>
          </div>
        )}
      </div>
    </div>
  );
}
