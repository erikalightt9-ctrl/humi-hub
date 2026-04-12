/**
 * GET  /api/admin/hr/settings  — fetch company name + logo
 * PATCH /api/admin/hr/settings — update company name and/or logo
 */
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  companyName:          z.string().min(1).max(200).optional(),
  logoUrl:              z.string().max(2_000_000).optional(),
  officeAddress:        z.string().max(300).nullable().optional(),
  officeLatitude:       z.number().min(-90).max(90).nullable().optional(),
  officeLongitude:      z.number().min(-180).max(180).nullable().optional(),
  geofenceRadiusMeters: z.number().int().min(10).max(50000).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const org = await prisma.organization.findUnique({
      where:  { id: guard.tenantId },
      select: { name: true, logoUrl: true, officeAddress: true, officeLatitude: true, officeLongitude: true, geofenceRadiusMeters: true },
    });

    return NextResponse.json({ success: true, data: org, error: null });
  } catch (err) {
    console.error("[GET /api/admin/hr/settings]", err);
    return NextResponse.json(
      { success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const body   = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, data: null, error: parsed.error.message }, { status: 400 });
    }

    const d = parsed.data;
    const updated = await prisma.organization.update({
      where: { id: guard.tenantId },
      data:  {
        ...(d.companyName          !== undefined && { name:                 d.companyName }),
        ...(d.logoUrl              !== undefined && { logoUrl:              d.logoUrl }),
        ...(d.officeAddress        !== undefined && { officeAddress:        d.officeAddress }),
        ...(d.officeLatitude       !== undefined && { officeLatitude:       d.officeLatitude }),
        ...(d.officeLongitude      !== undefined && { officeLongitude:      d.officeLongitude }),
        ...(d.geofenceRadiusMeters !== undefined && { geofenceRadiusMeters: d.geofenceRadiusMeters }),
      },
      select: { name: true, logoUrl: true, officeAddress: true, officeLatitude: true, officeLongitude: true, geofenceRadiusMeters: true },
    });

    return NextResponse.json({ success: true, data: updated, error: null });
  } catch (err) {
    console.error("[PATCH /api/admin/hr/settings]", err);
    return NextResponse.json(
      { success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
