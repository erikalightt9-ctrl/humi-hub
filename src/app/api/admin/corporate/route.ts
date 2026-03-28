import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

// GET /api/admin/corporate?search=&page=&limit=
export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const guard = requireAdmin(token);
  if (!guard.ok) return guard.response;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? "";
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "20")));
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { industry: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [organizations, total] = await Promise.all([
      prisma.organization.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          industry: true,
          maxSeats: true,
          isActive: true,
          plan: true,
          createdAt: true,
          _count: {
            select: { students: true, managers: true },
          },
        },
      }),
      prisma.organization.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        organizations: organizations.map((org) => ({
          id: org.id,
          name: org.name,
          email: org.email,
          industry: org.industry ?? null,
          maxSeats: org.maxSeats,
          isActive: org.isActive,
          plan: org.plan,
          employeeCount: org._count.students,
          managerCount: org._count.managers,
          createdAt: org.createdAt.toISOString(),
        })),
        total,
        page,
        limit,
      },
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/admin/corporate]", err);
    return NextResponse.json({ success: false, data: null, error: "Failed to fetch organizations" }, { status: 500 });
  }
}

// POST /api/admin/corporate
export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const guard = requireAdmin(token);
  if (!guard.ok) return guard.response;

  try {
    const body = await req.json();
    const { name, email, industry, maxSeats = 10, plan = "TRIAL" } = body;

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ success: false, data: null, error: "Name and email are required" }, { status: 400 });
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const uniqueSlug = `${slug}-${Date.now()}`;

    const org = await prisma.organization.create({
      data: {
        name: name.trim(),
        slug: uniqueSlug,
        email: email.trim(),
        industry: industry?.trim() || null,
        maxSeats: Number(maxSeats),
        plan,
      },
    });

    return NextResponse.json({ success: true, data: { id: org.id }, error: null }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/corporate]", err);
    return NextResponse.json({ success: false, data: null, error: "Failed to create organization" }, { status: 500 });
  }
}
