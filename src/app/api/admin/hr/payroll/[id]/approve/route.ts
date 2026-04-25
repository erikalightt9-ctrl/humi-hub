import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import { approvePayrollRun } from "@/lib/repositories/hr-payroll.repository";
import { createNotification } from "@/lib/repositories/notification.repository";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const { id } = await params;
    const run = await approvePayrollRun(guard.tenantId, id, (token as { id?: string }).id ?? "");

    // ── Notify all admins that payroll was approved ────────────────────
    const period = run.periodStart
      ? new Date(run.periodStart).toLocaleDateString("en-PH", { month: "short", day: "numeric" }) +
        " – " +
        new Date(run.periodEnd).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
      : `Run #${run.runNumber}`;

    const admins = await prisma.corporateManager.findMany({
      where: { organizationId: guard.tenantId, isActive: true },
      select: { id: true },
    }).catch(() => [] as { id: string }[]);

    void Promise.all(
      admins.map((a) =>
        createNotification({
          recipientType: "CORPORATE_MANAGER",
          recipientId:   a.id,
          type:          "SYSTEM",
          title:         "Payroll Approved",
          message:       `Payroll for ${period} has been approved and is ready for payment.`,
          linkUrl:       `/admin/hr/payroll/${id}`,
          tenantId:      guard.tenantId,
        }).catch(() => {})
      )
    );

    return NextResponse.json({ success: true, data: run, error: null });
  } catch (err) {
    console.error("[POST /api/admin/hr/payroll/[id]/approve]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    const status  = message.includes("not found") ? 404 : message.includes("Only DRAFT") ? 422 : 500;
    return NextResponse.json({ success: false, data: null, error: message }, { status });
  }
}
