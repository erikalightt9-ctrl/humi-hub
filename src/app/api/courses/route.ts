import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveTenantFromSubdomain } from "@/lib/tenant";

/* ------------------------------------------------------------------ */
/*  GET /api/courses                                                   */
/*  Public endpoint — returns active courses for the current tenant.  */
/*  Query params:                                                      */
/*    search   — filter by title OR industry OR description            */
/*    industry — exact industry match (case-insensitive)              */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search")?.trim() ?? "";
    const industry = searchParams.get("industry")?.trim() ?? "";

    const tenant = await resolveTenantFromSubdomain();

    const courses = await prisma.course.findMany({
      where: {
        isActive: true,
        ...(tenant ? { tenantId: tenant.tenantId } : {}),
        ...(industry
          ? { industry: { equals: industry, mode: "insensitive" } }
          : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                { industry: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        durationWeeks: true,
        price: true,
        currency: true,
        industry: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const data = courses.map((c) => ({
      ...c,
      price: c.price.toString(),
    }));

    return NextResponse.json({ success: true, data, error: null });
  } catch (err) {
    console.error("[GET /api/courses]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
