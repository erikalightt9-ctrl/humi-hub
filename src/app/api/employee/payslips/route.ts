import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id || token.role !== "employee") {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }

    const lines = await prisma.hrPayrollLine.findMany({
      where: {
        employeeId: token.id as string,
        payrollRun: { status: { in: ["APPROVED", "PAID"] } },
      },
      include: {
        payrollRun: {
          select: {
            id: true,
            runNumber: true,
            periodStart: true,
            periodEnd: true,
            payDate: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const data = lines.map((l) => ({
      id:             l.id,
      payrollRunId:   l.payrollRunId,
      runNumber:      l.payrollRun.runNumber,
      periodStart:    l.payrollRun.periodStart,
      periodEnd:      l.payrollRun.periodEnd,
      payDate:        l.payrollRun.payDate,
      status:         l.payrollRun.status,
      grossPay:       Number(l.grossPay),
      totalDeductions: Number(l.totalDeductions),
      netPay:         Number(l.netPay),
    }));

    return NextResponse.json({ success: true, data, error: null });
  } catch {
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}
