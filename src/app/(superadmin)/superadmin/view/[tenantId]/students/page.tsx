"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import { Users, CheckCircle2, XCircle, Info } from "lucide-react";

interface StudentRecord {
  id: string;
  name: string;
  email: string;
  accessGranted: boolean;
  createdAt: string;
  enrollment: {
    course: { title: string };
  };
}

interface PageProps {
  readonly params: Promise<{ tenantId: string }>;
}

export default function TenantViewStudents({ params }: PageProps) {
  const { tenantId } = use(params);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/superadmin/view/${tenantId}/students`)
      .then((r) => r.json())
      .then((res: { success: boolean; data: StudentRecord[]; error: string }) => {
        if (res.success) {
          setStudents(res.data);
        } else {
          setError(res.error ?? "Failed to load students");
        }
      })
      .catch(() => setError("Network error — could not load students"))
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
        <p className="text-sm font-semibold text-red-700">Error loading students</p>
        <p className="text-xs text-red-500 mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Students</h1>
        <p className="text-sm text-slate-500 mt-1">{students.length} student(s) for this tenant</p>
      </div>

      <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
        <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-blue-700">
          Viewing as Super Admin — read-only view. Student management is not available here.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left px-5 py-3 font-medium text-slate-500">Student</th>
              <th className="text-left px-5 py-3 font-medium text-slate-500">Course</th>
              <th className="text-center px-5 py-3 font-medium text-slate-500">Access</th>
              <th className="text-right px-5 py-3 font-medium text-slate-500">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-slate-900">{s.name}</p>
                      <p className="text-xs text-slate-400">{s.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-slate-600 text-xs">{s.enrollment.course.title}</td>
                <td className="px-5 py-3 text-center">
                  {s.accessGranted ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-400 mx-auto" />
                  )}
                </td>
                <td className="px-5 py-3 text-right text-slate-400 text-xs">
                  {new Date(s.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {students.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No students found for this tenant.</p>
          </div>
        )}
      </div>
    </div>
  );
}
