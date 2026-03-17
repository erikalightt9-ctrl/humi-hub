import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import {
  getJobPostingById,
  updateJobPosting,
  deleteJobPosting,
} from "@/lib/repositories/job-matching.repository";
import { updateJobPostingSchema } from "@/lib/validations/ai-job-matching.schema";

/* ------------------------------------------------------------------ */
/*  PATCH — Update a job posting                                       */
/* ------------------------------------------------------------------ */

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const { id } = await params;

    const existing = await getJobPostingById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, data: null, error: "Job posting not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const parsed = updateJobPostingSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message ?? "Invalid input";
      return NextResponse.json(
        { success: false, data: null, error: firstIssue },
        { status: 400 },
      );
    }

    const updated = await updateJobPosting(id, parsed.data);

    return NextResponse.json({
      success: true,
      data: updated,
      error: null,
    });
  } catch (err) {
    console.error("[PATCH /api/admin/job-postings/[id]]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  DELETE — Remove a job posting                                      */
/* ------------------------------------------------------------------ */

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const { id } = await params;

    const existing = await getJobPostingById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, data: null, error: "Job posting not found" },
        { status: 404 },
      );
    }

    await deleteJobPosting(id);

    return NextResponse.json({
      success: true,
      data: null,
      error: null,
    });
  } catch (err) {
    console.error("[DELETE /api/admin/job-postings/[id]]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
