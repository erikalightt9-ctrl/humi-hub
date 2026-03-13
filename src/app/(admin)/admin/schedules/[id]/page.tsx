import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import Link from "next/link";
import { findScheduleById } from "@/lib/repositories/schedule.repository";
import { ScheduleStatusBadge } from "@/components/admin/ScheduleStatusBadge";
import { StudentPaymentBadge } from "@/components/admin/StudentPaymentBadge";
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

export const metadata: Metadata = { title: "Schedule Detail | HUMI Admin" };

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const DAY_ABBR: Record<number, string> = {
  0: "Sun", 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat",
};

function formatDays(days: number[]): string {
  return [...days].sort().map((d) => DAY_ABBR[d] ?? "?").join(", ");
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function ScheduleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const schedule = await findScheduleById(id);

  if (!schedule) return notFound();

  const enrolled = schedule._count.students;
  const pct = schedule.maxCapacity > 0
    ? Math.round((enrolled / schedule.maxCapacity) * 100)
    : 0;

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
          </div>
          <ScheduleStatusBadge status={schedule.status} />
        </div>
      </div>

      {/* Schedule info cards */}
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
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Enrollment Cut-off</p>
          <p className="text-sm font-medium text-gray-900">
            {schedule.enrollmentCutOffDays} day{schedule.enrollmentCutOffDays !== 1 ? "s" : ""} before start
          </p>
        </div>
      </div>

      {/* Students list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">
            Assigned Students ({enrolled})
          </h2>
        </div>

        {schedule.students.length === 0 ? (
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
        )}
      </div>
    </>
  );
}
