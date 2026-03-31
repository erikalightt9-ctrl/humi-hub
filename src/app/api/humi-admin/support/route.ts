import { NextRequest, NextResponse } from "next/server";
import { requireHumiAdmin } from "@/lib/guards/humi-admin-permission";
import { getOpenSupportTickets } from "@/lib/repositories/humi-admin.repository";

export async function GET(request: NextRequest) {
  const guard = await requireHumiAdmin(request, "canProvideSupport");
  if (!guard.authorized) return guard.response;

  try {
    const tickets = await getOpenSupportTickets();
    return NextResponse.json({ success: true, data: tickets, error: null });
  } catch (err) {
    console.error("[humi-admin][support]", err);
    return NextResponse.json({ success: false, data: null, error: "Failed to load tickets" }, { status: 500 });
  }
}
