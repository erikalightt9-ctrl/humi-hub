import { prisma } from "@/lib/prisma";
import type { ScheduleFilters, PaginatedResult } from "@/types";
import type { Prisma, Schedule, ScheduleStatus } from "@prisma/client";
import type { Decimal } from "@prisma/client/runtime/client";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type ScheduleWithCourse = Schedule & {
  course: { id: string; slug: string; title: string; price: Decimal };
  trainer: { id: string; name: string } | null;
  _count: { students: number; waitlist: number };
};

export type WaitlistEntryDetail = {
  id: string;
  position: number;
  status: string;
  createdAt: Date;
  enrollment: {
    id: string;
    fullName: string;
    email: string;
  };
};

export type ScheduleDetail = Schedule & {
  course: { id: string; slug: string; title: string; price: Decimal };
  trainer: { id: string; name: string } | null;
  students: ReadonlyArray<{
    id: string;
    name: string;
    email: string;
    paymentStatus: string;
    accessGranted: boolean;
    amountPaid: Decimal;
  }>;
  waitlist: ReadonlyArray<WaitlistEntryDetail>;
  _count: { students: number; waitlist: number };
};

export interface ScheduleStats {
  readonly totalActive: number;
  readonly totalStudents: number;
  readonly availableSlots: number;
  readonly upcomingStarts: number;
  readonly totalWaiting: number;
  readonly seatUtilizationPct: number;
}

export interface ScheduleOption {
  readonly id: string;
  readonly name: string;
  readonly startDate: Date;
  readonly endDate: Date;
  readonly startTime: string;
  readonly endTime: string;
  readonly daysOfWeek: number[];
  readonly maxCapacity: number;
  readonly enrolledCount: number;
  readonly trainerName: string | null;
}

/* ------------------------------------------------------------------ */
/*  List schedules (paginated + filtered)                              */
/* ------------------------------------------------------------------ */

export async function listSchedules(
  filters: ScheduleFilters
): Promise<PaginatedResult<ScheduleWithCourse>> {
  const { search, courseSlug, status, page = 1, limit = 20 } = filters;
  const skip = (page - 1) * limit;

  const where: Prisma.ScheduleWhereInput = {};

  if (status) where.status = status;
  if (courseSlug) where.course = { slug: courseSlug };
  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }

  const [data, total] = await Promise.all([
    prisma.schedule.findMany({
      where,
      include: {
        course: { select: { id: true, slug: true, title: true, price: true } },
        trainer: { select: { id: true, name: true } },
        _count: { select: { students: true, waitlist: true } },
      },
      orderBy: { startDate: "desc" },
      skip,
      take: limit,
    }),
    prisma.schedule.count({ where }),
  ]);

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/* ------------------------------------------------------------------ */
/*  Find single schedule by ID                                         */
/* ------------------------------------------------------------------ */

export async function findScheduleById(id: string): Promise<ScheduleDetail | null> {
  return prisma.schedule.findUnique({
    where: { id },
    include: {
      course: { select: { id: true, slug: true, title: true, price: true } },
      trainer: { select: { id: true, name: true } },
      students: {
        select: {
          id: true,
          name: true,
          email: true,
          paymentStatus: true,
          accessGranted: true,
          amountPaid: true,
        },
        orderBy: { name: "asc" },
      },
      waitlist: {
        where: { status: "WAITING" },
        include: {
          enrollment: { select: { id: true, fullName: true, email: true } },
        },
        orderBy: { position: "asc" },
      },
      _count: { select: { students: true, waitlist: true } },
    },
  });
}

/* ------------------------------------------------------------------ */
/*  Create schedule                                                    */
/* ------------------------------------------------------------------ */

interface CreateScheduleData {
  readonly name: string;
  readonly courseId: string;
  readonly trainerId?: string | null;
  readonly startDate: string;
  readonly endDate: string;
  readonly daysOfWeek: number[];
  readonly startTime: string;
  readonly endTime: string;
  readonly maxCapacity: number;
  readonly enrollmentCutOffDays: number;
}

export async function createSchedule(data: CreateScheduleData): Promise<Schedule> {
  return prisma.schedule.create({
    data: {
      name: data.name,
      courseId: data.courseId,
      trainerId: data.trainerId ?? null,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      daysOfWeek: data.daysOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
      maxCapacity: data.maxCapacity,
      enrollmentCutOffDays: data.enrollmentCutOffDays,
    },
  });
}

/* ------------------------------------------------------------------ */
/*  Update schedule                                                    */
/* ------------------------------------------------------------------ */

interface UpdateScheduleData {
  readonly name?: string;
  readonly courseId?: string;
  readonly trainerId?: string | null;
  readonly startDate?: string;
  readonly endDate?: string;
  readonly daysOfWeek?: number[];
  readonly startTime?: string;
  readonly endTime?: string;
  readonly maxCapacity?: number;
  readonly enrollmentCutOffDays?: number;
  readonly status?: ScheduleStatus;
}

export async function updateSchedule(
  id: string,
  data: UpdateScheduleData
): Promise<Schedule> {
  const updateData: Prisma.ScheduleUpdateInput = {};

  if (data.name !== undefined) updateData.name = data.name;
  if (data.courseId !== undefined) updateData.course = { connect: { id: data.courseId } };
  if (data.trainerId !== undefined) {
    updateData.trainer = data.trainerId
      ? { connect: { id: data.trainerId } }
      : { disconnect: true };
  }
  if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
  if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);
  if (data.daysOfWeek !== undefined) updateData.daysOfWeek = data.daysOfWeek;
  if (data.startTime !== undefined) updateData.startTime = data.startTime;
  if (data.endTime !== undefined) updateData.endTime = data.endTime;
  if (data.maxCapacity !== undefined) updateData.maxCapacity = data.maxCapacity;
  if (data.enrollmentCutOffDays !== undefined) updateData.enrollmentCutOffDays = data.enrollmentCutOffDays;
  if (data.status !== undefined) updateData.status = data.status;

  return prisma.schedule.update({
    where: { id },
    data: updateData,
  });
}

/* ------------------------------------------------------------------ */
/*  Delete schedule (guard: no students)                               */
/* ------------------------------------------------------------------ */

export async function deleteSchedule(id: string): Promise<Schedule> {
  const schedule = await prisma.schedule.findUnique({
    where: { id },
    include: { _count: { select: { students: true } } },
  });

  if (!schedule) {
    throw new Error("Schedule not found");
  }

  if (schedule._count.students > 0) {
    throw new Error(
      `Cannot delete schedule with ${schedule._count.students} assigned student(s). Remove students first.`
    );
  }

  return prisma.schedule.delete({ where: { id } });
}

/* ------------------------------------------------------------------ */
/*  Stats for dashboard / page header                                  */
/* ------------------------------------------------------------------ */

export async function getScheduleStats(): Promise<ScheduleStats> {
  const now = new Date();
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [activeSchedules, upcomingStarts, totalWaiting] = await Promise.all([
    prisma.schedule.findMany({
      where: { status: { in: ["OPEN", "FULL"] } },
      select: { maxCapacity: true, _count: { select: { students: true } } },
    }),
    prisma.schedule.count({
      where: {
        status: { in: ["OPEN", "FULL"] },
        startDate: { gte: now, lte: sevenDaysLater },
      },
    }),
    prisma.waitlist.count({ where: { status: "WAITING" } }),
  ]);

  const totalActive = activeSchedules.length;
  const totalStudents = activeSchedules.reduce((sum, s) => sum + s._count.students, 0);
  const totalCapacity = activeSchedules.reduce((sum, s) => sum + s.maxCapacity, 0);
  const availableSlots = activeSchedules.reduce(
    (sum, s) => sum + Math.max(0, s.maxCapacity - s._count.students),
    0
  );
  const seatUtilizationPct =
    totalCapacity > 0 ? Math.round((totalStudents / totalCapacity) * 100) : 0;

  return {
    totalActive,
    totalStudents,
    availableSlots,
    upcomingStarts,
    totalWaiting,
    seatUtilizationPct,
  };
}

/* ------------------------------------------------------------------ */
/*  Open schedules for a course (enrollee assignment dropdown)         */
/* ------------------------------------------------------------------ */

export async function listOpenSchedulesByCourse(
  courseId: string
): Promise<ReadonlyArray<ScheduleOption>> {
  const now = new Date();

  const schedules = await prisma.schedule.findMany({
    where: {
      courseId,
      status: "OPEN",
      // Cut-off check: only show if startDate is still in the future
      // The cut-off days check is done in application code below
    },
    include: {
      trainer: { select: { name: true } },
      _count: { select: { enrollments: true } },
    },
    orderBy: { startDate: "asc" },
  });

  // Filter by enrollment cut-off: exclude schedules where
  // today >= startDate - enrollmentCutOffDays
  return schedules
    .filter((s) => {
      const cutOffDate = new Date(s.startDate);
      cutOffDate.setDate(cutOffDate.getDate() - s.enrollmentCutOffDays);
      return now < cutOffDate;
    })
    .map((s) => ({
      id: s.id,
      name: s.name,
      startDate: s.startDate,
      endDate: s.endDate,
      startTime: s.startTime,
      endTime: s.endTime,
      daysOfWeek: s.daysOfWeek,
      maxCapacity: s.maxCapacity,
      enrolledCount: s._count.enrollments,
      trainerName: s.trainer?.name ?? null,
    }));
}

/* ------------------------------------------------------------------ */
/*  Update schedule status if full                                     */
/* ------------------------------------------------------------------ */

export async function updateScheduleStatusIfFull(scheduleId: string): Promise<void> {
  const schedule = await prisma.schedule.findUnique({
    where: { id: scheduleId },
    include: { _count: { select: { students: true } } },
  });

  if (schedule && schedule._count.students >= schedule.maxCapacity && schedule.status === "OPEN") {
    await prisma.schedule.update({
      where: { id: scheduleId },
      data: { status: "FULL" },
    });
  }
}

/* ------------------------------------------------------------------ */
/*  Upcoming schedules (for dashboard)                                 */
/* ------------------------------------------------------------------ */

export async function getUpcomingSchedules(limit = 5): Promise<ReadonlyArray<ScheduleWithCourse>> {
  const now = new Date();

  return prisma.schedule.findMany({
    where: {
      status: { in: ["OPEN", "FULL"] },
      startDate: { gte: now },
    },
    include: {
      course: { select: { id: true, slug: true, title: true, price: true } },
      trainer: { select: { id: true, name: true } },
      _count: { select: { students: true, waitlist: true } },
    },
    orderBy: { startDate: "asc" },
    take: limit,
  });
}
