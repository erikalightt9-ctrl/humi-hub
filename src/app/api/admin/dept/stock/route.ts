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

const schema = z.object({
  name:         z.string().min(1).max(200),
  category:     z.enum(CATEGORIES),
  quantity:     z.number().min(0),
  unit:         z.string().min(1).max(50).default("pcs"),
  minThreshold: z.number().min(0).default(0),
  location:     z.string().max(200).optional(),
  supplier:     z.string().max(200).optional(),
  notes:        z.string().optional(),
});

const adjustSchema = z.object({
  adjustment: z.number(),
  notes:      z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const url = new URL(request.url);

    if (url.searchParams.get("stats") === "1") {
      const all = await prisma.adminStockItem.findMany({ where: { organizationId: guard.tenantId } });
      const byCategory = CATEGORIES.map((cat) => {
        const items = all.filter((i) => i.category === cat);
        const low = items.filter((i) => Number(i.minThreshold) > 0 && Number(i.quantity) <= Number(i.minThreshold)).length;
        return { category: cat, count: items.length, lowStock: low };
      });
      const totalLow = byCategory.reduce((sum, c) => sum + c.lowStock, 0);
      return NextResponse.json({ success: true, data: { total: all.length, totalLow, byCategory }, error: null });
    }

    const category = url.searchParams.get("category");
    const where = {
      organizationId: guard.tenantId,
      ...(category ? { category } : {}),
    };

    const data = await prisma.adminStockItem.findMany({
      where,
      orderBy: { name: "asc" },
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

    const record = await prisma.adminStockItem.create({
      data: { id: createId(), organizationId: guard.tenantId, ...parsed.data },
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

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, data: null, error: "Missing id" }, { status: 400 });

    const existing = await prisma.adminStockItem.findFirst({ where: { id, organizationId: guard.tenantId } });
    if (!existing) return NextResponse.json({ success: false, data: null, error: "Not found" }, { status: 404 });

    // Adjust mode: add/deduct quantity
    if (url.searchParams.get("adjust") === "1") {
      const parsed = adjustSchema.safeParse(await request.json());
      if (!parsed.success) return NextResponse.json({ success: false, data: null, error: parsed.error.message }, { status: 400 });
      const newQty = Math.max(0, Number(existing.quantity) + parsed.data.adjustment);
      const updated = await prisma.adminStockItem.update({ where: { id }, data: { quantity: newQty } });
      return NextResponse.json({ success: true, data: updated, error: null });
    }

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ success: false, data: null, error: parsed.error.message }, { status: 400 });

    const updated = await prisma.adminStockItem.update({ where: { id }, data: parsed.data });
    return NextResponse.json({ success: true, data: updated, error: null });
  } catch (err) {
    return NextResponse.json({ success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, data: null, error: "Missing id" }, { status: 400 });

    const existing = await prisma.adminStockItem.findFirst({ where: { id, organizationId: guard.tenantId } });
    if (!existing) return NextResponse.json({ success: false, data: null, error: "Not found" }, { status: 404 });

    await prisma.adminStockItem.delete({ where: { id } });
    return NextResponse.json({ success: true, data: null, error: null });
  } catch (err) {
    return NextResponse.json({ success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" }, { status: 500 });
  }
}
