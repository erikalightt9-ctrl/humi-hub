import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEmployerSession } from "@/lib/employer-auth";
import { z } from "zod";

const updateSchema = z.object({
  stage: z.enum(["APPLIED", "REVIEWED", "INTERVIEW", "OFFER", "HIRED", "REJECTED"]).optional(),
  employerNotes: z.string().max(2000).optional(),
  interviewDate: z.string().datetime().optional().nullable(),
  zoomJoinUrl: z.string().url().optional().nullable(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const employer = await getEmployerSession();
    if (!employer) {
      return NextResponse.json({ success: false, data: null, error: "Auth required" }, { status: 401 });
    }

    const { id } = await params;

    const application = await prisma.employerApplication.findFirst({
      where: { id },
      include: { jobPosting: { select: { employerId: true } } },
    });

    if (!application || application.jobPosting.employerId !== employer.id) {
      return NextResponse.json({ success: false, data: null, error: "Application not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, data: null, error: "Invalid data" }, { status: 400 });
    }

    const updated = await prisma.employerApplication.update({
      where: { id },
      data: {
        ...(parsed.data.stage ? { stage: parsed.data.stage } : {}),
        ...(parsed.data.employerNotes !== undefined ? { employerNotes: parsed.data.employerNotes } : {}),
        ...(parsed.data.interviewDate !== undefined
          ? { interviewDate: parsed.data.interviewDate ? new Date(parsed.data.interviewDate) : null }
          : {}),
        ...(parsed.data.zoomJoinUrl !== undefined ? { zoomJoinUrl: parsed.data.zoomJoinUrl } : {}),
      },
    });

    return NextResponse.json({ success: true, data: updated, error: null });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to update";
    return NextResponse.json({ success: false, data: null, error: msg }, { status: 500 });
  }
}
