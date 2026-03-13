import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStudentDetail } from "@/lib/repositories/student-management.repository";
import {
  ArrowLeft,
  BookOpen,
  Trophy,
  ClipboardCheck,
  Star,
  Clock,
  Award,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/* ------------------------------------------------------------------ */
/*  Metadata                                                           */
/* ------------------------------------------------------------------ */

export const metadata: Metadata = { title: "Student Detail | HUMI Admin" };

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface PageProps {
  params: Promise<{ id: string }>;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function StatCard({
  label,
  value,
  icon: Icon,
  colorClass,
}: {
  readonly label: string;
  readonly value: string | number;
  readonly icon: typeof BookOpen;
  readonly colorClass: string;
}) {
  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center ${colorClass}`}
          >
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </CardContent>
    </Card>
  );
}

function ProgressBar({ percent }: { readonly percent: number }) {
  const color =
    percent >= 75
      ? "bg-green-500"
      : percent >= 40
        ? "bg-yellow-500"
        : "bg-red-400";

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-gray-600">Course Progress</span>
        <span className="text-sm font-semibold text-gray-900">{percent}%</span>
      </div>
      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(clockIn: string, clockOut: string | null): string {
  const end = clockOut ? new Date(clockOut).getTime() : Date.now();
  const diffMs = end - new Date(clockIn).getTime();
  const totalMinutes = Math.max(0, Math.floor(diffMs / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function StudentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const student = await getStudentDetail(id);

  if (!student) notFound();

  return (
    <>
      {/* Back button + header */}
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 mb-4">
          <Link href="/admin/students">
            <ArrowLeft className="h-4 w-4" /> Back to Students
          </Link>
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {student.name}
            </h1>
            <p className="text-gray-500 text-sm">{student.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 bg-blue-100 rounded-full px-3 py-1">
              <BookOpen className="h-3.5 w-3.5" />
              {student.course.title}
            </span>
            <span className="text-xs text-gray-400">
              Enrolled {formatDate(student.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <ProgressBar percent={student.progress.percent} />
        <p className="text-xs text-gray-400 mt-2">
          {student.progress.completed} of {student.progress.total} lessons
          completed
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Progress"
          value={`${student.progress.percent}%`}
          icon={BookOpen}
          colorClass="text-blue-600 bg-blue-100"
        />
        <StatCard
          label="Quiz Average"
          value={student.quizAverage > 0 ? `${student.quizAverage}%` : "—"}
          icon={Trophy}
          colorClass="text-amber-600 bg-amber-100"
        />
        <StatCard
          label="Assignments"
          value={`${student.assignmentsSubmitted}/${student.totalAssignments}`}
          icon={ClipboardCheck}
          colorClass="text-purple-600 bg-purple-100"
        />
        <StatCard
          label="Total Points"
          value={student.totalPoints.toLocaleString()}
          icon={Star}
          colorClass="text-emerald-600 bg-emerald-100"
        />
      </div>

      {/* Profile details */}
      <Card className="border border-gray-200 shadow-sm mb-6">
        <CardHeader>
          <CardTitle className="text-base">Student Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Full Name</p>
              <p className="font-medium text-gray-900">
                {student.enrollment.fullName}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Contact Number</p>
              <p className="font-medium text-gray-900">
                {student.enrollment.contactNumber}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Date of Birth</p>
              <p className="font-medium text-gray-900">
                {formatDate(student.enrollment.dateOfBirth)}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Employment Status</p>
              <p className="font-medium text-gray-900">
                {student.enrollment.employmentStatus.replace(/_/g, " ")}
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-gray-500">Address</p>
              <p className="font-medium text-gray-900">
                {student.enrollment.address}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Educational Background</p>
              <p className="font-medium text-gray-900">
                {student.enrollment.educationalBackground}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Work Experience</p>
              <p className="font-medium text-gray-900">
                {student.enrollment.workExperience || "—"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two-column layout for detailed data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Recent Attendance */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              Recent Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {student.recentAttendance.length > 0 ? (
              <div className="space-y-3">
                {student.recentAttendance.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between text-sm border-b border-gray-100 pb-2 last:border-0"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {formatDate(a.clockIn)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatTime(a.clockIn)}
                        {a.clockOut ? ` → ${formatTime(a.clockOut)}` : " → Present"}
                      </p>
                    </div>
                    <span className="text-xs font-mono text-gray-600">
                      {formatDuration(a.clockIn, a.clockOut)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">
                No attendance records yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Quiz Results */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-gray-500" />
              Quiz Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {student.quizResults.length > 0 ? (
              <div className="space-y-3">
                {student.quizResults.map((q, i) => (
                  <div
                    key={`${q.quizTitle}-${i}`}
                    className="flex items-center justify-between text-sm border-b border-gray-100 pb-2 last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {q.quizTitle}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(q.completedAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <span
                        className={`text-sm font-semibold ${
                          q.passed ? "text-green-600" : "text-red-500"
                        }`}
                      >
                        {q.score}%
                      </span>
                      {q.passed ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">
                No quiz attempts yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Assignment Grades */}
      <Card className="border border-gray-200 shadow-sm mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-gray-500" />
            Assignment Grades
          </CardTitle>
        </CardHeader>
        <CardContent>
          {student.assignmentGrades.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 font-medium text-gray-600">
                      Assignment
                    </th>
                    <th className="text-left py-2 font-medium text-gray-600">
                      Status
                    </th>
                    <th className="text-center py-2 font-medium text-gray-600">
                      Grade
                    </th>
                    <th className="text-right py-2 font-medium text-gray-600">
                      Submitted
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {student.assignmentGrades.map((a, i) => (
                    <tr
                      key={`${a.assignmentTitle}-${i}`}
                      className="border-b border-gray-100 last:border-0"
                    >
                      <td className="py-2.5 font-medium text-gray-900">
                        {a.assignmentTitle}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`inline-flex items-center text-xs font-medium rounded-full px-2 py-0.5 ${
                            a.status === "GRADED"
                              ? "text-green-700 bg-green-100"
                              : a.status === "SUBMITTED"
                                ? "text-blue-700 bg-blue-100"
                                : "text-gray-600 bg-gray-100"
                          }`}
                        >
                          {a.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-center font-semibold text-gray-700">
                        {a.grade !== null ? `${a.grade}%` : "—"}
                      </td>
                      <td className="py-2.5 text-right text-gray-500">
                        {formatDate(a.submittedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">
              No assignments submitted yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Badges */}
      {student.badges.length > 0 && (
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-4 w-4 text-gray-500" />
              Badges Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {student.badges.map((b, i) => (
                <div
                  key={`${b.name}-${i}`}
                  className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2"
                >
                  <span className="text-lg">{b.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {b.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(b.earnedAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
