import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth-guards";
import {
  createTenantSubscription,
  getTenantSubscriptions,
} from "@/lib/repositories/tenant-subscription.repository";

const createSubscriptionSchema = z.object({
  plan: z.enum(["TRIAL", "STARTER", "PROFESSIONAL", "ENTERPRISE"]),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  amountCents: z.number().int().min(0),
  currency: z.string().length(3).optional(),
  paymentMethod: z.string().max(100).nullable().optional(),
  paymentRef: z.string().max(200).nullable().optional(),
});

/* ------------------------------------------------------------------ */
/*  GET — List subscriptions for a tenant                             */
/* ------------------------------------------------------------------ */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireSuperAdmin(token);
    if (!guard.ok) return guard.response;

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") ? Number(searchParams.get("page")) : 1;
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : 20;

    const result = await getTenantSubscriptions(id, page, limit);
    return NextResponse.json({ success: true, data: result, error: null });
  } catch (err) {
    console.error("[GET /api/superadmin/tenants/[id]/subscriptions]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  POST — Create a new subscription for a tenant                     */
/* ------------------------------------------------------------------ */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireSuperAdmin(token);
    if (!guard.ok) return guard.response;

    const { id } = await params;
    const body = await request.json();
    const result = createSubscriptionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, data: null, error: result.error.issues[0]?.message ?? "Invalid input" },
        { status: 422 }
      );
    }

    const { periodStart, periodEnd, ...rest } = result.data;
    const subscription = await createTenantSubscription({
      tenantId: id,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      ...rest,
    });

    return NextResponse.json({ success: true, data: subscription, error: null }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/superadmin/tenants/[id]/subscriptions]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}
