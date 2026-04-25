import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createId } from "@paralleldrive/cuid2";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

const DEFAULTS = [
  { name: "Pantry Supplies",      icon: "🍱", description: "Food, beverages, and kitchen essentials" },
  { name: "Maintenance Supplies", icon: "🔧", description: "Tools, parts, and maintenance materials" },
  { name: "Assets",               icon: "📦", description: "Appliances, equipment, furniture & fixtures" },
  { name: "Stockroom Stocks",     icon: "🏪", description: "General stockroom inventory" },
  { name: "Office Supplies",      icon: "🛒", description: "Office consumables and stationery" },
  { name: "Medicine",             icon: "💊", description: "First aid and medical supplies" },
  { name: "Cleaning Supplies",    icon: "🧹", description: "Janitorial and cleaning materials" },
];

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const existing = await prisma.inventoryCategory.findMany({
      where: { organizationId: guard.tenantId },
      select: { name: true },
    });
    const existingNames = new Set(existing.map((c) => c.name));

    const toCreate = DEFAULTS.filter((d) => !existingNames.has(d.name));

    if (toCreate.length > 0) {
      await prisma.inventoryCategory.createMany({
        data: toCreate.map((d) => ({
          id: createId(),
          organizationId: guard.tenantId,
          name: d.name,
          icon: d.icon,
          description: d.description,
        })),
      });
    }

    return NextResponse.json({ success: true, data: { created: toCreate.length }, error: null });
  } catch (err) {
    return NextResponse.json(
      { success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
