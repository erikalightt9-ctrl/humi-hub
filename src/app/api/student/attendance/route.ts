import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { clockActionSchema } from "@/lib/validations/attendance.schema";
import {
  getActiveSession,
  getActiveSessionForCourse,
  clockIn,
  clockInForCourse,
  clockOut,
  clockOutForCourse,
} from "@/lib/repositories/attendance.repository";

function jsonError(msg: string, status: number) {
  return NextResponse.json(
    { success: false, data: null, error: msg },
    { status },
  );
}

/* ------------------------------------------------------------------ */
/*  GET  /api/student/attendance[?courseId=xxx]                       */
/*  Returns the student's current clock-in status                     */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token?.id || token.role !== "student") {
    return jsonError("Unauthorized", 401);
  }

  const studentId = token.id as string;
  const courseId = request.nextUrl.searchParams.get("courseId") ?? undefined;

  const session = courseId
    ? await getActiveSessionForCourse(studentId, courseId)
    : await getActiveSession(studentId);

  return NextResponse.json({
    success: true,
    data: {
      isClockedIn: session !== null,
      session: session
        ? {
            id: session.id,
            courseId: session.courseId,
            clockIn: session.clockIn.toISOString(),
          }
        : null,
    },
    error: null,
  });
}

/* ------------------------------------------------------------------ */
/*  POST  /api/student/attendance                                     */
/*  { action: "clock-in" | "clock-out", courseId?: string }          */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token?.id || token.role !== "student") {
    return jsonError("Unauthorized", 401);
  }

  const studentId = token.id as string;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = clockActionSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid action. Use 'clock-in' or 'clock-out'.", 422);
  }

  const { action, courseId } = parsed.data;

  if (action === "clock-in") {
    // Prevent double clock-in for the same course (or globally if no courseId)
    const existing = courseId
      ? await getActiveSessionForCourse(studentId, courseId)
      : await getActiveSession(studentId);

    if (existing) {
      return jsonError("Already clocked in", 409);
    }

    const record = courseId
      ? await clockInForCourse(studentId, courseId)
      : await clockIn(studentId);

    return NextResponse.json({
      success: true,
      data: {
        id: record.id,
        courseId: record.courseId,
        clockIn: record.clockIn.toISOString(),
      },
      error: null,
    });
  }

  // clock-out
  const activeSession = courseId
    ? await getActiveSessionForCourse(studentId, courseId)
    : await getActiveSession(studentId);

  if (!activeSession) {
    return jsonError("Not clocked in", 409);
  }

  const record = courseId
    ? await clockOutForCourse(studentId, activeSession.id)
    : await clockOut(studentId, activeSession.id);

  return NextResponse.json({
    success: true,
    data: {
      id: record.id,
      courseId: record.courseId,
      clockIn: record.clockIn.toISOString(),
      clockOut: record.clockOut?.toISOString() ?? null,
      durationMinutes: record.durationMinutes,
    },
    error: null,
  });
}
