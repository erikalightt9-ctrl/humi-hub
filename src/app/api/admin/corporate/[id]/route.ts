import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

// GET /api/admin/corporate/:id
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const guard = requireAdmin(token);
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;

    const org = await prisma.organization.findUnique({
      where: { id },
      include: {
        managers: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
        students: {
          select: {
            id: true,
            name: true,
            email: true,
            accessGranted: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        courses: {
          select: {
            id: true,
            title: true,
            isActive: true,
          },
        },
        _count: {
          select: { students: true, managers: true, courses: true },
        },
      },
    });

    if (!org) {
      return NextResponse.json({ success: false, data: null, error: "Organization not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: org.id,
        name: org.name,
        email: org.email,
        industry: org.industry ?? null,
        maxSeats: org.maxSeats,
        isActive: org.isActive,
        plan: org.plan,
        planExpiresAt: org.planExpiresAt?.toISOString() ?? null,
        createdAt: org.createdAt.toISOString(),
        managers: org.managers.map((m) => ({
          id: m.id,
          name: m.name,
          email: m.email,
          role: m.role,
          isActive: m.isActive,
          createdAt: m.createdAt.toISOString(),
        })),
        students: org.students.map((s) => ({
          id: s.id,
          name: s.name,
          email: s.email,
          isActive: s.accessGranted,
          createdAt: s.createdAt.toISOString(),
        })),
        courses: org.courses.map((c) => ({
          id: c.id,
          title: c.title,
          isActive: c.isActive,
        })),
        counts: {
          students: org._count.students,
          managers: org._count.managers,
          courses: org._count.courses,
        },
      },
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/admin/corporate/:id]", err);
    return NextResponse.json({ success: false, data: null, error: "Failed to fetch organization" }, { status: 500 });
  }
}
