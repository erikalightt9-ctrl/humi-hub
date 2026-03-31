import type { Metadata } from "next";
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getMergedStudentCalendar } from "@/lib/repositories/calendar.repository";
import { StudentCalendarSection } from "@/components/student/StudentCalendarSection";

export const metadata: Metadata = { title: "Calendar | Humi Hub Student" };

export default async function StudentCalendarPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as
    | (typeof session & { user: { id: string; role: string } })["user"]
    | undefined;

  if (!user || user.role !== "student") {
    redirect("/student/login");
  }

  const student = await prisma.student.findUnique({
    where: { id: user.id },
    include: { enrollment: { include: { course: true } } },
  });

  if (!student) redirect("/student/login");

  const courseId = student.enrollment.courseId;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const calendarItems = await getMergedStudentCalendar(
    courseId,
    startOfMonth,
    endOfMonth,
  );

  const serializedCalendar = calendarItems.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    date: item.date.toISOString(),
    endDate: item.endDate?.toISOString() ?? null,
    type: item.type,
    source: item.source,
  }));

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
        <p className="text-gray-500 text-sm mt-1">
          View upcoming events and assignment deadlines
        </p>
      </div>

      <StudentCalendarSection initialItems={serializedCalendar} />
    </>
  );
}
