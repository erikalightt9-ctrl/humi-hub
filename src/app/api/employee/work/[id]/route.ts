import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  status: z.enum(["TODO", "IN_PROGRESS", "DONE", "BLOCKED"]),
  timeSpentMinutes: z.number().int().min(0).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== "employee") {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }

    const employee = await prisma.hrEmployee.findFirst({
      where: { email: token.email as string },
      select: { id: true, organizationId: true },
    });
    if (!employee) {
      return NextResponse.json({ success: false, data: null, error: "Employee not found" }, { status: 404 });
    }

    const task = await prisma.organizationTask.findFirst({
      where: { id, organizationId: employee.organizationId, assigneeId: employee.id },
    });
    if (!task) {
      return NextResponse.json({ success: false, data: null, error: "Task not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, data: null, error: parsed.error.issues[0]?.message ?? "Invalid" },
        { status: 422 }
      );
    }

    const now = new Date();
    const { status, timeSpentMinutes } = parsed.data;

    const startedAt = status === "IN_PROGRESS" && !task.startedAt ? now
                    : status === "TODO" ? null
                    : undefined;
    const completedAt = status === "DONE" && !task.completedAt ? now
                      : status !== "DONE" ? null
                      : undefined;

    let spent = timeSpentMinutes;
    if (status === "DONE" && task.startedAt && spent === undefined) {
      spent = Math.floor((now.getTime() - new Date(task.startedAt).getTime()) / 60000);
    }

    const updated = await prisma.organizationTask.update({
      where: { id },
      data: {
        status,
        ...(startedAt !== undefined ? { startedAt } : {}),
        ...(completedAt !== undefined ? { completedAt } : {}),
        ...(spent !== undefined ? { timeSpentMinutes: spent } : {}),
      },
    });

    return NextResponse.json({ success: true, data: updated, error: null });
  } catch (err) {
    console.error("[PATCH /api/employee/work/[id]]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}
