import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { createId } from "@paralleldrive/cuid2";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

const CATEGORIES = [
  "Cleaning Supplies",
  "Pantry Supplies",
  "Maintenance Supplies",
  "Assets",
  "Stockroom Stocks",
] as const;

const rowSchema = z.object({
  name:         z.string().min(1).max(200),
  category:     z.enum(CATEGORIES),
  quantity:     z.number().min(0),
  unit:         z.string().min(1).max(50).default("pcs"),
  minThreshold: z.number().min(0).default(0),
  location:     z.string().max(200).optional(),
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

    const createdBy = (token?.id as string | undefined) ?? null;

    const payload = parsed.data.rows.map((r) => ({
      id: createId(),
      organizationId: guard.tenantId,
      name: r.name.trim(),
      category: r.category,
      quantity: r.quantity,
      unit: r.unit.trim() || "pcs",
      minThreshold: r.minThreshold,
      location: r.location?.trim() || null,
      createdBy,
    }));

    const result = await prisma.adminStockItem.createMany({ data: payload });

    return NextResponse.json(
      { success: true, data: { inserted: result.count }, error: null },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
