import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import {
  findEnrollmentById,
  updateEnrollmentStatus,
} from "@/lib/repositories/enrollment.repository";
import { createStudentAccount, generateTemporaryPassword, studentExists } from "@/lib/services/student-auth.service";
import { sendStudentCredentialsEmail } from "@/lib/email/send-student-credentials";
import { prisma } from "@/lib/prisma";
import type { EnrollmentStatus } from "@prisma/client";

const patchSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
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

    const updated = await updateEnrollmentStatus(
      id,
      result.data.status as EnrollmentStatus,
      token.id as string
    );

    // Auto-create student account when approved
    if (result.data.status === "APPROVED") {
      const alreadyExists = await studentExists(id);
      if (!alreadyExists) {
        const course = await prisma.course.findUnique({
          where: { id: existing.courseId },
          select: { title: true },
        });
        const tempPassword = generateTemporaryPassword();
        await createStudentAccount(id, existing.email, existing.fullName, tempPassword);
        try {
          await sendStudentCredentialsEmail({
            name: existing.fullName,
            email: existing.email,
            courseTitle: course?.title ?? "Your Course",
            temporaryPassword: tempPassword,
          });
        } catch (emailErr) {
          console.error("[Student credentials email failed]", emailErr);
        }
      }
    }

    return NextResponse.json({ success: true, data: updated, error: null });
  } catch (err) {
    console.error("[PATCH /api/admin/enrollments/[id]]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}
