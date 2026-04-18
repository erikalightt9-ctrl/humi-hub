import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { createId } from "@paralleldrive/cuid2";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { logInventoryAudit } from "@/lib/inventory-audit";

const schema = z.object({
  itemId:   z.string().min(1),
  type:     z.enum(["IN", "OUT", "ADJUST"]),
  quantity: z.number(),
  unitCost: z.number().min(0).optional(),
  supplier: z.string().max(200).optional(),
  note:     z.string().max(1000).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const url = new URL(request.url);
    const itemId = url.searchParams.get("itemId") ?? undefined;
    const limit  = Math.min(Number(url.searchParams.get("limit") ?? "50"), 200);

    const movements = await prisma.stockMovement.findMany({
      where: {
        organizationId: guard.tenantId,
        ...(itemId ? { itemId } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        item: { select: { id: true, name: true, unit: true, categoryId: true } },
      },
    });

    return NextResponse.json({ success: true, data: movements, error: null });
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

    const { itemId, type, quantity, unitCost, supplier, note } = parsed.data;

    // For IN/OUT quantity must be positive; ADJUST can be signed
    if (type !== "ADJUST" && quantity <= 0) {
      return NextResponse.json({ success: false, data: null, error: "Quantity must be positive for IN/OUT" }, { status: 400 });
    }

    const item = await prisma.inventoryItem.findFirst({
      where: { id: itemId, organizationId: guard.tenantId },
    });
    if (!item) return NextResponse.json({ success: false, data: null, error: "Item not found" }, { status: 404 });

    const currentStock = Number(item.totalStock);
    const delta =
      type === "IN"     ? quantity :
      type === "OUT"    ? -quantity :
                          quantity; // ADJUST uses signed value directly
    const nextStock = currentStock + delta;

    if (nextStock < 0) {
      return NextResponse.json({ success: false, data: null, error: `Insufficient stock. Current: ${currentStock} ${item.unit}` }, { status: 400 });
    }

    const userId = token?.id as string | undefined;

    const { movement } = await prisma.$transaction(async (tx) => {
      const movement = await tx.stockMovement.create({
        data: {
          id: createId(),
          organizationId: guard.tenantId,
          itemId,
          type,
          quantity: delta, // store signed delta
          unitCost,
          supplier: supplier?.trim() || null,
          note: note?.trim() || null,
          userId: userId ?? null,
        },
      });

      await tx.inventoryItem.update({
        where: { id: itemId },
        data: { totalStock: nextStock },
      });

      return { movement };
    });

    await logInventoryAudit({
      organizationId: guard.tenantId,
      actorId: userId,
      action: `stock.${type.toLowerCase()}`,
      targetType: "movement",
      targetId: movement.id,
      payload: { itemId, itemName: item.name, quantity: delta, before: currentStock, after: nextStock },
    });

    return NextResponse.json({ success: true, data: { movement, newStock: nextStock }, error: null }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, data: null, error: err instanceof Error ? err.message : "Server error" }, { status: 500 });
  }
}
