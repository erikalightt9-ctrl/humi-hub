import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const [categories, items, recent] = await Promise.all([
      prisma.inventoryCategory.findMany({
        where: { organizationId: guard.tenantId },
        include: { _count: { select: { items: true } } },
        orderBy: { name: "asc" },
      }),
      prisma.inventoryItem.findMany({
        where: { organizationId: guard.tenantId },
        include: { category: { select: { id: true, name: true, icon: true } } },
      }),
      prisma.stockMovement.findMany({
        where: { organizationId: guard.tenantId },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { item: { select: { id: true, name: true, unit: true } } },
      }),
    ]);

    const totalItems   = items.length;
    const outOfStock   = items.filter((i) => Number(i.totalStock) === 0).length;
    const lowStock     = items.filter((i) => {
      const q = Number(i.totalStock);
      const m = Number(i.minThreshold);
      return q > 0 && m > 0 && q <= m;
    });
    const lowStockCount = lowStock.length;

    const categorySummary = categories.map((c) => {
      const catItems = items.filter((i) => i.categoryId === c.id);
      const low = catItems.filter((i) => {
        const q = Number(i.totalStock);
        const m = Number(i.minThreshold);
        return q > 0 && m > 0 && q <= m;
      }).length;
      const out = catItems.filter((i) => Number(i.totalStock) === 0).length;
      return {
        id: c.id,
        name: c.name,
        icon: c.icon,
        itemCount: c._count.items,
        lowStock: low,
        outOfStock: out,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        totals: {
          categories: categories.length,
          items: totalItems,
          lowStock: lowStockCount,
          outOfStock,
        },
        lowStockItems: lowStock.slice(0, 8).map((i) => ({
          id: i.id,
          name: i.name,
          unit: i.unit,
          totalStock: Number(i.totalStock),
          minThreshold: Number(i.minThreshold),
          category: i.category,
        })),
        categories: categorySummary,
        recentActivity: recent.map((m) => ({
          id: m.id,
          type: m.type,
          quantity: Number(m.quantity),
          note: m.note,
          createdAt: m.createdAt,
          item: m.item,
        })),
      },
      error: null,
    });
  } catch (err) {
    return NextResponse.json({ success: false, data: null, error: err instanceof Error ? err.message : "Server error" }, { status: 500 });
  }
}
