import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { createId } from "@paralleldrive/cuid2";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  itemName:     z.string().min(1).max(200),
  itemType:     z.string().max(100).optional(),
  dateReported: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dateResolved: z.string().optional(),
  description:  z.string().min(1),
  status:       z.enum(["PENDING","IN_PROGRESS","COMPLETED","CANCELLED"]).default("PENDING"),
  cost:         z.number().min(0).optional(),
  technician:   z.string().max(200).optional(),
  notes:        z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const { searchParams } = new URL(request.url);

    if (searchParams.get("stats") === "1") {
      const pending = await prisma.adminRepairLog.count({ where: { organizationId: guard.tenantId, status: { in: ["PENDING", "IN_PROGRESS"] } } });
      return NextResponse.json({ success: true, data: { pending }, error: null });
    }

    const status = searchParams.get("status") ?? undefined;
    const data = await prisma.adminRepairLog.findMany({
      where: { organizationId: guard.tenantId, ...(status && { status: status as never }) },
      orderBy: { dateReported: "desc" },
    });
    return NextResponse.json({ success: true, data, error: null });
  } catch (err) {
    return NextResponse.json({ success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ success: false, data: null, error: parsed.error.message }, { status: 400 });

    const { dateReported, dateResolved, ...rest } = parsed.data;
    const record = await prisma.adminRepairLog.create({
      data: { id: createId(), organizationId: guard.tenantId, ...rest, dateReported: new Date(dateReported), dateResolved: dateResolved ? new Date(dateResolved) : null },
    });
    return NextResponse.json({ success: true, data: record, error: null }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, data: null, error: "Missing id" }, { status: 400 });

    const existing = await prisma.adminRepairLog.findFirst({ where: { id, organizationId: guard.tenantId } });
    if (!existing) return NextResponse.json({ success: false, data: null, error: "Not found" }, { status: 404 });

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ success: false, data: null, error: parsed.error.message }, { status: 400 });

    const editorName = (token as { name?: string; email?: string })?.name || (token as { name?: string; email?: string })?.email || "Admin";
    const { dateReported, dateResolved, ...rest } = parsed.data;
    const updated = await prisma.adminRepairLog.update({
      where: { id },
      data: { ...rest, dateReported: new Date(dateReported), dateResolved: dateResolved ? new Date(dateResolved) : null, lastEditedBy: editorName, lastEditedAt: new Date(), updatedAt: new Date() },
    });
    return NextResponse.json({ success: true, data: updated, error: null });
  } catch (err) {
    return NextResponse.json({ success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" }, { status: 500 });
  }
}
