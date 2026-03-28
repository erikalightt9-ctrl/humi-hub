import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { z } from "zod";

export const dynamic = "force-dynamic";

const editCourseSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  isActive: z.boolean().optional(),
});

/* ------------------------------------------------------------------ */
/*  PUT — Edit course title / toggle active                           */
/* ------------------------------------------------------------------ */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const guard = requireAdmin(token);
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");
    if (!courseId) return NextResponse.json({ success: false, data: null, error: "courseId required" }, { status: 400 });

    const existing = await prisma.course.findFirst({
      where: { id: courseId, tenantId: id },
    });
    if (!existing) return NextResponse.json({ success: false, data: null, error: "Course not found" }, { status: 404 });

    const body = await req.json();
    const result = editCourseSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ success: false, data: null, error: result.error.issues[0]?.message ?? "Invalid input" }, { status: 422 });

    const updated = await prisma.course.update({
      where: { id: courseId },
      data: {
        ...(result.data.title !== undefined ? { title: result.data.title } : {}),
        ...(result.data.isActive !== undefined ? { isActive: result.data.isActive } : {}),
      },
    });

    await prisma.auditLog.create({
      data: {
        tenantId: id,
        actorId: token!.id as string,
        actorRole: "ADMIN",
        action: "COURSE_UPDATE",
        entity: "Course",
        entityId: courseId,
        meta: { before: { title: existing.title, isActive: existing.isActive }, after: { title: updated.title, isActive: updated.isActive } },
      },
    });

    return NextResponse.json({ success: true, data: { id: updated.id, title: updated.title, isActive: updated.isActive }, error: null });
  } catch (err) {
    console.error("[PUT /api/admin/corporate/:id/courses]", err);
    return NextResponse.json({ success: false, data: null, error: "Failed to update course" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  DELETE — Soft delete course (set isActive = false) for this org  */
/* ------------------------------------------------------------------ */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const guard = requireAdmin(token);
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");
    if (!courseId) return NextResponse.json({ success: false, data: null, error: "courseId required" }, { status: 400 });

    const existing = await prisma.course.findFirst({
      where: { id: courseId, tenantId: id },
    });
    if (!existing) return NextResponse.json({ success: false, data: null, error: "Course not found for this organization" }, { status: 404 });

    await prisma.course.update({
      where: { id: courseId },
      data: { isActive: false },
    });

    await prisma.auditLog.create({
      data: {
        tenantId: id,
        actorId: token!.id as string,
        actorRole: "ADMIN",
        action: "COURSE_DEACTIVATE",
        entity: "Course",
        entityId: courseId,
        meta: { title: existing.title },
      },
    });

    return NextResponse.json({ success: true, data: { deactivated: true }, error: null });
  } catch (err) {
    console.error("[DELETE /api/admin/corporate/:id/courses]", err);
    return NextResponse.json({ success: false, data: null, error: "Failed to deactivate course" }, { status: 500 });
  }
}
