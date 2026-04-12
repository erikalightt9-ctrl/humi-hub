import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const schema = z.object({
  latitude:     z.number().min(-90).max(90),
  longitude:    z.number().min(-180).max(180),
  photoDataUrl: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token?.id || token.role !== "employee") {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, data: null, error: "Invalid request data" }, { status: 400 });
    }

    const { latitude, longitude, photoDataUrl } = parsed.data;
    const employeeId = token.id as string;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const log = await prisma.hrAttendanceLog.findUnique({
      where: { employeeId_date: { employeeId, date: today } },
    });
    if (!log?.clockIn)  return NextResponse.json({ success: false, data: null, error: "No clock-in found for today" }, { status: 422 });
    if (log.clockOut)   return NextResponse.json({ success: false, data: null, error: "Already clocked out today" }, { status: 422 });

    const now         = new Date();
    const hoursWorked = (now.getTime() - log.clockIn!.getTime()) / 3600000;
    const regularHours  = Math.min(hoursWorked, 8);
    const overtimeHours = Math.max(hoursWorked - 8, 0);

    const updated = await prisma.hrAttendanceLog.update({
      where: { id: log.id },
      data: {
        clockOut:          now,
        hoursWorked:       new Prisma.Decimal(regularHours),
        overtimeHours:     new Prisma.Decimal(overtimeHours),
        clockOutLatitude:  latitude,
        clockOutLongitude: longitude,
        clockOutPhotoUrl:  photoDataUrl,
      },
    });

    return NextResponse.json({ success: true, data: updated, error: null });
  } catch (err) {
    console.error("[POST /api/employee/attendance/clock-out]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}
