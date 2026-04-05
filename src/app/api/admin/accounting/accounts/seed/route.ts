import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAccountingWrite } from "@/lib/auth-guards";
import { seedDefaultAccounts } from "@/lib/repositories/acc-account.repository";

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAccountingWrite(token);
    if (!guard.ok) return guard.response;
    const { tenantId } = guard;

    const result = await seedDefaultAccounts(tenantId);
    return NextResponse.json({ success: true, data: result, error: null }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/accounting/accounts/seed]", err);
    return NextResponse.json(
      { success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
