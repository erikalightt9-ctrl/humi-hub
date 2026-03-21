import { NextRequest, NextResponse } from "next/server";
import { findEnrollmentById } from "@/lib/repositories/enrollment.repository";
import { findPaymentsByEnrollment, createPayment } from "@/lib/repositories/payment.repository";
import { createStripeCheckoutSession } from "@/lib/services/stripe.service";

interface CreateStripeCheckoutBody {
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
    const body = (await request.json()) as CreateStripeCheckoutBody;

    if (!body.enrollmentId || typeof body.enrollmentId !== "string") {
      return jsonError("enrollmentId is required", 422);
    }

    const enrollment = await findEnrollmentById(body.enrollmentId);
    if (!enrollment) {
      return jsonError("Enrollment not found", 404);
    }

    // Allow checkout for PENDING and APPROVED enrollments
    if (enrollment.status !== "PENDING" && enrollment.status !== "APPROVED") {
      return jsonError("Enrollment is not in a valid state for payment", 400);
    }

    // Guard: already paid
    const existingPayments = await findPaymentsByEnrollment(body.enrollmentId);
    const hasPaidPayment = existingPayments.some((p) => p.status === "PAID");
    if (hasPaidPayment) {
      return jsonError("Payment has already been confirmed for this enrollment", 400);
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return jsonError(
        "Stripe payment is not available at this time. Please use another payment method.",
        503
      );
    }

    // Use tier price if set, otherwise fall back to course base price
    const coursePrice = enrollment.baseProgramPrice
      ? Number(enrollment.baseProgramPrice)
      : Number(enrollment.course.price);

    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const successUrl = `${baseUrl}/pay/${body.enrollmentId}/success?payment=stripe`;
    const cancelUrl = `${baseUrl}/pay/${body.enrollmentId}`;

    // Derive tier name from courseTier enum value
    const tierLabel =
      enrollment.courseTier === "PROFESSIONAL"
        ? "Professional"
        : enrollment.courseTier === "ADVANCED"
          ? "Advanced"
          : "Basic";

    const { sessionId, checkoutUrl } = await createStripeCheckoutSession({
      enrollmentId: body.enrollmentId,
      amount: coursePrice,
      description: enrollment.course.title,
      customerName: enrollment.fullName,
      customerEmail: enrollment.email,
      successUrl,
      cancelUrl,
      tierName: tierLabel,
    });

    // Record a PENDING_PAYMENT entry linked to this Stripe session
    await createPayment({
      enrollmentId: body.enrollmentId,
      amount: coursePrice,
      method: "STRIPE",
      referenceNumber: sessionId,
    });

    return NextResponse.json(
      { success: true, data: { checkoutUrl }, error: null },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[POST /api/payments/create-checkout-stripe]", err);
    return jsonError(message, 500);
  }
}
