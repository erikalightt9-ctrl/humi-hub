import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { createId } from "@paralleldrive/cuid2";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  plateNumber:   z.string().min(1).max(50),
  vehicleType:   z.string().min(1).max(100),
  logType:       z.enum(["FUEL", "MAINTENANCE"]),
  logDate:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  description:   z.string().optional(),
  liters:        z.number().min(0).optional(),
  pricePerLiter: z.number().min(0).optional(),
  totalAmount:   z.number().min(0).optional(),
  status:        z.string().max(20).default("PENDING"),
  performedBy:   z.string().max(150).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const url     = new URL(request.url);
    const logType = url.searchParams.get("logType") ?? undefined;

    const data = await prisma.adminVehicleLog.findMany({
      where: { organizationId: guard.tenantId, ...(logType ? { logType } : {}) },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, data, error: null });
  } catch (err) {
    return NextResponse.json({ success: false, data: null, error: err instanceof Error ? err.message : "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ success: false, data: null, error: parsed.error.message }, { status: 400 });

    const { logDate, ...rest } = parsed.data;
    const record = await prisma.adminVehicleLog.create({
      data: { id: createId(), organizationId: guard.tenantId, ...rest, logDate: logDate ? new Date(logDate) : null },
    });
    return NextResponse.json({ success: true, data: record, error: null }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, data: null, error: "Missing id" }, { status: 400 });

    const existing = await prisma.adminVehicleLog.findFirst({ where: { id, organizationId: guard.tenantId } });
    if (!existing) return NextResponse.json({ success: false, data: null, error: "Not found" }, { status: 404 });

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ success: false, data: null, error: parsed.error.message }, { status: 400 });

    const editorName = (token as { name?: string; email?: string })?.name || (token as { name?: string; email?: string })?.email || "Admin";
    const { logDate, ...rest } = parsed.data;
    const updated = await prisma.adminVehicleLog.update({
      where: { id },
      data: { ...rest, logDate: logDate ? new Date(logDate) : null, lastEditedBy: editorName, lastEditedAt: new Date() },
    });
    return NextResponse.json({ success: true, data: updated, error: null });
  } catch (err) {
    return NextResponse.json({ success: false, data: null, error: err instanceof Error ? err.message : "Server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, data: null, error: "Missing id" }, { status: 400 });

    const existing = await prisma.adminVehicleLog.findFirst({ where: { id, organizationId: guard.tenantId } });
    if (!existing) return NextResponse.json({ success: false, data: null, error: "Not found" }, { status: 404 });

    await prisma.adminVehicleLog.delete({ where: { id } });
    return NextResponse.json({ success: true, data: null, error: null });
  } catch (err) {
    return NextResponse.json({ success: false, data: null, error: err instanceof Error ? err.message : "Server error" }, { status: 500 });
  }
}
