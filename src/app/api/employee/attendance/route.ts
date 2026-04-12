import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token?.id || token.role !== "employee") {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const log = await prisma.hrAttendanceLog.findUnique({
      where: { employeeId_date: { employeeId: token.id as string, date: today } },
    });

    return NextResponse.json({ success: true, data: log, error: null });
  } catch {
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}
