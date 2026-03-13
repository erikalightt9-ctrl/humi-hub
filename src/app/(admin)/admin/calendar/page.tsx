import type { Metadata } from "next";
export const dynamic = "force-dynamic";

import { AdminCalendarSection } from "@/components/admin/AdminCalendarSection";
import { getEventsByDateRange } from "@/lib/repositories/calendar.repository";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Calendar | HUMI Admin" };

export default async function AdminCalendarPage() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [calendarEvents, courses] = await Promise.all([
    getEventsByDateRange(startOfMonth, endOfMonth),
    prisma.course.findMany({ select: { id: true, title: true }, orderBy: { title: "asc" } }),
  ]);

  const calendarItems = calendarEvents.map((e: typeof calendarEvents[number]) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    date: e.date.toISOString(),
    endDate: e.endDate?.toISOString() ?? null,
    type: e.type,
    source: "event" as const,
  }));

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage events and view upcoming schedule
        </p>
      </div>

      <AdminCalendarSection initialItems={calendarItems} courses={courses} />
    </>
  );
}
