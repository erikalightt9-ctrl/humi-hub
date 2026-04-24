import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  title:        z.string().min(1).max(200).optional(),
  description:  z.string().max(2000).optional().nullable(),
  status:       z.enum(["TODO", "IN_PROGRESS", "DONE", "BLOCKED"]).optional(),
  priority:     z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  dueDate:      z.string().datetime().optional().nullable(),
  assigneeName: z.string().max(100).optional().nullable(),
  assigneeId:   z.string().max(100).optional().nullable(),
  timeSpentMinutes: z.number().int().min(0).optional().nullable(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const existing = await prisma.organizationTask.findFirst({
      where: { id, organizationId: guard.tenantId },
    });
    if (!existing) {
      return NextResponse.json({ success: false, data: null, error: "Task not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, data: null, error: parsed.error.issues[0]?.message ?? "Validation failed" },
        { status: 422 }
      );
    }

    const d = parsed.data;
    const now = new Date();

    // Status transition: auto-set timestamps
    const startedAt = d.status === "IN_PROGRESS" && !existing.startedAt ? now
                    : d.status === "TODO" ? null
                    : undefined;
    const completedAt = d.status === "DONE" && !existing.completedAt ? now
                      : d.status !== "DONE" ? null
                      : undefined;

    // Auto-compute time spent when completing
    let timeSpentMinutes = d.timeSpentMinutes;
    if (d.status === "DONE" && existing.startedAt && timeSpentMinutes === undefined) {
      timeSpentMinutes = Math.floor(
        (now.getTime() - new Date(existing.startedAt).getTime()) / 60000
      );
    }

    const task = await prisma.organizationTask.update({
      where: { id },
      data: {
        ...(d.title !== undefined ? { title: d.title } : {}),
        ...(d.description !== undefined ? { description: d.description } : {}),
        ...(d.status !== undefined ? { status: d.status } : {}),
        ...(d.priority !== undefined ? { priority: d.priority } : {}),
        ...(d.dueDate !== undefined ? { dueDate: d.dueDate ? new Date(d.dueDate) : null } : {}),
        ...(d.assigneeName !== undefined ? { assigneeName: d.assigneeName } : {}),
        ...(d.assigneeId !== undefined ? { assigneeId: d.assigneeId } : {}),
        ...(startedAt !== undefined ? { startedAt } : {}),
        ...(completedAt !== undefined ? { completedAt } : {}),
        ...(timeSpentMinutes !== undefined ? { timeSpentMinutes } : {}),
      },
    });

    return NextResponse.json({ success: true, data: task, error: null });
  } catch (err) {
    console.error("[PATCH /api/admin/tasks/[id]]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    await prisma.organizationTask.deleteMany({
      where: { id, organizationId: guard.tenantId },
    });

    return NextResponse.json({ success: true, data: null, error: null });
  } catch (err) {
    console.error("[DELETE /api/admin/tasks/[id]]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}
