import { prisma } from "@/lib/prisma";
import type { CalendarEvent, EventType } from "@prisma/client";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface CalendarEventWithCourse extends CalendarEvent {
  course: { id: string; title: string } | null;
}

export interface UnifiedCalendarItem {
  id: string;
  title: string;
  description: string | null;
  date: Date;
  endDate: Date | null;
  startTime: string | null;
  endTime: string | null;
  type: EventType | "ASSIGNMENT";
  courseId: string | null;
  assignedUserId: string | null;
  creatorRole: string | null;
  source: "event" | "assignment";
}

/** Role-based filter applied to every query */
type CalendarRole = "admin" | "trainer" | "student";

interface RoleContext {
  role: CalendarRole;
  userId: string;
  /** Trainer: list of courseIds they own; Student: list of courseIds enrolled */
  courseIds?: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Build the Prisma `where` clause based on the caller's role.
 * - admin  → all events
 * - trainer → events they created OR events assigned to them
 * - student → published events for courses they're enrolled in (or global)
 */
function roleWhere(ctx: RoleContext): Record<string, unknown> {
  if (ctx.role === "admin") return {};

  if (ctx.role === "trainer") {
    return {
      OR: [
        { createdBy: ctx.userId },
        { assignedUserId: ctx.userId },
      ],
    };
  }

  // student
  const courseIds = ctx.courseIds ?? [];
  return {
    isPublished: true,
    OR: [
      { courseId: null },
      ...(courseIds.length > 0 ? [{ courseId: { in: courseIds } }] : []),
    ],
  };
}

/** Returns minutes since midnight for a "HH:MM" string (null → -1) */
function toMinutes(t: string | null | undefined): number {
  if (!t) return -1;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m ?? 0);
}

/**
 * Overlap detection: newStart < existingEnd && newEnd > existingStart
 * Only checks events on the same date.
 */
export async function hasTimeOverlap(input: {
  date: string;
  startTime: string;
  endTime: string;
  excludeId?: string;
}): Promise<boolean> {
  const events = await prisma.calendarEvent.findMany({
    where: {
      date: new Date(input.date),
      startTime: { not: null },
      endTime: { not: null },
      ...(input.excludeId ? { id: { not: input.excludeId } } : {}),
    },
    select: { startTime: true, endTime: true },
  });

  const newStart = toMinutes(input.startTime);
  const newEnd = toMinutes(input.endTime);

  return events.some((e) => {
    const eStart = toMinutes(e.startTime);
    const eEnd = toMinutes(e.endTime);
    return newStart < eEnd && newEnd > eStart;
  });
}

// ── Admin / Role-based CRUD ───────────────────────────────────────────────────

export async function getEventsByDateRange(
  startDate: Date,
  endDate: Date,
  courseId?: string | null,
  ctx?: RoleContext,
): Promise<ReadonlyArray<CalendarEventWithCourse>> {
  const baseWhere = {
    date: { gte: startDate, lte: endDate },
    ...(courseId ? { OR: [{ courseId }, { courseId: null }] } : {}),
  };

  const roleFilter = ctx ? roleWhere(ctx) : {};

  return prisma.calendarEvent.findMany({
    where: { ...baseWhere, ...roleFilter },
    include: { course: { select: { id: true, title: true } } },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
}

export async function getUpcomingEvents(
  days: number,
  courseId?: string | null,
  ctx?: RoleContext,
): Promise<ReadonlyArray<CalendarEventWithCourse>> {
  const now = new Date();
  const future = new Date();
  future.setDate(future.getDate() + days);

  const baseWhere = {
    date: { gte: now, lte: future },
    isPublished: true,
    ...(courseId ? { OR: [{ courseId }, { courseId: null }] } : {}),
  };

  const roleFilter = ctx ? roleWhere(ctx) : {};

  return prisma.calendarEvent.findMany({
    where: { ...baseWhere, ...roleFilter },
    include: { course: { select: { id: true, title: true } } },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
    take: 10,
  });
}

export async function getEventById(
  id: string,
): Promise<CalendarEventWithCourse | null> {
  return prisma.calendarEvent.findUnique({
    where: { id },
    include: { course: { select: { id: true, title: true } } },
  });
}

export async function createEvent(data: {
  title: string;
  description?: string | null;
  date: Date;
  endDate?: Date | null;
  startTime?: string | null;
  endTime?: string | null;
  type: EventType;
  courseId?: string | null;
  assignedUserId?: string | null;
  createdBy: string;
  creatorRole?: string | null;
  isPublished: boolean;
}): Promise<CalendarEvent> {
  return prisma.calendarEvent.create({ data });
}

export async function updateEvent(
  id: string,
  data: Partial<{
    title: string;
    description: string | null;
    date: Date;
    endDate: Date | null;
    startTime: string | null;
    endTime: string | null;
    type: EventType;
    courseId: string | null;
    assignedUserId: string | null;
    creatorRole: string | null;
    isPublished: boolean;
    googleEventId: string | null;
  }>,
): Promise<CalendarEvent> {
  return prisma.calendarEvent.update({ where: { id }, data });
}

export async function deleteEvent(id: string): Promise<void> {
  await prisma.calendarEvent.delete({ where: { id } });
}

// ── KPI ───────────────────────────────────────────────────────────────────────

export interface CalendarKpi {
  todayCount: number;
  upcomingCount: number;
  /** Free slots = time slots in 8–22 range not covered by any event today */
  freeSlotsToday: number;
}

export async function getCalendarKpi(ctx?: RoleContext): Promise<CalendarKpi> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const roleFilter = ctx ? roleWhere(ctx) : {};

  const [todayEvents, upcomingEvents] = await Promise.all([
    prisma.calendarEvent.findMany({
      where: { date: { gte: today, lt: tomorrow }, ...roleFilter },
      select: { startTime: true, endTime: true },
    }),
    prisma.calendarEvent.count({
      where: { date: { gte: tomorrow, lte: nextWeek }, isPublished: true, ...roleFilter },
    }),
  ]);

  // Compute free 1-hour slots between 08:00 and 22:00 not covered today
  const totalSlots = 14; // 08–22 = 14 hours
  let busySlots = 0;
  for (let hour = 8; hour < 22; hour++) {
    const slotStart = hour * 60;
    const slotEnd = slotStart + 60;
    const covered = todayEvents.some((e) => {
      const s = toMinutes(e.startTime);
      const en = toMinutes(e.endTime);
      if (s < 0 || en < 0) return false;
      return s < slotEnd && en > slotStart;
    });
    if (covered) busySlots++;
  }

  return {
    todayCount: todayEvents.length,
    upcomingCount: upcomingEvents,
    freeSlotsToday: totalSlots - busySlots,
  };
}

// ── Student: Merged Calendar ──────────────────────────────────────────────────

export async function getAssignmentDueDates(
  courseId: string,
  startDate: Date,
  endDate: Date,
): Promise<ReadonlyArray<{ id: string; title: string; dueDate: Date; maxPoints: number }>> {
  const assignments = await prisma.assignment.findMany({
    where: {
      courseId,
      isPublished: true,
      dueDate: { not: null, gte: startDate, lte: endDate },
    },
    select: { id: true, title: true, dueDate: true, maxPoints: true },
    orderBy: { dueDate: "asc" },
  });

  return assignments
    .filter((a): a is typeof a & { dueDate: Date } => a.dueDate !== null)
    .map((a) => ({ id: a.id, title: a.title, dueDate: a.dueDate, maxPoints: a.maxPoints }));
}

export async function getMergedStudentCalendar(
  courseId: string,
  startDate: Date,
  endDate: Date,
): Promise<ReadonlyArray<UnifiedCalendarItem>> {
  const [events, assignments] = await Promise.all([
    prisma.calendarEvent.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        isPublished: true,
        OR: [{ courseId }, { courseId: null }],
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    }),
    getAssignmentDueDates(courseId, startDate, endDate),
  ]);

  const unified: UnifiedCalendarItem[] = [
    ...events.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      date: e.date,
      endDate: e.endDate,
      startTime: e.startTime,
      endTime: e.endTime,
      type: e.type as EventType,
      courseId: e.courseId,
      assignedUserId: e.assignedUserId,
      creatorRole: e.creatorRole,
      source: "event" as const,
    })),
    ...assignments.map((a) => ({
      id: a.id,
      title: `Assignment: ${a.title}`,
      description: `Due — ${a.maxPoints} pts`,
      date: a.dueDate,
      endDate: null,
      startTime: null,
      endTime: null,
      type: "ASSIGNMENT" as const,
      courseId,
      assignedUserId: null,
      creatorRole: null,
      source: "assignment" as const,
    })),
  ];

  return unified.sort((a, b) => a.date.getTime() - b.date.getTime());
}
