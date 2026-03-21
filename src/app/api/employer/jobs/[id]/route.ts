import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEmployerSession } from "@/lib/employer-auth";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().min(10).max(10000).optional(),
  requirements: z.array(z.string().max(200)).max(20).optional(),
  skills: z.array(z.string().max(100)).max(30).optional(),
  location: z.string().min(2).max(200).optional(),
  type: z.enum(["Full-time", "Part-time", "Contract", "Freelance"]).optional(),
  salaryRange: z.string().max(100).optional(),
  industry: z.string().max(100).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const employer = await getEmployerSession();
    if (!employer) {
      return NextResponse.json({ success: false, data: null, error: "Auth required" }, { status: 401 });
    }
    const { id } = await params;
    const job = await prisma.employerJobPosting.findFirst({
      where: { id, employerId: employer.id },
      include: {
        applications: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true, applicantName: true, applicantEmail: true,
            stage: true, createdAt: true, interviewDate: true, zoomJoinUrl: true,
          },
        },
        _count: { select: { applications: true } },
      },
    });
    if (!job) {
      return NextResponse.json({ success: false, data: null, error: "Job not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: job, error: null });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ success: false, data: null, error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const employer = await getEmployerSession();
    if (!employer) {
      return NextResponse.json({ success: false, data: null, error: "Auth required" }, { status: 401 });
    }
    const { id } = await params;
    const existing = await prisma.employerJobPosting.findFirst({ where: { id, employerId: employer.id } });
    if (!existing) {
      return NextResponse.json({ success: false, data: null, error: "Job not found" }, { status: 404 });
    }
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, data: null, error: "Invalid data" }, { status: 400 });
    }
    const updated = await prisma.employerJobPosting.update({ where: { id }, data: parsed.data });
    return NextResponse.json({ success: true, data: updated, error: null });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ success: false, data: null, error: msg }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const employer = await getEmployerSession();
    if (!employer) {
      return NextResponse.json({ success: false, data: null, error: "Auth required" }, { status: 401 });
    }
    const { id } = await params;
    const existing = await prisma.employerJobPosting.findFirst({ where: { id, employerId: employer.id } });
    if (!existing) {
      return NextResponse.json({ success: false, data: null, error: "Job not found" }, { status: 404 });
    }
    await prisma.employerJobPosting.delete({ where: { id } });
    return NextResponse.json({ success: true, data: null, error: null });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ success: false, data: null, error: msg }, { status: 500 });
  }
}
