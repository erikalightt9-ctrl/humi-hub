"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ScheduleTable } from "./ScheduleTable";
import { ScheduleDialog } from "./ScheduleDialog";
import type { ScheduleWithCourse } from "@/lib/repositories/schedule.repository";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Course {
  readonly id: string;
  readonly title: string;
}

interface SchedulePageClientProps {
  readonly schedules: ReadonlyArray<ScheduleWithCourse>;
  readonly courses: ReadonlyArray<Course>;
}

/* ------------------------------------------------------------------ */
/*  Serialize schedule for dialog                                      */
/* ------------------------------------------------------------------ */

function toDialogSchedule(s: ScheduleWithCourse) {
  return {
    id: s.id,
    name: s.name,
    courseId: s.courseId,
    trainerId: s.trainerId ?? "",
    startDate: new Date(s.startDate).toISOString(),
    endDate: new Date(s.endDate).toISOString(),
    daysOfWeek: s.daysOfWeek,
    startTime: s.startTime,
    endTime: s.endTime,
    maxCapacity: s.maxCapacity,
    enrollmentCutOffDays: s.enrollmentCutOffDays,
    status: s.status,
  };
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function SchedulePageClient({ schedules, courses }: SchedulePageClientProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ReturnType<typeof toDialogSchedule> | null>(null);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(schedule: ScheduleWithCourse) {
    setEditing(toDialogSchedule(schedule));
    setDialogOpen(true);
  }

  function handleSuccess() {
    router.refresh();
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Training Schedules</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage training batches, capacity, and schedules
          </p>
        </div>
        <Button onClick={openCreate} size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> New Schedule
        </Button>
      </div>

      <ScheduleTable schedules={schedules} onEdit={openEdit} />

      <ScheduleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        schedule={editing}
        courses={courses}
        onSuccess={handleSuccess}
      />
    </>
  );
}
