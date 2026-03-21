import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEmployerSession } from "@/lib/employer-auth";
import { z } from "zod";

/* ------------------------------------------------------------------ */
/*  Public — students apply to employer job postings                   */
/* ------------------------------------------------------------------ */

const applySchema = z.object({
  jobPostingId: z.string().min(1),
  applicantName: z.string().min(2).max(200),
  applicantEmail: z.string().email().max(254),
  coverLetter: z.string().min(10).max(5000),
  resumeUrl: z.string().url().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = applySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, data: null, error: parsed.error.issues[0]?.message ?? "Invalid data" },
        { status: 400 }
      );
    }

    const job = await prisma.employerJobPosting.findFirst({
      where: { id: parsed.data.jobPostingId, isActive: true },
    });
    if (!job) {
      return NextResponse.json(
        { success: false, data: null, error: "Job posting not found or no longer active" },
        { status: 404 }
      );
    }

    const application = await prisma.employerApplication.create({
      data: {
        jobPostingId: parsed.data.jobPostingId,
        applicantName: parsed.data.applicantName,
        applicantEmail: parsed.data.applicantEmail,
        coverLetter: parsed.data.coverLetter,
        resumeUrl: parsed.data.resumeUrl ?? null,
        stage: "APPLIED",
      },
    });

    return NextResponse.json({ success: true, data: application, error: null }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to submit application";
    return NextResponse.json({ success: false, data: null, error: msg }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  Employer — view all applications across their jobs                 */
/* ------------------------------------------------------------------ */

export async function GET(req: NextRequest) {
  try {
    const employer = await getEmployerSession();
    if (!employer) {
      return NextResponse.json({ success: false, data: null, error: "Auth required" }, { status: 401 });
    }

    const url = new URL(req.url);
    const stage = url.searchParams.get("stage");
    const jobId = url.searchParams.get("jobId");

    const applications = await prisma.employerApplication.findMany({
      where: {
        jobPosting: { employerId: employer.id },
        ...(stage ? { stage: stage as never } : {}),
        ...(jobId ? { jobPostingId: jobId } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        jobPosting: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json({ success: true, data: applications, error: null });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to fetch applications";
    return NextResponse.json({ success: false, data: null, error: msg }, { status: 500 });
  }
}
