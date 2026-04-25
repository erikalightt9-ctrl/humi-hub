import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { createId } from "@paralleldrive/cuid2";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  title:        z.string().min(1).max(200),
  description:  z.string().max(2000).optional(),
  status:       z.enum(["TODO", "IN_PROGRESS", "DONE", "BLOCKED"]).default("TODO"),
  priority:     z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  dueDate:      z.string().datetime().optional().nullable(),
  assigneeName: z.string().max(100).optional().nullable(),
  assigneeId:   z.string().max(100).optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const { searchParams } = req.nextUrl;
    const status   = searchParams.get("status") ?? undefined;
    const priority = searchParams.get("priority") ?? undefined;
    const search   = searchParams.get("search") ?? undefined;
    const assigneeId = searchParams.get("assigneeId") ?? undefined;

    const tasks = await prisma.organizationTask.findMany({
      where: {
        organizationId: guard.tenantId,
        ...(status ? { status: status as never } : {}),
        ...(priority ? { priority: priority as never } : {}),
        ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
        ...(assigneeId ? { assigneeId } : {}),
      },
      orderBy: [{ status: "asc" }, { priority: "desc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ success: true, data: tasks, error: null });
  } catch (err) {
    console.error("[GET /api/admin/tasks]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, data: null, error: parsed.error.issues[0]?.message ?? "Validation failed" },
        { status: 422 }
      );
    }

    const d = parsed.data;
    const now = new Date();
    const task = await prisma.organizationTask.create({
      data: {
        id: createId(),
        organizationId: guard.tenantId,
        title: d.title,
        description: d.description,
        status: d.status,
        priority: d.priority,
        dueDate: d.dueDate ? new Date(d.dueDate) : null,
        assigneeName: d.assigneeName,
        assigneeId: d.assigneeId,
        startedAt: d.status === "IN_PROGRESS" ? now : null,
        completedAt: d.status === "DONE" ? now : null,
      },
    });

    return NextResponse.json({ success: true, data: task, error: null }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/tasks]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}
