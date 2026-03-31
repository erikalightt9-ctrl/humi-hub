import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** GET /api/t/[tenant_id] — public tenant lookup by ID or subdomain */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ tenant_id: string }> },
) {
  const { tenant_id } = await params;

  if (!tenant_id || tenant_id.length < 3) {
    return NextResponse.json(
      { success: false, data: null, error: "Invalid tenant identifier." },
      { status: 400 },
    );
  }

  // Look up by ID (cuid) first, fallback to subdomain slug
  const tenant = await prisma.organization.findFirst({
    where: {
      OR: [{ id: tenant_id }, { subdomain: tenant_id.toLowerCase() }],
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      siteName: true,
      subdomain: true,
      logoUrl: true,
      primaryColor: true,
      secondaryColor: true,
      tagline: true,
      isActive: true,
    },
  });

  if (!tenant) {
    return NextResponse.json(
      { success: false, data: null, error: "Training platform not found." },
      { status: 404 },
    );
  }

  return NextResponse.json({ success: true, data: tenant, error: null });
}
