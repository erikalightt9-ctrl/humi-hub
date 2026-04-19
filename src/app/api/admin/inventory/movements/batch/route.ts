import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { createId } from "@paralleldrive/cuid2";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { logInventoryAudit } from "@/lib/inventory-audit";

const rowSchema = z.object({
  itemId:   z.string().min(1).optional(),       // omit = new item
  name:     z.string().min(1).max(200).optional(),
  unit:     z.string().min(1).max(50).default("pcs"),
  qty:      z.number(),
  unitCost: z.number().min(0).optional(),
  supplier: z.string().max(200).optional(),
  note:     z.string().max(1000).optional(),
});

const batchSchema = z.object({
  categoryId: z.string().min(1),
  rows: z.array(rowSchema).min(1).max(500),
});

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const parsed = batchSchema.safeParse(await request.json());
    if (!parsed.success)
      return NextResponse.json({ success: false, data: null, error: parsed.error.message }, { status: 400 });

    const { categoryId, rows } = parsed.data;

    // Validate category belongs to tenant
    const category = await prisma.inventoryCategory.findFirst({
      where: { id: categoryId, organizationId: guard.tenantId },
    });
    if (!category)
      return NextResponse.json({ success: false, data: null, error: "Category not found" }, { status: 404 });

    // Validate all provided itemIds are scoped to this tenant + category
    const providedItemIds = rows.flatMap((r) => (r.itemId ? [r.itemId] : []));
    if (providedItemIds.length > 0) {
      const found = await prisma.inventoryItem.findMany({
        where: { id: { in: providedItemIds }, organizationId: guard.tenantId, categoryId },
        select: { id: true },
      });
      if (found.length !== providedItemIds.length)
        return NextResponse.json({ success: false, data: null, error: "One or more items not found in this category" }, { status: 400 });
    }

    const userId = (token?.id as string | undefined) ?? null;

    let savedCount = 0;

    const results = await prisma.$transaction(async (tx) => {
      const out: { itemId: string; newStock: number; type: string }[] = [];

      for (const row of rows) {
        if (row.qty === 0 && row.itemId) continue; // skip no-op rows

        if (row.itemId) {
          /* ── existing item: create stock movement ── */
          const item = await tx.inventoryItem.findUnique({ where: { id: row.itemId } });
          if (!item) throw new Error(`Item ${row.itemId} not found`);

          const qty = row.qty;
          const type = qty > 0 ? "IN" : "OUT";
          const delta = qty; // signed: positive = IN, negative = OUT
          const nextStock = Number(item.totalStock) + delta;

          if (nextStock < 0)
            throw new Error(`Insufficient stock for "${item.name}". Current: ${Number(item.totalStock)} ${item.unit}`);

          await tx.stockMovement.create({
            data: {
              id: createId(),
              organizationId: guard.tenantId,
              itemId: item.id,
              type,
              quantity: delta,
              unitCost: row.unitCost ?? null,
              supplier: row.supplier?.trim() || null,
              note: row.note?.trim() || null,
              userId,
            },
          });

          await tx.inventoryItem.update({
            where: { id: item.id },
            data: { totalStock: nextStock },
          });

          out.push({ itemId: item.id, newStock: nextStock, type });
          savedCount++;
        } else {
          /* ── new item: create item + initial stock movement ── */
          if (!row.name?.trim()) continue;

          const qty = Math.max(0, row.qty);
          const itemId = createId();

          await tx.inventoryItem.create({
            data: {
              id: itemId,
              organizationId: guard.tenantId,
              categoryId,
              name: row.name.trim(),
              unit: row.unit || "pcs",
              totalStock: qty,
              minThreshold: 0,
              createdBy: userId,
            },
          });

          if (qty > 0) {
            await tx.stockMovement.create({
              data: {
                id: createId(),
                organizationId: guard.tenantId,
                itemId,
                type: "IN",
                quantity: qty,
                unitCost: row.unitCost ?? null,
                supplier: row.supplier?.trim() || null,
                note: row.note?.trim() || "Initial stock (bulk entry)",
                userId,
              },
            });
          }

          out.push({ itemId, newStock: qty, type: "CREATE" });
          savedCount++;
        }
      }

      return out;
    });

    await logInventoryAudit({
      organizationId: guard.tenantId,
      actorId: userId,
      action: "stock.batch_update",
      targetType: "item",
      payload: { categoryId, saved: savedCount, movements: results },
    });

    return NextResponse.json({ success: true, data: { saved: savedCount, results }, error: null }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { success: false, data: null, error: err instanceof Error ? err.message : "Server error" },
      { status: 500 }
    );
  }
}
