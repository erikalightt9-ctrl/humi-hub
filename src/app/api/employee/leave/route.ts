import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  leaveType: z.enum(["SICK", "VACATION", "EMERGENCY", "MATERNITY", "PATERNITY", "BEREAVEMENT", "OTHER"]),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason:    z.string().min(1).max(500),
});

function calcTotalDays(start: string, end: string) {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(1, Math.round(ms / 86400000) + 1);
}

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id || token.role !== "employee") {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }

    const requests = await prisma.hrLeaveRequest.findMany({
      where: { employeeId: token.id as string },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: requests, error: null });
  } catch {
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id || token.role !== "employee") {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }

    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, data: null, error: parsed.error.errors[0]?.message ?? "Invalid data" }, { status: 400 });
    }

    const { leaveType, startDate, endDate, reason } = parsed.data;

    if (new Date(endDate) < new Date(startDate)) {
      return NextResponse.json({ success: false, data: null, error: "End date must be after start date" }, { status: 400 });
    }

    const totalDays = calcTotalDays(startDate, endDate);

    const leave = await prisma.hrLeaveRequest.create({
      data: {
        employeeId: token.id as string,
        leaveType:  leaveType as never,
        startDate:  new Date(startDate),
        endDate:    new Date(endDate),
        totalDays,
        reason,
        status:     "PENDING",
      },
    });

    return NextResponse.json({ success: true, data: leave, error: null }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/employee/leave]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}
