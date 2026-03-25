import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createManagerSchema } from "@/lib/validations/corporate.schema";

/* ------------------------------------------------------------------ */
/*  POST — Create a corporate manager for an organization              */
/* ------------------------------------------------------------------ */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireAdmin(token);
    if (!guard.ok) return guard.response;

    const { id: orgId } = await params;

    // Verify org exists
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true, isActive: true },
    });

    if (!org) {
      return NextResponse.json(
        { success: false, data: null, error: "Organization not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const parsed = createManagerSchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message ?? "Invalid input";
      return NextResponse.json(
        { success: false, data: null, error: firstIssue },
        { status: 400 },
      );
    }

    // Check for duplicate email
    const existingManager = await prisma.corporateManager.findUnique({
      where: { organizationId_email: { organizationId: orgId, email: parsed.data.email.toLowerCase() } },
    });

    if (existingManager) {
      return NextResponse.json(
        { success: false, data: null, error: "A manager with this email already exists" },
        { status: 400 },
      );
    }

    // Generate temporary password
    const tempPassword = `Corp@${Date.now().toString(36).slice(-6)}`;
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const manager = await prisma.corporateManager.create({
      data: {
        organizationId: orgId,
        name: parsed.data.name,
        email: parsed.data.email.toLowerCase(),
        passwordHash,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: manager.id,
          name: manager.name,
          email: manager.email,
          tempPassword,
        },
        error: null,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/admin/organizations/[id]/managers]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
