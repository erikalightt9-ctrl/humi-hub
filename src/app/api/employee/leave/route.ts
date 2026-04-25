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

    const employeeId = token.id as string;
    const yearStart  = new Date(new Date().getFullYear(), 0, 1);
    const yearEnd    = new Date(new Date().getFullYear() + 1, 0, 1);

    const [requests, approvedThisYear] = await Promise.all([
      prisma.hrLeaveRequest.findMany({
        where: { employeeId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.hrLeaveRequest.aggregate({
        where: {
          employeeId,
          status:    "APPROVED",
          startDate: { gte: yearStart, lt: yearEnd },
        },
        _sum: { totalDays: true },
      }),
    ]);

    const usedDays = Number(approvedThisYear._sum.totalDays ?? 0);

    return NextResponse.json({ success: true, data: requests, usedDays, error: null });
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
      return NextResponse.json({ success: false, data: null, error: parsed.error.issues[0]?.message ?? "Invalid data" }, { status: 400 });
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
