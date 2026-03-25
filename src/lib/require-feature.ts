import { NextResponse } from "next/server";
import { isFeatureEnabled, type FeatureKey } from "@/lib/feature-flags";

export type FeatureCheckResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly response: NextResponse };

/**
 * Check if a feature is enabled for a tenant.
 * Returns { ok: false, response: 403 } when the tenant's plan doesn't include the feature.
 *
 * @example
 * const check = await requireFeature(guard.tenantId, "ai_simulations");
 * if (!check.ok) return check.response;
 */
export async function requireFeature(
  tenantId: string | null,
  feature: FeatureKey,
): Promise<FeatureCheckResult> {
  const enabled = await isFeatureEnabled(tenantId, feature);
  if (!enabled) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, data: null, error: "This feature is not available on your current plan" },
        { status: 403 },
      ),
    };
  }
  return { ok: true };
}
