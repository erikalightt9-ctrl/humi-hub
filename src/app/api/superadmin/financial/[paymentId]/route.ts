import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth-guards";
import {
  approveTenantSubscription,
  rejectTenantSubscription,
  editTenantSubscription,
} from "@/lib/repositories/superadmin.repository";

const ApproveSchema = z.object({ action: z.literal("approve") });

const RejectSchema = z.object({ action: z.literal("reject") });

const EditSchema = z.object({
  action: z.literal("edit"),
  plan: z.enum(["TRIAL", "STARTER", "PROFESSIONAL", "ENTERPRISE"]).optional(),
  amountCents: z.number().int().min(0).optional(),
  currency: z.string().max(3).optional(),
  periodStart: z.string().datetime().optional(),
  periodEnd: z.string().datetime().optional(),
  paymentMethod: z.string().max(100).nullable().optional(),
  paymentRef: z.string().max(200).nullable().optional(),
});

const ActionSchema = z.discriminatedUnion("action", [ApproveSchema, RejectSchema, EditSchema]);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  const token = await getToken({ req: request });
  const guard = requireSuperAdmin(token);
  if (!guard.ok) return guard.response;

  const { paymentId } = await params;

  const body = await request.json().catch(() => null);
  const parsed = ActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, data: null, error: "Invalid request body" },
      { status: 400 }
    );
  }

  const payload = parsed.data;

  if (payload.action === "approve") {
    await approveTenantSubscription(paymentId);
  } else if (payload.action === "reject") {
    await rejectTenantSubscription(paymentId);
  } else {
    const { action: _action, ...editFields } = payload;
    const data: Parameters<typeof editTenantSubscription>[1] = {};
    if (editFields.plan !== undefined) data.plan = editFields.plan;
    if (editFields.amountCents !== undefined) data.amountCents = editFields.amountCents;
    if (editFields.currency !== undefined) data.currency = editFields.currency;
    if (editFields.periodStart !== undefined) data.periodStart = new Date(editFields.periodStart);
    if (editFields.periodEnd !== undefined) data.periodEnd = new Date(editFields.periodEnd);
    if ("paymentMethod" in editFields) data.paymentMethod = editFields.paymentMethod ?? null;
    if ("paymentRef" in editFields) data.paymentRef = editFields.paymentRef ?? null;
    await editTenantSubscription(paymentId, data);
  }

  return NextResponse.json({ success: true, data: { paymentId }, error: null });
}
