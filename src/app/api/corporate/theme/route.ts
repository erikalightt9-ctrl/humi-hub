import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getTheme, upsertTheme } from "@/lib/services/tenant-theme.service";
import { updateThemeSchema } from "@/lib/validators/page-builder";

/* ------------------------------------------------------------------ */
/*  GET — get theme for org                                           */
/*  PUT — create or update theme                                      */
/* ------------------------------------------------------------------ */

async function requireCorporateAuth(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.id) return { error: "Unauthorized", status: 401, organizationId: null };

  const role = token.role as string;
  if (role !== "corporate" && role !== "tenant_admin") {
    return { error: "Forbidden", status: 403, organizationId: null };
  }

  const organizationId = (token as { organizationId?: string | null }).organizationId;
  if (!organizationId) return { error: "No organization associated with this account", status: 403, organizationId: null };

  return { error: null, status: 200, organizationId };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireCorporateAuth(request);
    if (auth.error) {
      return NextResponse.json({ success: false, data: null, error: auth.error }, { status: auth.status });
    }

    const theme = await getTheme(auth.organizationId!);
    return NextResponse.json({ success: true, data: theme, error: null });
  } catch (err) {
    console.error("[GET /api/corporate/theme]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireCorporateAuth(request);
    if (auth.error) {
      return NextResponse.json({ success: false, data: null, error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const parsed = updateThemeSchema.safeParse(body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message ?? "Invalid input";
      return NextResponse.json({ success: false, data: null, error: firstIssue }, { status: 400 });
    }

    const theme = await upsertTheme(auth.organizationId!, parsed.data);
    return NextResponse.json({ success: true, data: theme, error: null });
  } catch (err) {
    console.error("[PUT /api/corporate/theme]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}
