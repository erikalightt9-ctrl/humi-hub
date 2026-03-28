import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getPageById, updatePage, deletePage } from "@/lib/services/tenant-page.service";
import { updatePageSchema } from "@/lib/validators/page-builder";

/* ------------------------------------------------------------------ */
/*  GET    — get single page by id                                    */
/*  PUT    — update page                                              */
/*  DELETE — delete page                                              */
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireCorporateAuth(request);
    if (auth.error) {
      return NextResponse.json({ success: false, data: null, error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const page = await getPageById(auth.organizationId!, id);
    if (!page) {
      return NextResponse.json({ success: false, data: null, error: "Page not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: page, error: null });
  } catch (err) {
    console.error("[GET /api/corporate/pages/[id]]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
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
    const parsed = updatePageSchema.safeParse(body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message ?? "Invalid input";
      return NextResponse.json({ success: false, data: null, error: firstIssue }, { status: 400 });
    }

    const page = await updatePage(auth.organizationId!, id, parsed.data);
    if (!page) {
      return NextResponse.json({ success: false, data: null, error: "Page not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: page, error: null });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    const isUniqueError = msg.includes("Unique constraint");
    return NextResponse.json(
      { success: false, data: null, error: isUniqueError ? "A page with this slug already exists" : "Internal server error" },
      { status: isUniqueError ? 400 : 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireCorporateAuth(request);
    if (auth.error) {
      return NextResponse.json({ success: false, data: null, error: auth.error }, { status: auth.status });
    }

    const { id } = await params;
    const page = await deletePage(auth.organizationId!, id);
    if (!page) {
      return NextResponse.json({ success: false, data: null, error: "Page not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { id: page.id }, error: null });
  } catch (err) {
    console.error("[DELETE /api/corporate/pages/[id]]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}
