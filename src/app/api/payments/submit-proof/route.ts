import { NextRequest, NextResponse } from "next/server";
import { paymentProofSchema } from "@/lib/validations/payment.schema";
import { handleProofUpload, submitPaymentProof } from "@/lib/services/payment.service";
import { findEnrollmentById } from "@/lib/repositories/enrollment.repository";
import { prisma } from "@/lib/prisma";
import type { EnrollmentStatus } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const enrollmentId = formData.get("enrollmentId") as string;
    const method = formData.get("method") as string;
    const referenceNumber = formData.get("referenceNumber") as string | null;
    const paidAt = formData.get("paidAt") as string | null;
    const notes = formData.get("notes") as string | null;
    const proofFile = formData.get("proof") as File | null;

    // Validate input
    const result = paymentProofSchema.safeParse({
      enrollmentId,
      method,
      referenceNumber: referenceNumber || undefined,
      paidAt: paidAt || undefined,
      notes: notes || undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, data: null, error: result.error.issues[0]?.message ?? "Validation error" },
        { status: 422 }
      );
    }

    if (!proofFile) {
      return NextResponse.json(
        { success: false, data: null, error: "Payment proof screenshot is required" },
        { status: 422 }
      );
    }

    // Check enrollment exists and is approved
    const enrollment = await findEnrollmentById(enrollmentId);
    if (!enrollment) {
      return NextResponse.json(
        { success: false, data: null, error: "Enrollment not found" },
        { status: 404 }
      );
    }

    if (enrollment.status !== "PENDING" && enrollment.status !== "APPROVED") {
      return NextResponse.json(
        { success: false, data: null, error: "Enrollment is not in a valid state for payment" },
        { status: 400 }
      );
    }

    if (enrollment.paymentStatus === "PAID") {
      return NextResponse.json(
        { success: false, data: null, error: "Payment has already been confirmed" },
        { status: 400 }
      );
    }

    // Upload proof file
    const { filePath, fileName } = await handleProofUpload(proofFile);

    // Create payment record
    const coursePrice = Number(enrollment.course.price);
    const payment = await submitPaymentProof({
      enrollmentId,
      amount: coursePrice,
      method: result.data.method,
      referenceNumber: result.data.referenceNumber,
      notes: result.data.notes,
      proofFilePath: filePath,
      proofFileName: fileName,
      paidAt: result.data.paidAt ? new Date(result.data.paidAt) : undefined,
    });

    // Update enrollment status to PAYMENT_SUBMITTED
    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        status: "PAYMENT_SUBMITTED" as EnrollmentStatus,
        statusUpdatedAt: new Date(),
      },
    });

    return NextResponse.json(
      { success: true, data: { paymentId: payment.id }, error: null },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[POST /api/payments/submit-proof]", err);
    return NextResponse.json(
      { success: false, data: null, error: message },
      { status: 500 }
    );
  }
}
