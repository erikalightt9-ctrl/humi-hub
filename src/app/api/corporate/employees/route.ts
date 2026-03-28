import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { enrollEmployeeSchema } from "@/lib/validations/corporate.schema";

/* ------------------------------------------------------------------ */
/*  POST — Enroll a new employee                                       */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.id || (token.role !== "corporate" && token.role !== "tenant_admin") || !token.organizationId) {
      return NextResponse.json(
        { success: false, data: null, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const orgId = token.organizationId as string;

    // Check seat limit
    const [org, currentCount] = await Promise.all([
      prisma.organization.findUnique({
        where: { id: orgId },
        select: { maxSeats: true, isActive: true },
      }),
      prisma.student.count({ where: { organizationId: orgId } }),
    ]);

    if (!org || !org.isActive) {
      return NextResponse.json(
        { success: false, data: null, error: "Organization is not active" },
        { status: 403 },
      );
    }

    if (currentCount >= org.maxSeats) {
      return NextResponse.json(
        { success: false, data: null, error: `Seat limit reached (${org.maxSeats} max). Contact admin to increase.` },
        { status: 400 },
      );
    }

    const body = await request.json();
    const parsed = enrollEmployeeSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message ?? "Invalid input";
      return NextResponse.json(
        { success: false, data: null, error: firstIssue },
        { status: 400 },
      );
    }

    const { name, email, courseId, courseTier } = parsed.data;

    // Check if student already exists
    const existingStudent = await prisma.student.findUnique({
      where: { email },
    });

    if (existingStudent) {
      return NextResponse.json(
        { success: false, data: null, error: "An account with this email already exists" },
        { status: 400 },
      );
    }

    // Check course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true },
    });

    if (!course) {
      return NextResponse.json(
        { success: false, data: null, error: "Course not found" },
        { status: 400 },
      );
    }

    // Generate temporary password
    const tempPassword = `Humi@${Date.now().toString(36).slice(-6)}`;
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    // Create enrollment first (Student requires enrollmentId), then student
    const student = await prisma.$transaction(async (tx) => {
      const newEnrollment = await tx.enrollment.create({
        data: {
          courseId,
          courseTier,
          fullName: name,
          dateOfBirth: new Date("2000-01-01"),
          email,
          contactNumber: "",
          address: "Provided by organization",
          educationalBackground: "Provided by organization",
          workExperience: "",
          employmentStatus: "EMPLOYED_FULL_TIME",
          technicalSkills: [],
          toolsFamiliarity: [],
          whyEnroll: "Corporate upskilling program",
          status: "APPROVED",
          organizationId: orgId,
        },
      });

      const newStudent = await tx.student.create({
        data: {
          name,
          email,
          passwordHash,
          mustChangePassword: true,
          accessGranted: true,
          organizationId: orgId,
          enrollmentId: newEnrollment.id,
        },
      });

      return newStudent;
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          studentId: student.id,
          name: student.name,
          email: student.email,
          tempPassword,
        },
        error: null,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/corporate/employees]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
