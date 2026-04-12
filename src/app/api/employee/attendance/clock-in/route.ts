import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  latitude:     z.number().min(-90).max(90),
  longitude:    z.number().min(-180).max(180),
  photoDataUrl: z.string().min(1),
});

function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R  = 6371000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a  = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token?.id || token.role !== "employee" || !token.organizationId) {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, data: null, error: "Invalid request data" }, { status: 400 });
    }

    const { latitude, longitude, photoDataUrl } = parsed.data;
    const employeeId   = token.id as string;
    const orgId        = token.organizationId as string;

    // Geofence validation
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { officeLatitude: true, officeLongitude: true, geofenceRadiusMeters: true },
    });

    if (org?.officeLatitude != null && org?.officeLongitude != null) {
      const dist = distanceMeters(latitude, longitude, org.officeLatitude, org.officeLongitude);
      if (dist > org.geofenceRadiusMeters) {
        return NextResponse.json(
          { success: false, data: null, error: `You are ${Math.round(dist)}m from the office, outside the ${org.geofenceRadiusMeters}m geofence.` },
          { status: 422 }
        );
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.hrAttendanceLog.findUnique({
      where: { employeeId_date: { employeeId, date: today } },
    });
    if (existing?.clockIn) {
      return NextResponse.json({ success: false, data: null, error: "Already clocked in today" }, { status: 422 });
    }

    const now           = new Date();
    const lateThreshold = new Date(today);
    lateThreshold.setHours(8, 30, 0, 0);
    const status = now > lateThreshold ? "LATE" : "PRESENT";

    const log = await prisma.hrAttendanceLog.upsert({
      where: { employeeId_date: { employeeId, date: today } },
      update: {
        clockIn: now,
        status: status as never,
        clockInLatitude:  latitude,
        clockInLongitude: longitude,
        clockInPhotoUrl:  photoDataUrl,
      },
      create: {
        employeeId,
        date:             today,
        clockIn:          now,
        status:           status as never,
        clockInLatitude:  latitude,
        clockInLongitude: longitude,
        clockInPhotoUrl:  photoDataUrl,
      },
    });

    return NextResponse.json({ success: true, data: log, error: null }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/employee/attendance/clock-in]", err);
    return NextResponse.json({ success: false, data: null, error: "Internal server error" }, { status: 500 });
  }
}
