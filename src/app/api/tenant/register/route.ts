import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { resolveTenantFromSubdomain } from "@/lib/tenant";
import { tenantRegisterSchema } from "@/lib/validations/register.schema";

export const dynamic = "force-dynamic";

/**
 * POST /api/tenant/register
 * Quick self-service registration for tenant portals.
 * Creates an Enrollment + Student record atomically.
 * Students get immediate access (accessGranted: true).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input — strip confirmPassword before processing
    const result = tenantRegisterSchema.safeParse(body);
    if (!result.success) {
      const firstError = result.error.issues[0];
      return NextResponse.json(
        { success: false, error: firstError.message, field: firstError.path[0] },
        { status: 400 },
      );
    }

    const { name, email, password, phone, courseId } = result.data;
    const normalizedEmail = email.trim().toLowerCase();

    // Resolve tenant from x-tenant-subdomain header (set by middleware)
    const tenant = await resolveTenantFromSubdomain();
    const organizationId = tenant?.tenantId ?? null;

    // Verify the course exists and belongs to this tenant (if applicable)
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        isActive: true,
        ...(organizationId ? { tenantId: organizationId } : {}),
      },
      select: { id: true, title: true, tenantId: true },
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: "Selected course is not available." },
        { status: 404 },
      );
    }

    // Guard: check seat limits if tenant has maxSeats configured
    if (organizationId) {
      const org = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { maxSeats: true, planExpiresAt: true },
      });

      if (org?.maxSeats) {
        const current = await prisma.student.count({
          where: { organizationId, accessGranted: true },
        });
        if (current >= org.maxSeats) {
          return NextResponse.json(
            {
              success: false,
              error: "This training center has reached its student capacity. Please contact the administrator.",
            },
            { status: 403 },
          );
        }
      }

      if (org?.planExpiresAt && org.planExpiresAt < new Date()) {
        return NextResponse.json(
          {
            success: false,
            error: "This training center's subscription has expired. Please contact the administrator.",
          },
          { status: 403 },
        );
      }
    }

    // Guard: prevent duplicate registrations
    const existing = await prisma.student.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: "An account with this email already exists. Please log in instead.",
          field: "email",
        },
        { status: 409 },
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create Enrollment + Student atomically
    const { enrollment, student } = await prisma.$transaction(async (tx) => {
      const enrollment = await tx.enrollment.create({
        data: {
          fullName: name,
          email: normalizedEmail,
          contactNumber: phone,
          // Placeholder values for fields required by the schema but not collected at quick-registration
          dateOfBirth: new Date("1990-01-01"),
          address: "Not provided",
          educationalBackground: "Not provided",
          workExperience: "Not specified",
          employmentStatus: "STUDENT",
          whyEnroll: "Self-registered via tenant portal",
          courseId,
          status: "APPROVED",
        },
      });

      const student = await tx.student.create({
        data: {
          enrollmentId: enrollment.id,
          email: normalizedEmail,
          passwordHash,
          name,
          mustChangePassword: false,
          accessGranted: true,
          organizationId,
        },
      });

      return { enrollment, student };
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          studentId: student.id,
          enrollmentId: enrollment.id,
          email: student.email,
          name: student.name,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/tenant/register]", err);
    return NextResponse.json(
      { success: false, error: "Registration failed. Please try again." },
      { status: 500 },
    );
  }
}
