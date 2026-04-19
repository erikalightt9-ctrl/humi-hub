import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { createId } from "@paralleldrive/cuid2";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { logInventoryAudit } from "@/lib/inventory-audit";

const rowSchema = z.object({
  name:         z.string().min(1).max(200),
  categoryId:   z.string().min(1).optional(),
  quantity:     z.number().min(0),
  minThreshold: z.number().min(0).default(0),
  location:     z.string().max(200).optional(),
  unit:         z.string().min(1).max(50).default("pcs"),
});

const bulkSchema = z.object({
  rows: z.array(rowSchema).min(1).max(500),
});

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const parsed = bulkSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, data: null, error: parsed.error.message }, { status: 400 });
    }

    const userId = (token?.id as string | undefined) ?? null;

    const inserted = await prisma.$transaction(async (tx) => {
      let count = 0;
      for (const r of parsed.data.rows) {
        const itemId = createId();
        await tx.inventoryItem.create({
          data: {
            id: itemId,
            organizationId: guard.tenantId,
            categoryId: r.categoryId ?? null,
            name: r.name.trim(),
            unit: r.unit.trim() || "pcs",
            minThreshold: r.minThreshold,
            totalStock: r.quantity,
            location: r.location?.trim() || null,
            createdBy: userId,
          },
        });
        if (r.quantity > 0) {
          await tx.stockMovement.create({
            data: {
              id: createId(),
              organizationId: guard.tenantId,
              itemId,
              type: "IN",
              quantity: r.quantity,
              note: "Bulk entry — initial stock",
              userId,
            },
          });
        }
        count++;
      }
      return count;
    });

    await logInventoryAudit({
      organizationId: guard.tenantId,
      actorId: userId,
      action: "item.bulk_create",
      targetType: "item",
      payload: { count: inserted },
    });

    return NextResponse.json({ success: true, data: { inserted }, error: null }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" }, { status: 500 });
  }
}
