import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/services/paymongo.service";
import { sendEmailVerification } from "@/lib/services/notification.service";
import { generateEmailVerificationToken } from "@/lib/services/verification.service";
import type { EnrollmentStatus } from "@prisma/client";

interface PayMongoWebhookEvent {
  readonly data: {
    readonly attributes: {
      readonly type: string;
      readonly data: {
        readonly id: string;
        readonly attributes: {
          readonly reference_number: string;
          readonly payment_intent: {
            readonly id: string;
          };
        };
      };
    };
  };
}

/**
 * Complete a PayMongo payment: mark as PAID, update to PAYMENT_VERIFIED,
 * and send email verification link.
 */
async function completePaymentViaWebhook(paymentId: string): Promise<void> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      enrollment: {
        include: {
          course: { select: { id: true, title: true, price: true } },
        },
      },
    },
  });

  if (!payment) {
    console.error("[Webhook] Payment not found:", paymentId);
    return;
  }

  // Already processed — idempotent
  if (payment.status === "PAID") {
    return;
  }

  const { enrollment } = payment;

  // Atomic transaction: update payment + enrollment status to PAYMENT_VERIFIED
  await prisma.$transaction([
    prisma.payment.update({
      where: { id: paymentId },
      data: { status: "PAID", paidAt: new Date() },
    }),
    prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        status: "PAYMENT_VERIFIED" as EnrollmentStatus,
        paymentStatus: "PAID",
        statusUpdatedAt: new Date(),
      },
    }),
  ]);

  // Generate email verification token and send verification email (fire-and-forget)
  const token = await generateEmailVerificationToken(enrollment.id);
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  sendEmailVerification({
    name: enrollment.fullName,
    email: enrollment.email,
    courseTitle: enrollment.course.title,
    verificationUrl: `${baseUrl}/api/verify-email/${token}`,
  });
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signatureHeader = request.headers.get("paymongo-signature");

    if (!signatureHeader) {
      console.error("[Webhook] Missing paymongo-signature header");
      return NextResponse.json(
        { success: false, data: null, error: "Missing signature" },
        { status: 401 }
      );
    }

    const isValid = verifyWebhookSignature(rawBody, signatureHeader);
    if (!isValid) {
      console.error("[Webhook] Invalid signature");
      return NextResponse.json(
        { success: false, data: null, error: "Invalid signature" },
        { status: 401 }
      );
    }

    const event = JSON.parse(rawBody) as PayMongoWebhookEvent;
    const eventType = event.data.attributes.type;

    // Only process successful checkout payments
    if (eventType !== "checkout_session.payment.paid") {
      // Acknowledge other events without processing
      return NextResponse.json(
        { success: true, data: null, error: null },
        { status: 200 }
      );
    }

    // Extract the checkout session ID — used as referenceNumber on our Payment record
    const checkoutSessionId = event.data.attributes.data.id;
    const referenceNumber =
      event.data.attributes.data.attributes.reference_number;

    // Find our payment record by the checkout session ID stored as referenceNumber
    const payment = await prisma.payment.findFirst({
      where: { referenceNumber: checkoutSessionId, method: "PAYMONGO" },
    });

    // Fallback: try finding by enrollment ID (reference_number in PayMongo)
    const resolvedPayment =
      payment ??
      (await prisma.payment.findFirst({
        where: {
          enrollmentId: referenceNumber,
          method: "PAYMONGO",
          status: "PENDING_PAYMENT",
        },
        orderBy: { createdAt: "desc" },
      }));

    if (!resolvedPayment) {
      console.warn(
        "[Webhook] No matching payment found for checkout session:",
        checkoutSessionId
      );
      // Return 200 to prevent PayMongo from retrying
      return NextResponse.json(
        { success: true, data: null, error: null },
        { status: 200 }
      );
    }

    // Already processed — idempotent
    if (resolvedPayment.status === "PAID") {
      return NextResponse.json(
        { success: true, data: null, error: null },
        { status: 200 }
      );
    }

    await completePaymentViaWebhook(resolvedPayment.id);

    return NextResponse.json(
      { success: true, data: null, error: null },
      { status: 200 }
    );
  } catch (err) {
    console.error("[POST /api/payments/webhook]", err);
    // Return 200 to prevent infinite retries; log the error for investigation
    return NextResponse.json(
      { success: true, data: null, error: null },
      { status: 200 }
    );
  }
}
