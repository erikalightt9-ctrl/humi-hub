import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { reorderSections } from "@/lib/services/tenant-page.service";
import { reorderSectionsSchema } from "@/lib/validators/page-builder";

/* ------------------------------------------------------------------ */
/*  POST — replace sections array (reorder / full update)             */
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireCorporateAuth(request);
    if (auth.error) {
      return NextResponse.json({ success: false, data: null, error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = reorderSectionsSchema.safeParse(body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message ?? "Invalid input";
      return NextResponse.json({ success: false, data: null, error: firstIssue }, { status: 400 });
    }

    const page = await reorderSections(auth.organizationId!, id, parsed.data.sections as object[]);
    if (!page) {
      return NextResponse.json({ success: false, data: null, error: "Page not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: page, error: null });
  } catch (err) {
    console.error("[POST /api/corporate/pages/[id]/sections]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}
