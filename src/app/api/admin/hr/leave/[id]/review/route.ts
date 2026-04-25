import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-guards";
import { reviewLeaveRequest } from "@/lib/repositories/hr-leave.repository";
import { createNotification } from "@/lib/repositories/notification.repository";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  action:     z.enum(["APPROVED", "REJECTED"]),
  reviewNote: z.string().max(300).optional(),
});

const LEAVE_TYPE_LABEL: Record<string, string> = {
  SICK: "Sick Leave", VACATION: "Vacation", EMERGENCY: "Emergency",
  MATERNITY: "Maternity", PATERNITY: "Paternity",
  BEREAVEMENT: "Bereavement", OTHER: "Other",
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const { id } = await params;
    const body   = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, data: null, error: parsed.error.message }, { status: 400 });
    }

    const req = await reviewLeaveRequest(
      guard.tenantId, id,
      parsed.data.action,
      (token as { id?: string }).id ?? "",
      parsed.data.reviewNote
    );

    // ── Notify employee of the decision ───────────────────────────────
    const approved = parsed.data.action === "APPROVED";
    const leaveLabel = LEAVE_TYPE_LABEL[req.leaveType as string] ?? "Leave";
    void createNotification({
      recipientType: "EMPLOYEE",
      recipientId:   req.employeeId,
      type:          "SYSTEM",
      title:         `Leave Request ${approved ? "Approved" : "Rejected"}`,
      message:       approved
        ? `Your ${leaveLabel} request has been approved.`
        : `Your ${leaveLabel} request was not approved.${req.reviewNote ? ` Note: ${req.reviewNote}` : ""}`,
      linkUrl:  "/employee/leave",
      tenantId: guard.tenantId,
    }).catch(() => {});

    // ── Notify all admins in this tenant ──────────────────────────────
    const admins = await prisma.corporateManager.findMany({
      where: { organizationId: guard.tenantId, isActive: true },
      select: { id: true },
    }).catch(() => [] as { id: string }[]);

    const emp = await prisma.hrEmployee.findUnique({
      where: { id: req.employeeId },
      select: { firstName: true, lastName: true },
    }).catch(() => null);

    const empName = emp ? `${emp.firstName} ${emp.lastName}` : "An employee";

    void Promise.all(
      admins.map((a) =>
        createNotification({
          recipientType: "CORPORATE_MANAGER",
          recipientId:   a.id,
          type:          "SYSTEM",
          title:         `Leave ${approved ? "Approved" : "Rejected"}`,
          message:       `${empName}'s ${leaveLabel} request was ${approved ? "approved" : "rejected"}.`,
          linkUrl:       "/admin/action-center",
          tenantId:      guard.tenantId,
        }).catch(() => {})
      )
    );

    return NextResponse.json({ success: true, data: req, error: null });
  } catch (err) {
    console.error("[POST /api/admin/hr/leave/[id]/review]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    const status  = message.includes("not found") ? 404 : message.includes("Only PENDING") ? 422 : 500;
    return NextResponse.json({ success: false, data: null, error: message }, { status });
  }
}
