import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  getAllApplications,
  updateApplicationStatus,
} from "@/lib/repositories/job-application.repository";
import { updateApplicationStatusSchema } from "@/lib/validations/job-application.schema";
import type { ApplicationStatus } from "@prisma/client";
import type { CourseSlug } from "@/types";

/* ------------------------------------------------------------------ */
/*  GET — List all applications with optional filters                  */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.id || token.role !== "admin") {
      return NextResponse.json(
        { success: false, data: null, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const courseSlugParam = searchParams.get("courseSlug");

    const filters: { status?: ApplicationStatus; courseSlug?: CourseSlug } = {};

    if (statusParam && statusParam !== "ALL") {
      filters.status = statusParam as ApplicationStatus;
    }
    if (courseSlugParam && courseSlugParam !== "ALL") {
      filters.courseSlug = courseSlugParam;
    }

    const applications = await getAllApplications(filters);

    return NextResponse.json({
      success: true,
      data: applications,
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/admin/job-applications]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  PATCH — Update application status and admin notes                  */
/* ------------------------------------------------------------------ */

export async function PATCH(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.id || token.role !== "admin") {
      return NextResponse.json(
        { success: false, data: null, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const parsed = updateApplicationStatusSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message ?? "Invalid input";
      return NextResponse.json(
        { success: false, data: null, error: firstIssue },
        { status: 400 },
      );
    }

    const { applicationId, status, adminNotes } = parsed.data;

    const application = await updateApplicationStatus(
      applicationId,
      status as ApplicationStatus,
      adminNotes,
    );

    return NextResponse.json({
      success: true,
      data: application,
      error: null,
    });
  } catch (err) {
    console.error("[PATCH /api/admin/job-applications]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
