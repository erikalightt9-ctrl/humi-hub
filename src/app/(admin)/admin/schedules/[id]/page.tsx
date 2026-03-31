import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import Link from "next/link";
import { findScheduleById } from "@/lib/repositories/schedule.repository";
import { listSessionDates } from "@/lib/repositories/session-attendance.repository";
import { ScheduleStatusBadge } from "@/components/admin/ScheduleStatusBadge";
import { StudentPaymentBadge } from "@/components/admin/StudentPaymentBadge";
import { WaitlistManager } from "@/components/admin/WaitlistManager";
import { SessionAttendance } from "@/components/admin/SessionAttendance";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronLeft, ExternalLink } from "lucide-react";
import type { StudentPaymentStatus } from "@prisma/client";

export const metadata: Metadata = { title: "Schedule Detail | Humi Hub Admin" };

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const DAY_ABBR: Record<number, string> = {
  0: "Sun", 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat",
};

function formatDays(days: number[]): string {
  return [...days].sort().map((d) => DAY_ABBR[d] ?? "?").join(", ");
}

function toISODate(d: Date): string {
  return d.toISOString().split("T")[0];
}

/* ------------------------------------------------------------------ */
/*  Tab nav — server-rendered via searchParam                          */
/* ------------------------------------------------------------------ */

type Tab = "students" | "waitlist" | "attendance";

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function ScheduleDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const activeTab: Tab =
    sp.tab === "waitlist" ? "waitlist"
    : sp.tab === "attendance" ? "attendance"
    : "students";

  const schedule = await findScheduleById(id);
  if (!schedule) return notFound();

  const sessionDates = await listSessionDates(id);

  const enrolled = schedule._count.students;
  const waitingCount = schedule._count.waitlist;
  const pct = schedule.maxCapacity > 0
    ? Math.round((enrolled / schedule.maxCapacity) * 100)
    : 0;

  const tabClass = (tab: Tab) =>
    `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
      activeTab === tab
        ? "border-indigo-600 text-indigo-700"
        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
    }`;

  return (
    <>
      {/* Back link + header */}
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm" className="gap-1 mb-4 text-gray-600">
          <Link href="/admin/schedules">
            <ChevronLeft className="h-4 w-4" /> Back to Schedules
          </Link>
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{schedule.name}</h1>
            <p className="text-gray-500 text-sm mt-1">{schedule.course.title}</p>
            {schedule.trainer && (
              <p className="text-gray-400 text-xs mt-0.5">
                Trainer: {schedule.trainer.name}
              </p>
            )}
          </div>
          <ScheduleStatusBadge status={schedule.status} />
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Dates</p>
          <p className="text-sm font-medium text-gray-900">
            {new Date(schedule.startDate).toLocaleDateString("en-PH", {
              month: "short", day: "numeric",
            })}
            {" – "}
            {new Date(schedule.endDate).toLocaleDateString("en-PH", {
              month: "short", day: "numeric", year: "numeric",
            })}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Days & Time</p>
          <p className="text-sm font-medium text-gray-900">
            {formatDays(schedule.daysOfWeek)}
          </p>
          <p className="text-xs text-gray-500">
            {schedule.startTime} – {schedule.endTime}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Capacity</p>
          <div className="flex items-center gap-2">
            <Progress value={pct} className="h-2 flex-1" />
            <span className="text-sm font-medium text-gray-900">
              {enrolled}/{schedule.maxCapacity}
            </span>
          </div>
          {waitingCount > 0 && (
            <p className="text-xs text-rose-500 mt-1">{waitingCount} on waitlist</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Enrollment Cut-off</p>
          <p className="text-sm font-medium text-gray-900">
            {schedule.enrollmentCutOffDays} day
            {schedule.enrollmentCutOffDays !== 1 ? "s" : ""} before start
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200 px-2 gap-1">
          <Link href={`/admin/schedules/${id}?tab=students`} className={tabClass("students")}>
            Students ({enrolled})
          </Link>
          <Link href={`/admin/schedules/${id}?tab=waitlist`} className={tabClass("waitlist")}>
            Waitlist
            {waitingCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-xs bg-rose-100 text-rose-600">
                {waitingCount}
              </span>
            )}
          </Link>
          <Link href={`/admin/schedules/${id}?tab=attendance`} className={tabClass("attendance")}>
            Attendance
            {sessionDates.length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-xs bg-indigo-50 text-indigo-700">
                {sessionDates.length}
              </span>
            )}
          </Link>
        </div>

        <div className="p-6">
          {/* Students tab */}
          {activeTab === "students" && (
            schedule.students.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-sm">No students assigned to this schedule yet.</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-center">Access</TableHead>
                    <TableHead className="text-right">Amount Paid</TableHead>
                    <TableHead className="w-[60px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedule.students.map((student) => (
                    <TableRow key={student.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium text-gray-900">
                        {student.name}
                      </TableCell>
                      <TableCell className="text-gray-600 text-sm">
                        {student.email}
                      </TableCell>
                      <TableCell>
                        <StudentPaymentBadge
                          status={student.paymentStatus as StudentPaymentStatus}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            student.accessGranted
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {student.accessGranted ? "Granted" : "No"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-sm text-gray-700">
                        ₱{Number(student.amountPaid).toLocaleString("en-PH", {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell>
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/admin/enrollees/${student.id}`}>
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )
          )}

          {/* Waitlist tab */}
          {activeTab === "waitlist" && (
            <WaitlistManager
              scheduleId={id}
              entries={schedule.waitlist}
            />
          )}

          {/* Attendance tab */}
          {activeTab === "attendance" && (
            <SessionAttendance
              scheduleId={id}
              students={schedule.students.map((s) => ({
                id: s.id,
                name: s.name,
                email: s.email,
              }))}
              sessionDates={sessionDates.map(toISODate)}
            />
          )}
        </div>
      </div>
    </>
  );
}
