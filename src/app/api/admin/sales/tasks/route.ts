import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import {
  listTasks,
  createTask,
} from "@/lib/repositories/crm.repository";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const { searchParams } = new URL(request.url);
    const dealId = searchParams.get("dealId") ?? undefined;
    const isDoneParam = searchParams.get("isDone");
    const isDone = isDoneParam === "true" ? true : isDoneParam === "false" ? false : undefined;
    const page   = searchParams.get("page")  ? Number(searchParams.get("page"))  : undefined;
    const limit  = searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined;

    const result = await listTasks(guard.tenantId, { dealId, isDone, page, limit });

    return NextResponse.json({ success: true, data: result, error: null });
  } catch (err) {
    console.error("[GET /api/admin/sales/tasks]", err);
    return NextResponse.json(
      { success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const body = await request.json();

    if (!body.title || typeof body.title !== "string") {
      return NextResponse.json(
        { success: false, data: null, error: "title is required" },
        { status: 400 }
      );
    }

    const task = await createTask(guard.tenantId, {
      title:       body.title,
      description: body.description ?? undefined,
      dueDate:     body.dueDate ? new Date(body.dueDate) : undefined,
      dealId:      body.dealId  ?? undefined,
    });

    return NextResponse.json({ success: true, data: task, error: null }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/sales/tasks]", err);
    return NextResponse.json(
      { success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
