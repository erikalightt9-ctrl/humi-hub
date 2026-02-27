import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id || token.role !== "admin") {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }
    const courses = await prisma.course.findMany({
      select: { id: true, title: true, slug: true, isActive: true },
      orderBy: { title: "asc" },
    });
    return NextResponse.json({ success: true, data: courses, error: null });
  } catch (err) {
    console.error("[GET /api/admin/courses]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}
