import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { createId } from "@paralleldrive/cuid2";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { logInventoryAudit } from "@/lib/inventory-audit";

const createSchema = z.object({
  categoryId:   z.string().min(1),
  name:         z.string().min(1).max(200),
  sku:          z.string().max(100).optional(),
  unit:         z.string().min(1).max(50).default("pcs"),
  description:  z.string().max(2000).optional(),
  minThreshold: z.number().min(0).default(0),
  location:     z.string().max(200).optional(),
  initialQty:   z.number().min(0).optional(),
  supplier:     z.string().max(200).optional(),
  unitCost:     z.number().min(0).optional(),
});

const updateSchema = z.object({
  categoryId:   z.string().min(1).optional(),
  name:         z.string().min(1).max(200).optional(),
  sku:          z.string().max(100).optional(),
  unit:         z.string().min(1).max(50).optional(),
  description:  z.string().max(2000).optional(),
  minThreshold: z.number().min(0).optional(),
  location:     z.string().max(200).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const url = new URL(request.url);
    const categoryId = url.searchParams.get("categoryId") ?? undefined;
    const search     = url.searchParams.get("search")     ?? undefined;

    const items = await prisma.inventoryItem.findMany({
      where: {
        organizationId: guard.tenantId,
        ...(categoryId ? { categoryId } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { sku:  { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { name: "asc" },
      include: { category: { select: { id: true, name: true, icon: true } } },
    });

    return NextResponse.json({ success: true, data: items, error: null });
  } catch (err) {
    return NextResponse.json({ success: false, data: null, error: err instanceof Error ? err.message : "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ success: false, data: null, error: parsed.error.message }, { status: 400 });

    const category = await prisma.inventoryCategory.findFirst({
      where: { id: parsed.data.categoryId, organizationId: guard.tenantId },
    });
    if (!category) return NextResponse.json({ success: false, data: null, error: "Category not found" }, { status: 404 });

    const userId = token?.id as string | undefined;
    const itemId = createId();
    const initialQty = parsed.data.initialQty ?? 0;

    const item = await prisma.$transaction(async (tx) => {
      const created = await tx.inventoryItem.create({
        data: {
          id: itemId,
          organizationId: guard.tenantId,
          categoryId: parsed.data.categoryId,
          name: parsed.data.name.trim(),
          sku: parsed.data.sku?.trim() || null,
          unit: parsed.data.unit.trim() || "pcs",
          description: parsed.data.description?.trim() || null,
          minThreshold: parsed.data.minThreshold,
          totalStock: initialQty,
          location: parsed.data.location?.trim() || null,
          createdBy: userId ?? null,
        },
      });

      if (initialQty > 0) {
        await tx.stockMovement.create({
          data: {
            id: createId(),
            organizationId: guard.tenantId,
            itemId: created.id,
            type: "IN",
            quantity: initialQty,
            unitCost: parsed.data.unitCost,
            supplier: parsed.data.supplier?.trim() || null,
            note: "Initial stock",
            userId: userId ?? null,
          },
        });
      }

      return created;
    });

    await logInventoryAudit({
      organizationId: guard.tenantId,
      actorId: userId,
      action: "item.create",
      targetType: "item",
      targetId: item.id,
      payload: { name: item.name, categoryId: item.categoryId, initialQty },
    });

    return NextResponse.json({ success: true, data: item, error: null }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Server error";
    if (msg.includes("Unique constraint")) {
      return NextResponse.json({ success: false, data: null, error: "An item with this SKU already exists" }, { status: 409 });
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

    const existing = await prisma.inventoryItem.findFirst({ where: { id, organizationId: guard.tenantId } });
    if (!existing) return NextResponse.json({ success: false, data: null, error: "Not found" }, { status: 404 });

    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ success: false, data: null, error: parsed.error.message }, { status: 400 });

    if (parsed.data.categoryId) {
      const cat = await prisma.inventoryCategory.findFirst({
        where: { id: parsed.data.categoryId, organizationId: guard.tenantId },
      });
      if (!cat) return NextResponse.json({ success: false, data: null, error: "Category not found" }, { status: 404 });
    }

    const updated = await prisma.inventoryItem.update({
      where: { id },
      data: {
        ...(parsed.data.categoryId ? { categoryId: parsed.data.categoryId } : {}),
        ...(parsed.data.name ? { name: parsed.data.name.trim() } : {}),
        ...(parsed.data.sku !== undefined ? { sku: parsed.data.sku?.trim() || null } : {}),
        ...(parsed.data.unit ? { unit: parsed.data.unit.trim() } : {}),
        ...(parsed.data.description !== undefined ? { description: parsed.data.description?.trim() || null } : {}),
        ...(parsed.data.minThreshold !== undefined ? { minThreshold: parsed.data.minThreshold } : {}),
        ...(parsed.data.location !== undefined ? { location: parsed.data.location?.trim() || null } : {}),
      },
    });

    await logInventoryAudit({
      organizationId: guard.tenantId,
      actorId: token?.id as string | undefined,
      action: "item.update",
      targetType: "item",
      targetId: id,
      payload: parsed.data,
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

    const existing = await prisma.inventoryItem.findFirst({ where: { id, organizationId: guard.tenantId } });
    if (!existing) return NextResponse.json({ success: false, data: null, error: "Not found" }, { status: 404 });

    await prisma.inventoryItem.delete({ where: { id } });

    await logInventoryAudit({
      organizationId: guard.tenantId,
      actorId: token?.id as string | undefined,
      action: "item.delete",
      targetType: "item",
      targetId: id,
      payload: { name: existing.name },
    });

    return NextResponse.json({ success: true, data: null, error: null });
  } catch (err) {
    return NextResponse.json({ success: false, data: null, error: err instanceof Error ? err.message : "Server error" }, { status: 500 });
  }
}
