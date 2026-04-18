import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { createId } from "@paralleldrive/cuid2";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { logInventoryAudit } from "@/lib/inventory-audit";

const schema = z.object({
  name:        z.string().min(1).max(150),
  description: z.string().max(2000).optional(),
  icon:        z.string().max(10).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const categories = await prisma.inventoryCategory.findMany({
      where: { organizationId: guard.tenantId },
      orderBy: { name: "asc" },
      include: { _count: { select: { items: true } } },
    });

    return NextResponse.json({ success: true, data: categories, error: null });
  } catch (err) {
    return NextResponse.json({ success: false, data: null, error: err instanceof Error ? err.message : "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ success: false, data: null, error: parsed.error.message }, { status: 400 });

    const record = await prisma.inventoryCategory.create({
      data: {
        id: createId(),
        organizationId: guard.tenantId,
        name: parsed.data.name.trim(),
        description: parsed.data.description?.trim() || null,
        icon: parsed.data.icon?.trim() || null,
      },
    });

    await logInventoryAudit({
      organizationId: guard.tenantId,
      actorId: token?.id as string | undefined,
      action: "category.create",
      targetType: "category",
      targetId: record.id,
      payload: { name: record.name },
    });

    return NextResponse.json({ success: true, data: record, error: null }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error";
    if (msg.includes("Unique constraint")) {
      return NextResponse.json({ success: false, data: null, error: "A category with this name already exists" }, { status: 409 });
    }
    return NextResponse.json({ success: false, data: null, error: msg }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, data: null, error: "Missing id" }, { status: 400 });

    const existing = await prisma.inventoryCategory.findFirst({ where: { id, organizationId: guard.tenantId } });
    if (!existing) return NextResponse.json({ success: false, data: null, error: "Not found" }, { status: 404 });

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ success: false, data: null, error: parsed.error.message }, { status: 400 });

    const updated = await prisma.inventoryCategory.update({
      where: { id },
      data: {
        name: parsed.data.name.trim(),
        description: parsed.data.description?.trim() || null,
        icon: parsed.data.icon?.trim() || null,
      },
    });

    await logInventoryAudit({
      organizationId: guard.tenantId,
      actorId: token?.id as string | undefined,
      action: "category.update",
      targetType: "category",
      targetId: id,
      payload: { before: { name: existing.name }, after: { name: updated.name } },
    });

    return NextResponse.json({ success: true, data: updated, error: null });
  } catch (err) {
    return NextResponse.json({ success: false, data: null, error: err instanceof Error ? err.message : "Server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, data: null, error: "Missing id" }, { status: 400 });

    const existing = await prisma.inventoryCategory.findFirst({
      where: { id, organizationId: guard.tenantId },
      include: { _count: { select: { items: true } } },
    });
    if (!existing) return NextResponse.json({ success: false, data: null, error: "Not found" }, { status: 404 });

    if (existing._count.items > 0) {
      return NextResponse.json({ success: false, data: null, error: "Cannot delete category with items. Move or delete items first." }, { status: 409 });
    }

    await prisma.inventoryCategory.delete({ where: { id } });

    await logInventoryAudit({
      organizationId: guard.tenantId,
      actorId: token?.id as string | undefined,
      action: "category.delete",
      targetType: "category",
      targetId: id,
      payload: { name: existing.name },
    });

    return NextResponse.json({ success: true, data: null, error: null });
  } catch (err) {
    return NextResponse.json({ success: false, data: null, error: err instanceof Error ? err.message : "Server error" }, { status: 500 });
  }
}
