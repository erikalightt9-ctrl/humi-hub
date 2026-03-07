import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import bcrypt from "bcryptjs";
import {
  findEnrollmentById,
} from "@/lib/repositories/enrollment.repository";
import { generateTemporaryPassword, studentExists } from "@/lib/services/student-auth.service";
import {
  sendEnrollmentApproved,
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
    // Admin approves → auto-create student account → send login email
    if (result.data.status === "APPROVED") {
      const isFree = coursePrice <= 0;

      // Check idempotency — skip if student already exists
      const alreadyExists = await studentExists(id);
      if (alreadyExists) {
        await prisma.enrollment.update({
          where: { id },
          data: {
            status: "ENROLLED" as EnrollmentStatus,
            statusUpdatedAt: new Date(),
            statusUpdatedBy: adminId,
          },
        });
        const updated = await findEnrollmentById(id);
        return NextResponse.json({ success: true, data: updated, error: null });
      }

      // Generate credentials for the new student
      const tempPassword = generateTemporaryPassword();
      const passwordHash = await bcrypt.hash(tempPassword, 12);
      const accessExpiry = new Date();
      accessExpiry.setDate(accessExpiry.getDate() + 90);

      // Atomic transaction: update enrollment + create student
      await prisma.$transaction([
        prisma.enrollment.update({
          where: { id },
          data: {
            status: "ENROLLED" as EnrollmentStatus,
            paymentStatus: isFree ? "PAID" : existing.paymentStatus,
            statusUpdatedAt: new Date(),
            statusUpdatedBy: adminId,
          },
        }),
        prisma.student.create({
          data: {
            enrollmentId: id,
            email: existing.email.toLowerCase(),
            name: existing.fullName,
            passwordHash,
            paymentStatus: "PAID",
            amountPaid: isFree ? 0 : coursePrice,
            accessGranted: true,
            accessExpiry,
          },
        }),
      ]);

      // Send login email with credentials (fire-and-forget)
      sendEnrollmentApproved({
        name: existing.fullName,
        email: existing.email,
        courseTitle,
        temporaryPassword: tempPassword,
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

    // ── OTHER STATUS CHANGES (PENDING revert, etc.) ──────────────
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
