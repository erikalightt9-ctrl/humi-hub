import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { createOrganizationSchema } from "@/lib/validations/corporate.schema";

/* ------------------------------------------------------------------ */
/*  GET — List all organizations                                       */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const organizations = await prisma.organization.findMany({
      include: {
        _count: {
          select: { managers: true, students: true, enrollments: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: organizations,
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/admin/organizations]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  POST — Create a new organization                                   */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const body = await request.json();
    const parsed = createOrganizationSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message ?? "Invalid input";
      return NextResponse.json(
        { success: false, data: null, error: firstIssue },
        { status: 400 },
      );
    }

    // Check for duplicate slug or email
    const existing = await prisma.organization.findFirst({
      where: {
        OR: [
          { slug: parsed.data.slug },
          { email: parsed.data.email },
        ],
      },
    });

    if (existing) {
      const field = existing.slug === parsed.data.slug ? "slug" : "email";
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: `An organization with this ${field} already exists`,
        },
        { status: 400 },
      );
    }

    const org = await prisma.organization.create({
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        email: parsed.data.email,
        industry: parsed.data.industry ?? null,
        maxSeats: parsed.data.maxSeats ?? 10,
      },
    });

    return NextResponse.json(
      { success: true, data: org, error: null },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/admin/organizations]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
