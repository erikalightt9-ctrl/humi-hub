import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token || token.role !== "student" || !token.id) {
      return NextResponse.json(
        { success: false, data: null, error: "Authentication required. Only students may apply for jobs." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { jobPostingId, coverLetter } = body;

    if (!jobPostingId || typeof jobPostingId !== "string" || jobPostingId.trim() === "") {
      return NextResponse.json(
        { success: false, data: null, error: "jobPostingId is required" },
        { status: 400 }
      );
    }

    if (!coverLetter || typeof coverLetter !== "string" || coverLetter.trim() === "") {
      return NextResponse.json(
        { success: false, data: null, error: "coverLetter is required" },
        { status: 400 }
      );
    }

    const studentId = token.id as string;

    const jobPosting = await prisma.jobPosting.findFirst({
      where: { id: jobPostingId.trim(), isActive: true },
    });

    if (!jobPosting) {
      return NextResponse.json(
        { success: false, data: null, error: "Job posting not found or is no longer active" },
        { status: 404 }
      );
    }

    const application = await prisma.jobApplication.upsert({
      where: {
        studentId_jobPostingId: {
          studentId,
          jobPostingId: jobPostingId.trim(),
        },
      },
      update: {
        coverLetter: coverLetter.trim(),
        updatedAt: new Date(),
      },
      create: {
        studentId,
        jobPostingId: jobPostingId.trim(),
        coverLetter: coverLetter.trim(),
        status: "PENDING",
      },
    });

    return NextResponse.json(
      { success: true, data: application, error: null },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to submit job application";
    return NextResponse.json(
      { success: false, data: null, error: message },
      { status: 500 }
    );
  }
}
