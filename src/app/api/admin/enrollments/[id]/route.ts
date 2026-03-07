import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import {
  findEnrollmentById,
} from "@/lib/repositories/enrollment.repository";
import {
  generateEmailVerificationToken,
  generateActivationToken,
} from "@/lib/services/verification.service";
import {
  sendEmailVerification,
  sendAccountActivation,
  sendEnrollmentRejected,
} from "@/lib/services/notification.service";
import { prisma } from "@/lib/prisma";
import type { EnrollmentStatus } from "@prisma/client";

const patchSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "ENROLLED", "PAYMENT_SUBMITTED", "PAYMENT_VERIFIED", "EMAIL_VERIFIED"]),
  rejectionFeedback: z.string().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const enrollment = await findEnrollmentById(id);

    if (!enrollment) {
      return NextResponse.json(
        { success: false, data: null, error: "Enrollment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: enrollment, error: null });
  } catch (err) {
    console.error("[GET /api/admin/enrollments/[id]]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token?.id) {
      return NextResponse.json(
        { success: false, data: null, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = patchSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, data: null, error: "Invalid status value" },
        { status: 422 }
      );
    }

    const existing = await findEnrollmentById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, data: null, error: "Enrollment not found" },
        { status: 404 }
      );
    }

    const courseTitle = existing.course.title;
    const coursePrice = Number(existing.course.price);
    const adminId = token.id as string;

    // ── APPROVED ──────────────────────────────────────────────────
    if (result.data.status === "APPROVED") {
      const isFree = coursePrice <= 0;
      const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

      // FREE COURSE from PENDING: skip to PAYMENT_VERIFIED → send email verification
      if (isFree && existing.status === "PENDING") {
        await prisma.enrollment.update({
          where: { id },
          data: {
            status: "PAYMENT_VERIFIED" as EnrollmentStatus,
            paymentStatus: "PAID",
            statusUpdatedAt: new Date(),
            statusUpdatedBy: adminId,
          },
        });

        const emailToken = await generateEmailVerificationToken(id);

        sendEmailVerification({
          name: existing.fullName,
          email: existing.email,
          courseTitle,
          verificationUrl: `${base}/api/verify-email/${emailToken}`,
        });

        const updated = await findEnrollmentById(id);
        return NextResponse.json({ success: true, data: updated, error: null });
      }

      // Guard: only allow approval from EMAIL_VERIFIED status (paid courses)
      if (existing.status !== "EMAIL_VERIFIED" && !isFree) {
        return NextResponse.json(
          { success: false, data: null, error: "Enrollment must have email verified before approval" },
          { status: 400 }
        );
      }

      // Generate activation token → send activation email
      const activationToken = await generateActivationToken(id);

      await prisma.enrollment.update({
        where: { id },
        data: {
          status: "APPROVED" as EnrollmentStatus,
          statusUpdatedAt: new Date(),
          statusUpdatedBy: adminId,
        },
      });

      sendAccountActivation({
        name: existing.fullName,
        email: existing.email,
        courseTitle,
        activationUrl: `${base}/activate/${activationToken}`,
        statusTrackingUrl: `${base}/enrollment-status/${id}`,
      });

      const updated = await findEnrollmentById(id);
      return NextResponse.json({ success: true, data: updated, error: null });
    }

    // ── REJECTED ──────────────────────────────────────────────────
    if (result.data.status === "REJECTED") {
      const updated = await prisma.enrollment.update({
        where: { id },
        data: {
          status: "REJECTED" as EnrollmentStatus,
          statusUpdatedAt: new Date(),
          statusUpdatedBy: adminId,
        },
      });

      sendEnrollmentRejected({
        name: existing.fullName,
        email: existing.email,
        courseTitle,
        feedback: result.data.rejectionFeedback,
      });

      return NextResponse.json({ success: true, data: updated, error: null });
    }

    // ── PENDING (revert) ──────────────────────────────────────────
    const updated = await prisma.enrollment.update({
      where: { id },
      data: {
        status: result.data.status as EnrollmentStatus,
        statusUpdatedAt: new Date(),
        statusUpdatedBy: adminId,
      },
    });

    return NextResponse.json({ success: true, data: updated, error: null });
  } catch (err) {
    console.error("[PATCH /api/admin/enrollments/[id]]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
