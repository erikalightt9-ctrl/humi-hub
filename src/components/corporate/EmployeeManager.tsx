"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Loader2,
  X,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface EmployeeEnrollment {
  readonly id: string;
  readonly status: string;
  readonly courseTier: string;
  readonly course: { readonly id: string; readonly title: string; readonly slug: string };
}

interface Employee {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly createdAt: Date | string;
  readonly enrollment: EmployeeEnrollment | null;
}

/* ------------------------------------------------------------------ */
/*  Status badge                                                       */
/* ------------------------------------------------------------------ */

function StatusBadge({ status }: { readonly status: string }) {
  const styles: Record<string, string> = {
    APPROVED: "bg-green-100 text-green-700",
    ACTIVE: "bg-blue-100 text-blue-700",
    PENDING: "bg-yellow-100 text-yellow-700",
    REJECTED: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] ?? "bg-gray-100 text-gray-600"}`}
    >
      {status}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Enroll Student Modal                                              */
/* ------------------------------------------------------------------ */

function EnrollModal({
  onClose,
  onSuccess,
}: {
  readonly onClose: () => void;
  readonly onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [courseId, setCourseId] = useState("");
  const [courseTier, setCourseTier] = useState("BASIC");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [courses, setCourses] = useState<ReadonlyArray<{ readonly id: string; readonly title: string }>>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  // Fetch courses on mount
  useEffect(() => {
    fetch("/api/corporate/courses")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setCourses(json.data);
      })
      .catch(() => {})
      .finally(() => setLoadingCourses(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/corporate/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          courseId,
          courseTier,
        }),
      });

      const json = await res.json();

      if (!json.success) {
        setError(json.error ?? "Failed to enroll employee");
        return;
      }

      onSuccess();
      onClose();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Add Student</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="emp-name">Full Name *</Label>
            <Input
              id="emp-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Employee name"
              required
            />
          </div>
          <div>
            <Label htmlFor="emp-email">Email Address *</Label>
            <Input
              id="emp-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="employee@company.com"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="emp-course">Course *</Label>
            {loadingCourses ? (
              <div className="h-9 flex items-center text-sm text-gray-400">
                Loading courses...
              </div>
            ) : (
              <select
                id="emp-course"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                required
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Select a course</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <Label htmlFor="emp-tier">Tier *</Label>
            <select
              id="emp-tier"
              value={courseTier}
              onChange={(e) => setCourseTier(e.target.value)}
              required
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="BASIC">Basic</option>
              <option value="PROFESSIONAL">Professional</option>
              <option value="ADVANCED">Advanced</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving} className="gap-2">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enrolling...
              </>
            ) : (
              "Enroll Student"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function EmployeeManager({
  employees: initialEmployees,
}: {
  readonly employees: ReadonlyArray<Employee>;
}) {
  const [showEnrollForm, setShowEnrollForm] = useState(false);
  const [employees] = useState(initialEmployees);

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {employees.length} student{employees.length !== 1 ? "s" : ""}
        </p>
        <Button
          className="gap-1.5"
          onClick={() => setShowEnrollForm(true)}
        >
          <Plus className="h-4 w-4" />
          Enroll Student
        </Button>
      </div>

      {/* Enroll modal */}
      {showEnrollForm && (
        <EnrollModal
          onClose={() => setShowEnrollForm(false)}
          onSuccess={() => window.location.reload()}
        />
      )}

      {/* Employee list */}
      {employees.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            No Students Yet
          </h2>
          <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
            Start upskilling your team by enrolling students in training
            courses.
          </p>
          <Button
            onClick={() => setShowEnrollForm(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Enroll First Student
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">
                  Student
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">
                  Course
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">
                  Tier
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {employees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="text-sm font-medium text-gray-900">
                      {employee.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {employee.email}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    {employee.enrollment ? (
                      <div className="flex items-center gap-1.5 text-sm text-gray-700">
                        <BookOpen className="h-3.5 w-3.5 text-gray-400" />
                        {employee.enrollment.course.title}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">
                        Not enrolled
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-600">
                    {employee.enrollment?.courseTier ?? "-"}
                  </td>
                  <td className="px-5 py-3">
                    {employee.enrollment ? (
                      <StatusBadge status={employee.enrollment.status} />
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
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
