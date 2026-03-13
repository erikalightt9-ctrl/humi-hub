import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import {
  getInternshipListings,
  getStudentApplications,
  hasApplied,
  createApplication,
} from "@/lib/repositories/job-application.repository";
import { applySchema } from "@/lib/validations/job-application.schema";


/* ------------------------------------------------------------------ */
/*  GET — Internship listings + student's applications                 */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.id || token.role !== "student") {
      return NextResponse.json(
        { success: false, data: null, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const studentId = token.id as string;

    // Get student's course slug for filtering
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        enrollment: {
          select: {
            course: {
              select: { slug: true },
            },
          },
        },
      },
    });

    const courseSlug = student?.enrollment?.course?.slug;

    const [listings, applications] = await Promise.all([
      getInternshipListings(courseSlug),
      getStudentApplications(studentId),
    ]);

    // Filter applications to only internship-related ones
    const internshipApplications = applications.filter(
      (app) => app.jobPosting.isInternship,
    );

    return NextResponse.json({
      success: true,
      data: { listings, applications: internshipApplications },
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/student/internship-program]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  POST — Apply to an internship                                      */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.id || token.role !== "student") {
      return NextResponse.json(
        { success: false, data: null, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const studentId = token.id as string;
    const body = await request.json();
    const parsed = applySchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message ?? "Invalid input";
      return NextResponse.json(
        { success: false, data: null, error: firstIssue },
        { status: 400 },
      );
    }

    const { jobPostingId, coverLetter } = parsed.data;

    // Check if already applied
    const alreadyApplied = await hasApplied(studentId, jobPostingId);
    if (alreadyApplied) {
      return NextResponse.json(
        { success: false, data: null, error: "You have already applied to this position" },
        { status: 409 },
      );
    }

    // Verify the job posting exists, is active, and is an internship
    const jobPosting = await prisma.jobPosting.findUnique({
      where: { id: jobPostingId },
      select: { isActive: true, isInternship: true },
    });

    if (!jobPosting) {
      return NextResponse.json(
        { success: false, data: null, error: "Job posting not found" },
        { status: 404 },
      );
    }

    if (!jobPosting.isActive) {
      return NextResponse.json(
        { success: false, data: null, error: "This position is no longer accepting applications" },
        { status: 400 },
      );
    }

    if (!jobPosting.isInternship) {
      return NextResponse.json(
        { success: false, data: null, error: "This position is not an internship" },
        { status: 400 },
      );
    }

    const application = await createApplication(studentId, jobPostingId, coverLetter);

    return NextResponse.json(
      { success: true, data: application, error: null },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/student/internship-program]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
