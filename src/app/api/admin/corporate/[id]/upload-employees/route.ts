import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";
import bcrypt from "bcryptjs";
import { sendCorporateCredentialsEmail } from "@/lib/email/send-corporate-credentials";

export const dynamic = "force-dynamic";

interface EmployeeRow {
  name: string;
  email: string;
}

// POST /api/admin/corporate/:id/upload-employees
// Body: { employees: [{ name, email }] }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const guard = requireAdmin(token);
  if (!guard.ok) return guard.response;

  try {
    const { id } = await params;
    const body = await req.json();
    const employees: EmployeeRow[] = body.employees;

    if (!Array.isArray(employees) || employees.length === 0) {
      return NextResponse.json({ success: false, data: null, error: "No employee rows provided" }, { status: 400 });
    }

    if (employees.length > 500) {
      return NextResponse.json({ success: false, data: null, error: "Maximum 500 employees per upload" }, { status: 400 });
    }

    const org = await prisma.organization.findUnique({ where: { id }, select: { id: true, name: true } });
    if (!org) {
      return NextResponse.json({ success: false, data: null, error: "Organization not found" }, { status: 404 });
    }

    // Get existing manager emails to skip duplicates
    const existing = await prisma.corporateManager.findMany({
      where: { organizationId: id },
      select: { email: true },
    });
    const existingEmails = new Set(existing.map((m) => m.email.toLowerCase()));

    const tempPasswordHash = await bcrypt.hash("ChangeMe@123!", 10);

    const toCreate: EmployeeRow[] = [];
    const skipped: string[] = [];

    for (const row of employees) {
      const email = row.email?.trim().toLowerCase();
      const name = row.name?.trim();
      if (!email || !name) continue;
      if (existingEmails.has(email)) {
        skipped.push(email);
      } else {
        toCreate.push({ name, email });
        existingEmails.add(email); // prevent duplicates within the batch
      }
    }

    if (toCreate.length > 0) {
      await prisma.corporateManager.createMany({
        data: toCreate.map((row) => ({
          organizationId: id,
          name: row.name,
          email: row.email,
          passwordHash: tempPasswordHash,
          role: "employee",
          mustChangePassword: true,
        })),
        skipDuplicates: true,
      });
    }

    // Fire-and-forget welcome emails for all newly created employees
    if (toCreate.length > 0) {
      Promise.allSettled(
        toCreate.map((row) =>
          sendCorporateCredentialsEmail({
            name: row.name,
            email: row.email,
            organizationName: org.name,
            temporaryPassword: "ChangeMe@123!",
            role: "employee",
          })
        )
      ).catch((mailErr) =>
        console.error("[POST /api/admin/corporate/:id/upload-employees] email batch failed", mailErr)
      );
    }

    return NextResponse.json({
      success: true,
      data: { created: toCreate.length, skipped: skipped.length },
      error: null,
    });
  } catch (err) {
    console.error("[POST /api/admin/corporate/:id/upload-employees]", err);
    return NextResponse.json({ success: false, data: null, error: "Failed to upload employees" }, { status: 500 });
  }
}
