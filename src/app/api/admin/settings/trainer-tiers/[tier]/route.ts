import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { upsertTierConfig } from "@/lib/repositories/trainer-tier.repository";
import { trainerTierConfigSchema } from "@/lib/validations/trainer-tier.schema";
import type { TrainerTier } from "@prisma/client";

const VALID_TIERS: TrainerTier[] = ["BASIC", "PROFESSIONAL", "PREMIUM"];

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ tier: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.id) {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }

    const { tier: tierParam } = await params;
    const tier = tierParam.toUpperCase() as TrainerTier;
    if (!VALID_TIERS.includes(tier)) {
      return NextResponse.json({ success: false, data: null, error: "Invalid tier" }, { status: 400 });
    }

    const body = await request.json();
    const result = trainerTierConfigSchema.safeParse(body);
    if (!result.success) {
      const firstError = result.error.issues[0]?.message ?? "Validation failed";
      return NextResponse.json({ success: false, data: null, error: firstError }, { status: 422 });
    }

    const config = await upsertTierConfig(tier, result.data);
    return NextResponse.json({ success: true, data: config, error: null });
  } catch (err) {
    console.error("[PUT /api/admin/settings/trainer-tiers/[tier]]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}
