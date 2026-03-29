import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const tenant = await prisma.organization.findFirst({
    where: {
      OR: [
        { slug },
        { subdomain: slug },
      ],
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      subdomain: true,
      logoUrl: true,
      siteName: true,
      primaryColor: true,
      tagline: true,
    },
  });

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: tenant });
}
