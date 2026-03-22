import type { Metadata } from "next";
export const dynamic = "force-dynamic";

import { PremiumCalendar } from "@/components/calendar/PremiumCalendar";
import {
  getEventsByDateRange,
  getCalendarKpi,
} from "@/lib/repositories/calendar.repository";
import { prisma } from "@/lib/prisma";
import type { CalendarEvent } from "@/components/calendar/types";

export const metadata: Metadata = { title: "Calendar | Admin" };

export default async function AdminCalendarPage() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [rawEvents, courses, kpi] = await Promise.all([
    getEventsByDateRange(startOfMonth, endOfMonth),
    prisma.course.findMany({
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
    getCalendarKpi({ role: "admin", userId: "" }),
  ]);

  const initialEvents: CalendarEvent[] = rawEvents.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description ?? null,
    date: e.date.toISOString().slice(0, 10),
    endDate: e.endDate ? e.endDate.toISOString().slice(0, 10) : null,
    startTime: e.startTime ?? null,
    endTime: e.endTime ?? null,
    type: e.type as CalendarEvent["type"],
    courseId: e.courseId ?? null,
    assignedUserId: e.assignedUserId ?? null,
    creatorRole: e.creatorRole ?? null,
    source: "event" as const,
  }));

  return (
    <div className="space-y-2">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage events and schedule
        </p>
      </div>

      <PremiumCalendar
        initialEvents={initialEvents}
        courses={courses}
        kpi={kpi}
      />
    </div>
  );
}
