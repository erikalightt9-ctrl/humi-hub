import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import { listAllPayments } from "@/lib/repositories/payment.repository";
import type { PaymentStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as PaymentStatus | null;
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? "20", 10);

    const result = await listAllPayments({
      status: status ?? undefined,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: result.data,
      total: result.total,
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/admin/payments]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
