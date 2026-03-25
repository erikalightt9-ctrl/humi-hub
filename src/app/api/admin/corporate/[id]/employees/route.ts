import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { z } from "zod";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

const addEmployeeSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  department: z.string().max(100).optional(),
  phone: z.string().max(30).optional(),
});

/* ------------------------------------------------------------------ */
/*  POST — Add a single employee manually                             */
/* ------------------------------------------------------------------ */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const guard = requireAdmin(token);
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;

    const org = await prisma.organization.findUnique({
      where: { id },
      select: { id: true, maxSeats: true, _count: { select: { managers: true } } },
    });
    if (!org) {
      return NextResponse.json({ success: false, data: null, error: "Organization not found" }, { status: 404 });
    }

    // Seat limit check
    if (org._count.managers >= org.maxSeats) {
      return NextResponse.json(
        { success: false, data: null, error: `Seat limit reached (${org.maxSeats} seats)` },
        { status: 422 }
      );
    }

    const body = await req.json();
    const result = addEmployeeSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, data: null, error: result.error.issues[0]?.message ?? "Invalid input" },
        { status: 422 }
      );
    }

    const { name, email, department, phone } = result.data;
    const normalizedEmail = email.trim().toLowerCase();

    // Check duplicate
    const exists = await prisma.corporateManager.findFirst({
      where: { organizationId: id, email: normalizedEmail },
    });
    if (exists) {
      return NextResponse.json(
        { success: false, data: null, error: "An employee with this email already exists" },
        { status: 422 }
      );
    }

    const tempPasswordHash = await bcrypt.hash("ChangeMe@123!", 10);

    const employee = await prisma.corporateManager.create({
      data: {
        organizationId: id,
        name: name.trim(),
        email: normalizedEmail,
        passwordHash: tempPasswordHash,
        role: "employee",
        mustChangePassword: true,
        ...(department ? { department } : {}),
        ...(phone ? { phone } : {}),
      },
    });

    return NextResponse.json({ success: true, data: employee, error: null }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/corporate/:id/employees]", err);
    return NextResponse.json({ success: false, data: null, error: "Failed to add employee" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  DELETE — Remove an employee by employeeId query param             */
/* ------------------------------------------------------------------ */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const guard = requireAdmin(token);
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");

    if (!employeeId) {
      return NextResponse.json({ success: false, data: null, error: "employeeId required" }, { status: 400 });
    }

    const employee = await prisma.corporateManager.findFirst({
      where: { id: employeeId, organizationId: id },
    });
    if (!employee) {
      return NextResponse.json({ success: false, data: null, error: "Employee not found" }, { status: 404 });
    }

    await prisma.corporateManager.delete({ where: { id: employeeId } });

    return NextResponse.json({ success: true, data: { deleted: true }, error: null });
  } catch (err) {
    console.error("[DELETE /api/admin/corporate/:id/employees]", err);
    return NextResponse.json({ success: false, data: null, error: "Failed to remove employee" }, { status: 500 });
  }
}
