import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { constructStripeEvent } from "@/lib/services/stripe.service";
import { sendPaymentConfirmed } from "@/lib/services/notification.service";
import {
  generateTemporaryPassword,
  studentExists,
} from "@/lib/services/student-auth.service";
import type { EnrollmentStatus } from "@prisma/client";

/**
 * Complete a Stripe payment: mark as PAID, auto-create student account,
 * and send login email with credentials. Same contract as PayMongo webhook.
 */
async function completeStripePayment(paymentId: string): Promise<void> {
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
    console.error("[Stripe Webhook] Payment not found:", paymentId);
    return;
  }

  // Idempotent guard
  if (payment.status === "PAID") {
    return;
  }

  const { enrollment } = payment;
  const amountPaid = Number(payment.amount);

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

  const tempPassword = generateTemporaryPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 12);
  const accessExpiry = new Date();
  accessExpiry.setDate(accessExpiry.getDate() + 90);

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
        amountPaid,
        accessGranted: true,
        accessExpiry,
      },
    }),
  ]);

  await sendPaymentConfirmed({
    name: enrollment.fullName,
    email: enrollment.email,
    courseTitle: enrollment.course.title,
    amount: `PHP ${amountPaid.toLocaleString()}`,
    paymentMethod: "Stripe (Credit / Debit Card)",
    temporaryPassword: tempPassword,
  });
}

/* ------------------------------------------------------------------ */
/* Webhook endpoint — must receive the raw body before JSON parsing    */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  try {
    const rawBody = Buffer.from(await request.arrayBuffer());
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { success: false, data: null, error: "Missing stripe-signature header" },
        { status: 401 }
      );
    }

    let event;
    try {
      event = constructStripeEvent(rawBody, signature);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Invalid signature";
      console.error("[Stripe Webhook] Signature verification failed:", msg);
      return NextResponse.json(
        { success: false, data: null, error: msg },
        { status: 401 }
      );
    }

    // Only handle successful checkout completions
    if (event.type !== "checkout.session.completed") {
      return NextResponse.json({ success: true, data: null, error: null });
    }

    const session = event.data.object as {
      id: string;
      metadata: { enrollmentId?: string };
    };

    const stripeSessionId = session.id;
    const enrollmentId = session.metadata?.enrollmentId;

    // Find the pending payment by Stripe session ID (stored as referenceNumber)
    let payment = await prisma.payment.findFirst({
      where: { referenceNumber: stripeSessionId, method: "STRIPE" },
    });

    // Fallback: find by enrollmentId
    if (!payment && enrollmentId) {
      payment = await prisma.payment.findFirst({
        where: {
          enrollmentId,
          method: "STRIPE",
          status: "PENDING_PAYMENT",
        },
        orderBy: { createdAt: "desc" },
      });
    }

    if (!payment) {
      console.warn(
        "[Stripe Webhook] No matching payment found for session:",
        stripeSessionId
      );
      return NextResponse.json({ success: true, data: null, error: null });
    }

    if (payment.status === "PAID") {
      return NextResponse.json({ success: true, data: null, error: null });
    }

    await completeStripePayment(payment.id);

    return NextResponse.json({ success: true, data: null, error: null });
  } catch (err) {
    console.error("[POST /api/payments/webhook-stripe]", err);
    // Always return 200 to Stripe so it doesn't retry indefinitely
    return NextResponse.json({ success: true, data: null, error: null });
  }
}
