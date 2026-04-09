import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import {
  listActivities,
  createActivity,
} from "@/lib/repositories/crm.repository";
import { CrmActivityType } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const { searchParams } = new URL(request.url);
    const dealId       = searchParams.get("dealId")       ?? undefined;
    const contactId    = searchParams.get("contactId")    ?? undefined;
    const activityType = searchParams.get("activityType") ?? undefined;
    const page         = searchParams.get("page")  ? Number(searchParams.get("page"))  : undefined;
    const limit        = searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined;

    const result = await listActivities(guard.tenantId, {
      dealId,
      contactId,
      activityType: activityType as CrmActivityType | undefined,
      page,
      limit,
    });

    return NextResponse.json({ success: true, data: result, error: null });
  } catch (err) {
    console.error("[GET /api/admin/sales/activities]", err);
    return NextResponse.json(
      { success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const body = await request.json();

    if (!body.activityType || typeof body.activityType !== "string") {
      return NextResponse.json(
        { success: false, data: null, error: "activityType is required" },
        { status: 400 }
      );
    }
    if (!body.subject || typeof body.subject !== "string") {
      return NextResponse.json(
        { success: false, data: null, error: "subject is required" },
        { status: 400 }
      );
    }

    const activity = await createActivity(guard.tenantId, {
      activityType: body.activityType as CrmActivityType,
      subject:      body.subject,
      body:         body.body      ?? undefined,
      dealId:       body.dealId    ?? undefined,
      contactId:    body.contactId ?? undefined,
    });

    return NextResponse.json({ success: true, data: activity, error: null }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/sales/activities]", err);
    return NextResponse.json(
      { success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
