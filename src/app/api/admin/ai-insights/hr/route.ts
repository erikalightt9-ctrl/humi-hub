import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import { isOpenAIAvailable } from "@/lib/openai";
import { generateCompletion } from "@/lib/services/openai.service";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  In-memory cache (1 hour TTL)                                       */
/* ------------------------------------------------------------------ */

const cache = new Map<string, { text: string; at: number }>();
const TTL   = 60 * 60 * 1000;

/* ------------------------------------------------------------------ */
/*  Route                                                              */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    if (!isOpenAIAvailable()) {
      return NextResponse.json({ success: false, data: null, error: "AI not configured" }, { status: 503 });
    }

    const tenantId = guard.tenantId;
    const cached   = cache.get(tenantId);
    if (cached && Date.now() - cached.at < TTL) {
      return NextResponse.json({ success: true, data: { narrative: cached.text }, error: null });
    }

    const year      = new Date().getFullYear();
    const yearStart = new Date(year, 0, 1);
    const yearEnd   = new Date(year + 1, 0, 1);

    const [headcount, leaveByType, latestPayroll, attendanceSummary] = await Promise.all([
      prisma.hrEmployee.groupBy({
        by:    ["status"],
        where: { organizationId: tenantId },
        _count: { _all: true },
      }),
      prisma.hrLeaveRequest.groupBy({
        by:    ["leaveType"],
        where: {
          employee:  { organizationId: tenantId },
          status:    "APPROVED",
          startDate: { gte: yearStart, lt: yearEnd },
        },
        _sum:  { totalDays: true },
        _count: { _all: true },
      }),
      prisma.hrPayrollRun.findFirst({
        where:   { organizationId: tenantId, status: { in: ["APPROVED", "PAID"] } },
        orderBy: { periodStart: "desc" },
        select:  { runNumber: true, totalNet: true, _count: { select: { lines: true } } },
      }),
      (async () => {
        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        return prisma.hrAttendanceLog.groupBy({
          by:    ["status"],
          where: { employee: { organizationId: tenantId }, date: { gte: monthStart } },
          _count: { _all: true },
        });
      })(),
    ]);

    const activeCount = headcount.find((h) => h.status === "ACTIVE")?._count._all ?? 0;
    const totalLeave  = leaveByType.reduce((s, r) => s + Number(r._sum.totalDays ?? 0), 0);
    const topLeave    = [...leaveByType].sort((a, b) => Number(b._sum.totalDays ?? 0) - Number(a._sum.totalDays ?? 0))[0];
    const presentLogs = attendanceSummary.find((a) => a.status === "PRESENT")?._count._all ?? 0;
    const lateLogs    = attendanceSummary.find((a) => a.status === "LATE")?._count._all    ?? 0;

    const prompt =
      `HR analytics narrative for ${year}. ` +
      `Workforce: ${activeCount} active employees. ` +
      `Leave: ${totalLeave} approved leave-days taken so far, ` +
      (topLeave ? `most common type is ${topLeave.leaveType} (${Number(topLeave._sum.totalDays ?? 0)} days). ` : "") +
      `Attendance this month: ${presentLogs} present logs, ${lateLogs} late arrivals. ` +
      (latestPayroll ? `Latest payroll run ${latestPayroll.runNumber}: ₱${Number(latestPayroll.totalNet).toLocaleString()} net for ${latestPayroll._count.lines} employees. ` : "") +
      `Write a 3-sentence HR narrative that highlights workforce health, any attendance concern, and payroll note. ` +
      `Use plain English, no bullet points, no markdown, no headers.`;

    const narrative = await generateCompletion(
      "You are a concise HR analytics assistant. Summarize HR data in plain business English.",
      prompt,
      { model: "gpt-4o-mini", maxTokens: 180, temperature: 0.4 },
    );

    cache.set(tenantId, { text: narrative, at: Date.now() });

    return NextResponse.json({ success: true, data: { narrative }, error: null });
  } catch (err) {
    console.error("[GET /api/admin/ai-insights/hr]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Failed to generate insight" },
      { status: 500 }
    );
  }
}
