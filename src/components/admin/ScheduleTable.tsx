"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ExternalLink, Pencil } from "lucide-react";
import { ScheduleStatusBadge } from "./ScheduleStatusBadge";
import type { ScheduleWithCourse } from "@/lib/repositories/schedule.repository";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const DAY_ABBR: Record<number, string> = {
  0: "Sun",
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
};

function formatDays(days: number[]): string {
  const sorted = [...days].sort();

  // Common patterns
  const key = sorted.join(",");
  if (key === "1,3,5") return "MWF";
  if (key === "2,4") return "TuTh";
  if (key === "6") return "Sat";
  if (key === "0") return "Sun";
  if (key === "0,6") return "Sat-Sun";

  return sorted.map((d) => DAY_ABBR[d] ?? "?").join(", ");
}

function formatDateRange(start: Date | string, end: Date | string): string {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${s.toLocaleDateString("en-PH", opts)} – ${e.toLocaleDateString("en-PH", { ...opts, year: "numeric" })}`;
}

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface ScheduleTableProps {
  readonly schedules: ReadonlyArray<ScheduleWithCourse>;
  readonly onEdit?: (schedule: ScheduleWithCourse) => void;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ScheduleTable({ schedules, onEdit }: ScheduleTableProps) {
  if (schedules.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-lg font-medium">No schedules found</p>
        <p className="text-sm mt-1">Create a new schedule to get started.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead className="w-[200px]">Name</TableHead>
            <TableHead>Program</TableHead>
            <TableHead>Trainer</TableHead>
            <TableHead>Dates</TableHead>
            <TableHead>Days</TableHead>
            <TableHead>Time</TableHead>
            <TableHead className="w-[160px]">Enrolled / Capacity</TableHead>
            <TableHead className="w-[80px]">Waitlist</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[80px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {schedules.map((s) => {
            const enrolled = s._count.students;
            const pct = s.maxCapacity > 0 ? Math.round((enrolled / s.maxCapacity) * 100) : 0;

            return (
              <TableRow key={s.id} className="hover:bg-gray-50">
                <TableCell className="font-medium text-gray-900">
                  {s.name}
                </TableCell>
                <TableCell className="text-gray-600 text-sm">
                  {s.course.title}
                </TableCell>
                <TableCell className="text-gray-600 text-sm">
                  {s.trainer?.name ?? <span className="text-gray-400 italic">Unassigned</span>}
                </TableCell>
                <TableCell className="text-gray-600 text-sm">
                  {formatDateRange(s.startDate, s.endDate)}
                </TableCell>
                <TableCell className="text-gray-600 text-sm font-medium">
                  {formatDays(s.daysOfWeek)}
                </TableCell>
                <TableCell className="text-gray-600 text-sm">
                  {s.startTime} – {s.endTime}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={pct} className="h-2 w-16" />
                    <span className="text-xs text-gray-600 whitespace-nowrap">
                      {enrolled}/{s.maxCapacity}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {s._count.waitlist > 0 ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-700">
                      {s._count.waitlist}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <ScheduleStatusBadge status={s.status} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(s)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/schedules/${s.id}`}>
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
