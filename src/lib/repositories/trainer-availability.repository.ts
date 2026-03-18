import { prisma } from "@/lib/prisma";
import type { TrainerAvailability } from "@prisma/client";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type AvailabilitySlot = {
  readonly id: string;
  readonly dayOfWeek: number;
  readonly startTime: string;
  readonly endTime: string;
};

export type ConflictResult = {
  readonly hasConflict: boolean;
  readonly conflictingDays: number[];
  readonly message: string | null;
};

/* ------------------------------------------------------------------ */
/*  Get all availability slots for a trainer                           */
/* ------------------------------------------------------------------ */

export async function getTrainerAvailability(
  trainerId: string,
): Promise<ReadonlyArray<AvailabilitySlot>> {
  return prisma.trainerAvailability.findMany({
    where: { trainerId },
    select: { id: true, dayOfWeek: true, startTime: true, endTime: true },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });
}

/* ------------------------------------------------------------------ */
/*  Replace all availability for a trainer (full overwrite)            */
/* ------------------------------------------------------------------ */

export interface ReplaceSlotInput {
  readonly dayOfWeek: number;
  readonly startTime: string;
  readonly endTime: string;
}

export async function replaceTrainerAvailability(
  trainerId: string,
  slots: ReadonlyArray<ReplaceSlotInput>,
): Promise<ReadonlyArray<AvailabilitySlot>> {
  await prisma.$transaction([
    prisma.trainerAvailability.deleteMany({ where: { trainerId } }),
    prisma.trainerAvailability.createMany({
      data: slots.map((s) => ({ trainerId, ...s })),
      skipDuplicates: true,
    }),
  ]);

  return getTrainerAvailability(trainerId);
}

/* ------------------------------------------------------------------ */
/*  Check if a schedule conflicts with trainer's availability          */
/*                                                                      */
/*  A conflict = the schedule runs on a day where the trainer has      */
/*  NO availability slot that covers the schedule time window.         */
/*  If trainer has NO availability configured, we treat it as open.    */
/* ------------------------------------------------------------------ */

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m ?? 0);
}

export async function checkScheduleConflict(
  trainerId: string,
  scheduleDays: number[],
  scheduleStart: string,
  scheduleEnd: string,
): Promise<ConflictResult> {
  const slots = await getTrainerAvailability(trainerId);

  // No availability configured → treat as always available
  if (slots.length === 0) {
    return { hasConflict: false, conflictingDays: [], message: null };
  }

  const startMins = timeToMinutes(scheduleStart);
  const endMins = timeToMinutes(scheduleEnd);

  const conflictingDays: number[] = [];

  for (const day of scheduleDays) {
    const slotsForDay = slots.filter((s) => s.dayOfWeek === day);

    // No slot on this day → conflict
    if (slotsForDay.length === 0) {
      conflictingDays.push(day);
      continue;
    }

    // Check if at least one slot covers the schedule window
    const covered = slotsForDay.some(
      (s) =>
        timeToMinutes(s.startTime) <= startMins &&
        timeToMinutes(s.endTime) >= endMins,
    );

    if (!covered) {
      conflictingDays.push(day);
    }
  }

  const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  if (conflictingDays.length === 0) {
    return { hasConflict: false, conflictingDays: [], message: null };
  }

  const dayNames = conflictingDays.map((d) => DAY_NAMES[d] ?? "?").join(", ");
  return {
    hasConflict: true,
    conflictingDays,
    message: `Trainer is unavailable on: ${dayNames} during ${scheduleStart}–${scheduleEnd}`,
  };
}

/* ------------------------------------------------------------------ */
/*  Get availability for multiple trainers (used in ScheduleDialog)   */
/* ------------------------------------------------------------------ */

export async function getAvailabilityByTrainer(
  trainerIds: string[],
): Promise<Record<string, ReadonlyArray<AvailabilitySlot>>> {
  if (trainerIds.length === 0) return {};

  const rows = await prisma.trainerAvailability.findMany({
    where: { trainerId: { in: trainerIds } },
    select: { trainerId: true, id: true, dayOfWeek: true, startTime: true, endTime: true },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  const result: Record<string, AvailabilitySlot[]> = {};
  for (const row of rows) {
    if (!result[row.trainerId]) result[row.trainerId] = [];
    result[row.trainerId].push({
      id: row.id,
      dayOfWeek: row.dayOfWeek,
      startTime: row.startTime,
      endTime: row.endTime,
    });
  }
  return result;
}

/* ------------------------------------------------------------------ */
/*  Trainer utilization stats for analytics                            */
/* ------------------------------------------------------------------ */

export type TrainerUtilizationStat = {
  readonly trainerId: string;
  readonly trainerName: string;
  readonly activeSchedules: number;
  readonly totalStudents: number;
  readonly totalCapacity: number;
  readonly utilizationPct: number;
};

export async function getTrainerUtilizationStats(): Promise<
  ReadonlyArray<TrainerUtilizationStat>
> {
  const trainers = await prisma.trainer.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      schedules: {
        where: { status: { in: ["OPEN", "FULL"] } },
        select: {
          maxCapacity: true,
          _count: { select: { students: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return trainers.map((t) => {
    const activeSchedules = t.schedules.length;
    const totalStudents = t.schedules.reduce((s, sc) => s + sc._count.students, 0);
    const totalCapacity = t.schedules.reduce((s, sc) => s + sc.maxCapacity, 0);
    const utilizationPct =
      totalCapacity > 0 ? Math.round((totalStudents / totalCapacity) * 100) : 0;
    return {
      trainerId: t.id,
      trainerName: t.name,
      activeSchedules,
      totalStudents,
      totalCapacity,
      utilizationPct,
    };
  });
}
