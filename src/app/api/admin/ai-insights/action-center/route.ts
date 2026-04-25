import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import { isOpenAIAvailable } from "@/lib/openai";
import { generateCompletion } from "@/lib/services/openai.service";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  In-memory cache (5 min TTL — action center data changes often)    */
/* ------------------------------------------------------------------ */

const cache = new Map<string, { text: string; at: number }>();
const TTL   = 5 * 60 * 1000;

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
      return NextResponse.json({ success: true, data: { summary: cached.text }, error: null });
    }

    // Gather pending counts
    const [leaveCount, payrollCount, repairCount] = await Promise.all([
      prisma.hrLeaveRequest.count({
        where: { employee: { organizationId: tenantId }, status: "PENDING" },
      }),
      prisma.hrPayrollRun.count({
        where: { organizationId: tenantId, status: "DRAFT" },
      }),
      prisma.adminRepairLog.count({
        where: {
          organizationId: tenantId,
          status: { in: ["PENDING", "IN_PROGRESS"] },
        },
      }),
    ]);

    // Fetch leave details for context
    const leaves = await prisma.hrLeaveRequest.findMany({
      where:   { employee: { organizationId: tenantId }, status: "PENDING" },
      take:    5,
      orderBy: { createdAt: "asc" },
      select: {
        leaveType: true, totalDays: true, startDate: true,
        employee:  { select: { firstName: true, lastName: true, department: true } },
      },
    });

    const leaveDetails = leaves.map((l) =>
      `${l.employee.firstName} ${l.employee.lastName} (${l.employee.department ?? "No dept"}) — ${l.leaveType} for ${l.totalDays} days starting ${new Date(l.startDate).toLocaleDateString()}`
    ).join("; ");

    const prompt =
      `Action center summary for an HR manager. Pending items: ` +
      `${leaveCount} leave request(s), ${payrollCount} payroll run(s) awaiting approval, ${repairCount} open repair(s). ` +
      (leaveDetails ? `Leave details: ${leaveDetails}. ` : "") +
      `Write a concise 2-sentence summary highlighting urgency and what needs attention first. ` +
      `Use plain English, no bullet points, no markdown.`;

    const summary = await generateCompletion(
      "You are a concise HR operations assistant. Summarize pending work items in plain English.",
      prompt,
      { model: "gpt-4o-mini", maxTokens: 120, temperature: 0.4 },
    );

    cache.set(tenantId, { text: summary, at: Date.now() });

    return NextResponse.json({ success: true, data: { summary }, error: null });
  } catch (err) {
    console.error("[GET /api/admin/ai-insights/action-center]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Failed to generate insight" },
      { status: 500 }
    );
  }
}
