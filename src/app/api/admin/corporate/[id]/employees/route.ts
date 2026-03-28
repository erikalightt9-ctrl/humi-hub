import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { sendCorporateCredentialsEmail } from "@/lib/email/send-corporate-credentials";

export const dynamic = "force-dynamic";

const addEmployeeSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  department: z.string().max(100).optional(),
  phone: z.string().max(30).optional(),
});

const editEmployeeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  department: z.string().max(100).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  isActive: z.boolean().optional(),
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
      select: { id: true, name: true, maxSeats: true, _count: { select: { managers: true } } },
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

    await prisma.auditLog.create({
      data: {
        tenantId: id,
        actorId: token!.id as string,
        actorRole: "ADMIN",
        action: "EMPLOYEE_CREATE",
        entity: "CorporateManager",
        entityId: employee.id,
        meta: {
          name: employee.name,
          email: employee.email,
          department: employee.department ?? null,
          phone: employee.phone ?? null,
          organizationId: id,
          createdAt: employee.createdAt.toISOString(),
        },
      },
    });

    // Fire-and-forget welcome email — do not block the response
    sendCorporateCredentialsEmail({
      name: employee.name,
      email: employee.email,
      organizationName: org.name,
      temporaryPassword: "ChangeMe@123!",
      role: "employee",
    }).catch((mailErr) =>
      console.error("[POST /api/admin/corporate/:id/employees] email failed", mailErr)
    );

    return NextResponse.json({ success: true, data: employee, error: null }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/corporate/:id/employees]", err);
    return NextResponse.json({ success: false, data: null, error: "Failed to add employee" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  PUT — Edit an employee by employeeId query param                  */
/* ------------------------------------------------------------------ */
export async function PUT(
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
    if (!employeeId) return NextResponse.json({ success: false, data: null, error: "employeeId required" }, { status: 400 });

    const existing = await prisma.corporateManager.findFirst({
      where: { id: employeeId, organizationId: id, role: "employee" },
    });
    if (!existing) return NextResponse.json({ success: false, data: null, error: "Employee not found" }, { status: 404 });

    const body = await req.json();
    const result = editEmployeeSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ success: false, data: null, error: result.error.issues[0]?.message ?? "Invalid input" }, { status: 422 });

    // Check email uniqueness if changing email
    if (result.data.email && result.data.email !== existing.email) {
      const emailExists = await prisma.corporateManager.findUnique({
        where: { organizationId_email: { organizationId: id, email: result.data.email.toLowerCase() } },
      });
      if (emailExists) return NextResponse.json({ success: false, data: null, error: "Email already in use" }, { status: 422 });
    }

    const updated = await prisma.corporateManager.update({
      where: { id: employeeId },
      data: {
        ...(result.data.name !== undefined ? { name: result.data.name } : {}),
        ...(result.data.email !== undefined ? { email: result.data.email.toLowerCase() } : {}),
        ...(result.data.department !== undefined ? { department: result.data.department } : {}),
        ...(result.data.phone !== undefined ? { phone: result.data.phone } : {}),
        ...(result.data.isActive !== undefined ? { isActive: result.data.isActive } : {}),
      },
    });

    await prisma.auditLog.create({
      data: {
        tenantId: id,
        actorId: token!.id as string,
        actorRole: "ADMIN",
        action: "EMPLOYEE_UPDATE",
        entity: "CorporateManager",
        entityId: employeeId,
        meta: { before: existing, after: updated, organizationId: id },
      },
    });

    return NextResponse.json({ success: true, data: updated, error: null });
  } catch (err) {
    console.error("[PUT /api/admin/corporate/:id/employees]", err);
    return NextResponse.json({ success: false, data: null, error: "Failed to update employee" }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  DELETE — Soft delete an employee (set isActive = false)           */
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

    const softDeleted = await prisma.corporateManager.update({
      where: { id: employeeId },
      data: { isActive: false },
    });

    await prisma.auditLog.create({
      data: {
        tenantId: id,
        actorId: token!.id as string,
        actorRole: "ADMIN",
        action: "EMPLOYEE_DEACTIVATE",
        entity: "CorporateManager",
        entityId: employeeId,
        meta: { name: softDeleted.name, email: softDeleted.email, organizationId: id },
      },
    });

    return NextResponse.json({ success: true, data: { deactivated: true }, error: null });
  } catch (err) {
    console.error("[DELETE /api/admin/corporate/:id/employees]", err);
    return NextResponse.json({ success: false, data: null, error: "Failed to deactivate employee" }, { status: 500 });
  }
}
