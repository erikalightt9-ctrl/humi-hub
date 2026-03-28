import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { getMergedStudentCalendar } from "@/lib/repositories/calendar.repository";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token?.id || token.role !== "student") {
      return NextResponse.json(
        { success: false, data: null, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Get student's enrolled course
    const student = await prisma.student.findUnique({
      where: { id: token.id as string },
      include: { enrollment: { select: { courseId: true } } },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, data: null, error: "Student not found" },
        { status: 404 },
      );
    }

    const { searchParams } = request.nextUrl;
    const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()), 10);
    const month = parseInt(
      searchParams.get("month") ?? String(new Date().getMonth() + 1),
      10,
    );

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const studentId = token.id as string;

    // Merged course + assignment events
    const courseItems = await getMergedStudentCalendar(
      student.enrollment.courseId,
      startDate,
      endDate,
    );

    // Student's own personal events
    const personalEvents = await prisma.calendarEvent.findMany({
      where: {
        creatorRole: "student",
        createdBy: studentId,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });

    const serializedCourseItems = courseItems.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      date: item.date.toISOString(),
      endDate: item.endDate?.toISOString() ?? null,
      type: item.type as string,
      source: item.source,
    }));

    const serializedPersonalEvents = personalEvents.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      date: e.date.toISOString(),
      endDate: e.endDate?.toISOString() ?? null,
      type: e.type as string,
      source: "student" as const,
    }));

    // Merge, deduplicating by id (personal events take precedence)
    const personalIds = new Set(serializedPersonalEvents.map((e) => e.id));
    const merged = [
      ...serializedCourseItems.filter((e) => !personalIds.has(e.id)),
      ...serializedPersonalEvents,
    ].sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({ success: true, data: merged, error: null });
  } catch (err) {
    console.error("[GET /api/student/calendar]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
