import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/services/paymongo.service";
import { sendPaymentConfirmed } from "@/lib/services/notification.service";
import {
  generateTemporaryPassword,
  studentExists,
} from "@/lib/services/student-auth.service";
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
 * Complete a PayMongo payment: mark as PAID, auto-create student account,
 * and send login email with credentials.
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
  const coursePrice = Number(enrollment.course.price);

  // Check if student already exists (idempotent guard)
  const alreadyExists = await studentExists(enrollment.id);
  if (alreadyExists) {
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: paymentId },
        data: { status: "PAID", paidAt: new Date() },
      }),
      prisma.enrollment.update({
        where: { id: enrollment.id },
        data: {
          status: "ENROLLED" as EnrollmentStatus,
          paymentStatus: "PAID",
          statusUpdatedAt: new Date(),
        },
      }),
    ]);
    return;
  }

  // Generate credentials for the new student
  const tempPassword = generateTemporaryPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 12);
  const accessExpiry = new Date();
  accessExpiry.setDate(accessExpiry.getDate() + 90);

  // Atomic transaction: update payment + enrollment + create student
  await prisma.$transaction([
    prisma.payment.update({
      where: { id: paymentId },
      data: { status: "PAID", paidAt: new Date() },
    }),
    prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        status: "ENROLLED" as EnrollmentStatus,
        paymentStatus: "PAID",
        statusUpdatedAt: new Date(),
      },
    }),
    prisma.student.create({
      data: {
        enrollmentId: enrollment.id,
        email: enrollment.email.toLowerCase(),
        name: enrollment.fullName,
        passwordHash,
        paymentStatus: "PAID",
        amountPaid: coursePrice,
        accessGranted: true,
        accessExpiry,
      },
    }),
  ]);

  // Send payment confirmed email with credentials (fire-and-forget)
  sendPaymentConfirmed({
    name: enrollment.fullName,
    email: enrollment.email,
    courseTitle: enrollment.course.title,
    amount: `PHP ${coursePrice.toLocaleString()}`,
    paymentMethod: "PayMongo Online Payment",
    temporaryPassword: tempPassword,
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
      return NextResponse.json(
        { success: true, data: null, error: null },
        { status: 200 }
      );
    }

    const checkoutSessionId = event.data.attributes.data.id;
    const referenceNumber =
      event.data.attributes.data.attributes.reference_number;

    const payment = await prisma.payment.findFirst({
      where: { referenceNumber: checkoutSessionId, method: "PAYMONGO" },
    });

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
      return NextResponse.json(
        { success: true, data: null, error: null },
        { status: 200 }
      );
    }

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
    return NextResponse.json(
      { success: true, data: null, error: null },
      { status: 200 }
    );
  }
}
