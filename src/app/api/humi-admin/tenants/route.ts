import { NextRequest, NextResponse } from "next/server";
import { requireHumiAdmin } from "@/lib/guards/humi-admin-permission";
import { getPendingTenantApplications, getActiveTenants } from "@/lib/repositories/humi-admin.repository";

export async function GET(request: NextRequest) {
  const guard = await requireHumiAdmin(request, "canReviewTenants");
  if (!guard.authorized) return guard.response;

  try {
    const [pending, active] = await Promise.all([
      getPendingTenantApplications(),
      getActiveTenants(),
    ]);
    return NextResponse.json({ success: true, data: { pending, active }, error: null });
  } catch (err) {
    console.error("[humi-admin][tenants]", err);
    return NextResponse.json({ success: false, data: null, error: "Failed to load tenants" }, { status: 500 });
  }
}
