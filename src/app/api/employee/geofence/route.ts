import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token?.id || token.role !== "employee" || !token.organizationId) {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }

    const org = await prisma.organization.findUnique({
      where: { id: token.organizationId as string },
      select: {
        officeAddress: true,
        officeLatitude: true,
        officeLongitude: true,
        geofenceRadiusMeters: true,
      },
    });

    return NextResponse.json({ success: true, data: org, error: null });
  } catch {
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}
