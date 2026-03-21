import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEmployerSession } from "@/lib/employer-auth";
import { z } from "zod";

const jobSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().min(10).max(10000),
  requirements: z.array(z.string().max(200)).max(20).default([]),
  skills: z.array(z.string().max(100)).max(30).default([]),
  location: z.string().min(2).max(200),
  type: z.enum(["Full-time", "Part-time", "Contract", "Freelance"]).default("Full-time"),
  salaryRange: z.string().max(100).optional(),
  industry: z.string().max(100).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const employer = await getEmployerSession();
    if (!employer) {
      return NextResponse.json(
        { success: false, data: null, error: "Authentication required" },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const active = url.searchParams.get("active");

    const where = {
      employerId: employer.id,
      ...(active === "true" ? { isActive: true } : active === "false" ? { isActive: false } : {}),
    };

    const jobs = await prisma.employerJobPosting.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { applications: true } } },
    });

    return NextResponse.json({ success: true, data: jobs, error: null });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to fetch jobs";
    return NextResponse.json({ success: false, data: null, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const employer = await getEmployerSession();
    if (!employer) {
      return NextResponse.json(
        { success: false, data: null, error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = jobSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, data: null, error: parsed.error.issues[0]?.message ?? "Invalid data" },
        { status: 400 }
      );
    }

    const job = await prisma.employerJobPosting.create({
      data: { ...parsed.data, employerId: employer.id },
    });

    return NextResponse.json({ success: true, data: job, error: null }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to create job";
    return NextResponse.json({ success: false, data: null, error: msg }, { status: 500 });
  }
}
