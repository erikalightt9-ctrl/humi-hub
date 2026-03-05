import { NextRequest, NextResponse } from "next/server";
import { findEnrollmentById } from "@/lib/repositories/enrollment.repository";
import { findPaymentsByEnrollment, createPayment } from "@/lib/repositories/payment.repository";
import { createCheckoutSession } from "@/lib/services/paymongo.service";

interface CreateCheckoutBody {
  readonly enrollmentId: string;
}

function jsonError(error: string, status: number) {
  return NextResponse.json(
    { success: false, data: null, error },
    { status }
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateCheckoutBody;

    if (!body.enrollmentId || typeof body.enrollmentId !== "string") {
      return jsonError("enrollmentId is required", 422);
    }

    const enrollment = await findEnrollmentById(body.enrollmentId);
    if (!enrollment) {
      return jsonError("Enrollment not found", 404);
    }

    // Only allow checkout for APPROVED enrollments awaiting payment
    if (enrollment.status !== "APPROVED") {
      return jsonError(
        "Enrollment must be approved before payment can be processed",
        400
      );
    }

    // Check if payment already confirmed
    const existingPayments = await findPaymentsByEnrollment(body.enrollmentId);
    const hasPaidPayment = existingPayments.some((p) => p.status === "PAID");
    if (hasPaidPayment) {
      return jsonError("Payment has already been confirmed for this enrollment", 400);
    }

    const coursePrice = Number(enrollment.course.price);
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const successUrl = `${baseUrl}/pay/${body.enrollmentId}/success`;
    const cancelUrl = `${baseUrl}/pay/${body.enrollmentId}/failed`;

    const { checkoutSessionId, checkoutUrl } = await createCheckoutSession({
      enrollmentId: body.enrollmentId,
      amount: coursePrice,
      description: enrollment.course.title,
      customerName: enrollment.fullName,
      customerEmail: enrollment.email,
      successUrl,
      cancelUrl,
    });

    // Create a PENDING_PAYMENT record tied to this checkout session
    await createPayment({
      enrollmentId: body.enrollmentId,
      amount: coursePrice,
      method: "PAYMONGO",
      referenceNumber: checkoutSessionId,
    });

    return NextResponse.json(
      { success: true, data: { checkoutUrl }, error: null },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[POST /api/payments/create-checkout]", err);
    return jsonError(message, 500);
  }
}
