import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import { listSubscriptions } from "@/lib/repositories/subscription.repository";
import type { SubscriptionStatus } from "@prisma/client";

/* ------------------------------------------------------------------ */
/*  GET — List all subscriptions (admin)                               */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as SubscriptionStatus | null;
    const page = parseInt(searchParams.get("page") ?? "1", 10);

    const result = await listSubscriptions({
      status: status ?? undefined,
      page,
      limit: 50,
    });

    return NextResponse.json({
      success: true,
      data: result.data.map((s) => ({
        id: s.id,
        studentName: s.student.name,
        studentEmail: s.student.email,
        courseTitle: s.student.enrollment.course.title,
        plan: s.plan,
        status: s.status,
        amount: Number(s.amount),
        paymentMethod: s.paymentMethod,
        referenceNumber: s.referenceNumber,
        startDate: s.startDate?.toISOString() ?? null,
        endDate: s.endDate?.toISOString() ?? null,
        createdAt: s.createdAt.toISOString(),
        approvedAt: s.approvedAt?.toISOString() ?? null,
      })),
      total: result.total,
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/admin/subscriptions]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
