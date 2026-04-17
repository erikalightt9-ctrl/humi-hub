import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-guards";
import { getAssetById, updateAsset } from "@/lib/repositories/it-asset.repository";

const updateSchema = z.object({
  assetName:     z.string().min(1).max(200).optional(),
  categoryId:    z.string().nullable().optional(),
  brand:         z.string().max(100).nullable().optional(),
  model:         z.string().max(100).nullable().optional(),
  serialNumber:  z.string().max(100).nullable().optional(),
  specs:         z.record(z.string(), z.unknown()).nullable().optional(),
  purchaseDate:  z.string().nullable().optional(),
  purchaseCost:  z.number().nonnegative().nullable().optional(),
  supplier:      z.string().max(200).nullable().optional(),
  warrantyStart: z.string().nullable().optional(),
  warrantyEnd:   z.string().nullable().optional(),
  status:        z.enum(["AVAILABLE", "ASSIGNED", "IN_REPAIR", "FOR_DISPOSAL", "RETIRED"]).optional(),
  condition:     z.enum(["NEW", "GOOD", "FAIR", "POOR"]).optional(),
  location:      z.string().max(200).nullable().optional(),
  notes:         z.string().nullable().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const { id } = await params;
    const asset = await getAssetById(guard.tenantId, id);
    if (!asset) return NextResponse.json({ success: false, data: null, error: "Asset not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: asset, error: null });
  } catch (err) {
    console.error("[GET /api/admin/it/assets/[id]]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const { id }  = await params;
    const body    = await request.json();
    const parsed  = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, data: null, error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 422 });
    }

    const d = parsed.data;
    const updated = await updateAsset(guard.tenantId, id, {
      ...d,
      purchaseDate:  d.purchaseDate  !== undefined ? (d.purchaseDate  ? new Date(d.purchaseDate)  : undefined) : undefined,
      warrantyStart: d.warrantyStart !== undefined ? (d.warrantyStart ? new Date(d.warrantyStart) : undefined) : undefined,
      warrantyEnd:   d.warrantyEnd   !== undefined ? (d.warrantyEnd   ? new Date(d.warrantyEnd)   : undefined) : undefined,
    });

    if (!updated) return NextResponse.json({ success: false, data: null, error: "Asset not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: updated, error: null });
  } catch (err) {
    console.error("[PATCH /api/admin/it/assets/[id]]", err);
    return NextResponse.json({ success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" }, { status: 500 });
  }
}
