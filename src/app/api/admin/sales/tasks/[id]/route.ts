import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import {
  updateTask,
  deleteTask,
} from "@/lib/repositories/crm.repository";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const body = await request.json();

    const task = await updateTask(guard.tenantId, (await params).id, {
      title:       body.title       ?? undefined,
      description: body.description ?? undefined,
      dueDate:     body.dueDate ? new Date(body.dueDate) : undefined,
      isDone:      body.isDone      ?? undefined,
    });

    return NextResponse.json({ success: true, data: task, error: null });
  } catch (err) {
    console.error("[PUT /api/admin/sales/tasks/[id]]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    const status  = message === "Task not found" ? 404 : 500;
    return NextResponse.json({ success: false, data: null, error: message }, { status });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    await deleteTask(guard.tenantId, (await params).id);

    return NextResponse.json({ success: true, data: null, error: null });
  } catch (err) {
    console.error("[DELETE /api/admin/sales/tasks/[id]]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    const status  = message === "Task not found" ? 404 : 500;
    return NextResponse.json({ success: false, data: null, error: message }, { status });
  }
}
