import { NextRequest, NextResponse } from "next/server";
import {
  listAttendanceBySession,
  upsertSessionAttendances,
} from "@/lib/repositories/session-attendance.repository";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/* ------------------------------------------------------------------ */
/*  GET /api/admin/schedules/attendance                                */
/*  Query: scheduleId, sessionDate (ISO date string)                  */
/* ------------------------------------------------------------------ */

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const scheduleId = searchParams.get("scheduleId");
  const sessionDateStr = searchParams.get("sessionDate");

  if (!scheduleId || !sessionDateStr) {
    return NextResponse.json(
      { success: false, error: "scheduleId and sessionDate are required" },
      { status: 400 },
    );
  }

  const sessionDate = new Date(sessionDateStr);
  if (isNaN(sessionDate.getTime())) {
    return NextResponse.json({ success: false, error: "Invalid sessionDate" }, { status: 400 });
  }

  const rows = await listAttendanceBySession(scheduleId, sessionDate);
  return NextResponse.json({ success: true, data: rows });
}

/* ------------------------------------------------------------------ */
/*  POST /api/admin/schedules/attendance                               */
/*  Body: { scheduleId, sessionDate, items: [{studentId, present}] }  */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { scheduleId, sessionDate: sessionDateStr, items } = body;

  if (!scheduleId || !sessionDateStr || !Array.isArray(items)) {
    return NextResponse.json(
      { success: false, error: "scheduleId, sessionDate, and items are required" },
      { status: 400 },
    );
  }

  const sessionDate = new Date(sessionDateStr);
  if (isNaN(sessionDate.getTime())) {
    return NextResponse.json({ success: false, error: "Invalid sessionDate" }, { status: 400 });
  }

  await upsertSessionAttendances(scheduleId, sessionDate, items);
  return NextResponse.json({ success: true });
}
