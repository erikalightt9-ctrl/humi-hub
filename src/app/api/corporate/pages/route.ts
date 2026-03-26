import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { createPage, listPages } from "@/lib/services/tenant-page.service";
import { createPageSchema } from "@/lib/validators/page-builder";
import { prisma } from "@/lib/prisma";
import { getPlanPageLimit } from "@/lib/constants/plan-limits";

/* ------------------------------------------------------------------ */
/*  GET — list all pages for the org                                  */
/*  POST — create a new page                                          */
/* ------------------------------------------------------------------ */

function getOrgId(token: ReturnType<typeof getToken> extends Promise<infer T> ? T : never) {
  return (token as { organizationId?: string | null })?.organizationId ?? null;
}

async function requireCorporateAuth(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.id) return { error: "Unauthorized", status: 401, token: null };

  const role = token.role as string;
  if (role !== "corporate" && role !== "tenant_admin") {
    return { error: "Forbidden", status: 403, token: null };
  }

  const organizationId = (token as { organizationId?: string | null }).organizationId;
  if (!organizationId) return { error: "No organization associated with this account", status: 403, token: null };

  return { error: null, status: 200, token, organizationId };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireCorporateAuth(request);
    if (auth.error) {
      return NextResponse.json({ success: false, data: null, error: auth.error }, { status: auth.status });
    }

    const [pages, org] = await Promise.all([
      listPages(auth.organizationId!),
      prisma.organization.findUnique({
        where: { id: auth.organizationId! },
        select: { plan: true },
      }),
    ]);

    const plan = org?.plan ?? "TRIAL";
    const pageLimit = getPlanPageLimit(plan);
    const pageCount = pages.length;

    return NextResponse.json({
      success: true,
      data: pages,
      plan,
      pageLimit: pageLimit === Infinity ? null : pageLimit,
      pageCount,
      error: null,
    });
  } catch (err) {
    console.error("[GET /api/corporate/pages]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireCorporateAuth(request);
    if (auth.error) {
      return NextResponse.json({ success: false, data: null, error: auth.error }, { status: auth.status });
    }

    // Check plan-based page limit before creating
    const [pageCount, org] = await Promise.all([
      prisma.tenantPage.count({ where: { organizationId: auth.organizationId! } }),
      prisma.organization.findUnique({
        where: { id: auth.organizationId! },
        select: { plan: true },
      }),
    ]);

    const plan = org?.plan ?? "TRIAL";
    const limit = getPlanPageLimit(plan);

    if (pageCount >= limit) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: `You've reached the ${limit === Infinity ? "" : limit + " "}page limit on the ${plan} plan. Please upgrade to create more pages.`,
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    const parsed = createPageSchema.safeParse(body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message ?? "Invalid input";
      return NextResponse.json({ success: false, data: null, error: firstIssue }, { status: 400 });
    }

    const page = await createPage(auth.organizationId!, parsed.data);
    return NextResponse.json({ success: true, data: page, error: null }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    const isUserError = msg.includes("Page limit reached") || msg.includes("Unique constraint");
    return NextResponse.json(
      { success: false, data: null, error: isUserError ? msg : "Internal server error" },
      { status: isUserError ? 400 : 500 },
    );
  }
}
