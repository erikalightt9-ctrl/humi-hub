import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

/* ------------------------------------------------------------------ */
/*  GET — List courses available for enrollment                        */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token?.id || (token.role !== "corporate" && token.role !== "tenant_admin")) {
      return NextResponse.json(
        { success: false, data: null, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const courses = await prisma.course.findMany({
      where: { isActive: true },
      select: { id: true, title: true, slug: true },
      orderBy: { title: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: courses,
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/corporate/courses]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
