import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Role = "student" | "trainer";

/**
 * GET /api/admin/users
 * Query params:
 *   ?role=student|trainer   (omit for both)
 *   ?search=<string>         (name or email)
 *   ?page=<number>           (default 1)
 *   ?limit=<number>          (default 20, max 100)
 *
 * Response: { users[], total, page, limit }
 */
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role") as Role | null;
    const search = searchParams.get("search") ?? "";
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "20")));
    const skip = (page - 1) * limit;

    const searchFilter = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    if (role === "student") {
      const [students, total] = await Promise.all([
        prisma.student.findMany({
          where: { ...searchFilter },
          select: {
            id: true,
            name: true,
            email: true,
            accessGranted: true,
            paymentStatus: true,
            createdAt: true,
            enrollment: { select: { course: { select: { title: true } } } },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.student.count({ where: { ...searchFilter } }),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          users: students.map((s) => ({
            id: s.id,
            name: s.name,
            email: s.email,
            role: "student",
            status: s.accessGranted ? "active" : "inactive",
            course: s.enrollment?.course?.title ?? null,
            createdAt: s.createdAt,
          })),
          total,
          page,
          limit,
        },
        error: null,
      });
    }

    if (role === "trainer") {
      const [trainers, total] = await Promise.all([
        prisma.trainer.findMany({
          where: { ...searchFilter },
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
            accessGranted: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.trainer.count({ where: { ...searchFilter } }),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          users: trainers.map((t) => ({
            id: t.id,
            name: t.name,
            email: t.email,
            role: "trainer",
            status: t.isActive && t.accessGranted ? "active" : "inactive",
            course: null,
            createdAt: t.createdAt,
          })),
          total,
          page,
          limit,
        },
        error: null,
      });
    }

    // No role filter — return both
    const [students, trainers, totalStudents, totalTrainers] = await Promise.all([
      prisma.student.findMany({
        where: { ...searchFilter },
        select: {
          id: true,
          name: true,
          email: true,
          accessGranted: true,
          createdAt: true,
          enrollment: { select: { course: { select: { title: true } } } },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.trainer.findMany({
        where: { ...searchFilter },
        select: { id: true, name: true, email: true, isActive: true, accessGranted: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.student.count({ where: { ...searchFilter } }),
      prisma.trainer.count({ where: { ...searchFilter } }),
    ]);

    const users = [
      ...students.map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        role: "student" as const,
        status: s.accessGranted ? "active" : "inactive",
        course: s.enrollment?.course?.title ?? null,
        createdAt: s.createdAt,
      })),
      ...trainers.map((t) => ({
        id: t.id,
        name: t.name,
        email: t.email,
        role: "trainer" as const,
        status: t.isActive && t.accessGranted ? "active" : "inactive",
        course: null,
        createdAt: t.createdAt,
      })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return NextResponse.json({
      success: true,
      data: {
        users,
        total: totalStudents + totalTrainers,
        page,
        limit,
      },
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/admin/users]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
