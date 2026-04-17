import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-guards";
import { listAssets, createAsset, getAssetStats } from "@/lib/repositories/it-asset.repository";
import type { ItAssetStatus } from "@prisma/client";

const createSchema = z.object({
  assetName:     z.string().min(1).max(200),
  categoryId:    z.string().optional(),
  brand:         z.string().max(100).optional(),
  model:         z.string().max(100).optional(),
  serialNumber:  z.string().max(100).optional(),
  specs:         z.record(z.string(), z.unknown()).optional(),
  purchaseDate:  z.string().optional(),
  purchaseCost:  z.number().nonnegative().optional(),
  supplier:      z.string().max(200).optional(),
  warrantyStart: z.string().optional(),
  warrantyEnd:   z.string().optional(),
  condition:     z.enum(["NEW", "GOOD", "FAIR", "POOR"]).optional(),
  location:      z.string().max(200).optional(),
  notes:         z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const { searchParams } = new URL(request.url);

    if (searchParams.get("stats") === "1") {
      const stats = await getAssetStats(guard.tenantId);
      return NextResponse.json({ success: true, data: stats, error: null });
    }

    const result = await listAssets(guard.tenantId, {
      status:   (searchParams.get("status") as ItAssetStatus) || undefined,
      category: searchParams.get("category") || undefined,
      location: searchParams.get("location") || undefined,
      search:   searchParams.get("search") || undefined,
      limit:    Number(searchParams.get("limit"))  || 50,
      offset:   Number(searchParams.get("offset")) || 0,
    });

    return NextResponse.json({ success: true, data: result, error: null });
  } catch (err) {
    console.error("[GET /api/admin/it/assets]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const body   = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, data: null, error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 422 });
    }

    const d = parsed.data;
    const asset = await createAsset(guard.tenantId, {
      ...d,
      purchaseDate:  d.purchaseDate  ? new Date(d.purchaseDate) : undefined,
      warrantyStart: d.warrantyStart ? new Date(d.warrantyStart) : undefined,
      warrantyEnd:   d.warrantyEnd   ? new Date(d.warrantyEnd) : undefined,
    });

    return NextResponse.json({ success: true, data: asset, error: null }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/it/assets]", err);
    return NextResponse.json({ success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" }, { status: 500 });
  }
}
