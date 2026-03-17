import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import { verifyPaymentSchema } from "@/lib/validations/payment.schema";
import { approvePayment, rejectPayment } from "@/lib/services/payment.service";
import { findPaymentById } from "@/lib/repositories/payment.repository";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const body = await request.json();
    const result = verifyPaymentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, data: null, error: "Invalid request body" },
        { status: 422 }
      );
    }

    const payment = await findPaymentById(id);
    if (!payment) {
      return NextResponse.json(
        { success: false, data: null, error: "Payment not found" },
        { status: 404 }
      );
    }

    if (payment.status !== "PENDING_PAYMENT") {
      return NextResponse.json(
        { success: false, data: null, error: "Payment has already been processed" },
        { status: 400 }
      );
    }

    if (result.data.approved) {
      await approvePayment(id, token!.id as string);
    } else {
      await rejectPayment(id, token!.id as string);
    }

    return NextResponse.json({
      success: true,
      data: { status: result.data.approved ? "PAID" : "FAILED" },
      error: null,
    });
  } catch (err) {
    console.error("[POST /api/admin/payments/[id]/verify]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
