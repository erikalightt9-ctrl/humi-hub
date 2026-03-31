import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import {
  getHumiAdminById,
  updateHumiAdmin,
  deactivateHumiAdmin,
  resetHumiAdminPassword,
  resetHumiAdminFailedAttempts,
} from "@/lib/repositories/humi-admin.repository";

async function requireSuperAdmin(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.isSuperAdmin) {
    return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireSuperAdmin(request);
  if (denied) return denied;

  const { id } = await params;
  const admin = await getHumiAdminById(id);
  if (!admin) {
    return NextResponse.json({ success: false, data: null, error: "HUMI Admin not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: admin, error: null });
}

const updateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  isActive: z.boolean().optional(),
  mustChangePassword: z.boolean().optional(),
  canReviewTenants: z.boolean().optional(),
  canOnboardTenants: z.boolean().optional(),
  canMonitorPlatform: z.boolean().optional(),
  canProvideSupport: z.boolean().optional(),
  canManageContent: z.boolean().optional(),
  resetPassword: z.string().min(8).optional(),
  resetFailedAttempts: z.boolean().optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireSuperAdmin(request);
  if (denied) return denied;

  const { id } = await params;
  const existing = await getHumiAdminById(id);
  if (!existing) {
    return NextResponse.json({ success: false, data: null, error: "HUMI Admin not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const result = updateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ success: false, data: null, error: result.error.issues[0].message }, { status: 400 });
    }

    const { resetPassword, resetFailedAttempts: doReset, ...updateData } = result.data;

    if (resetPassword) {
      await resetHumiAdminPassword(id, resetPassword);
    }
    if (doReset) {
      await resetHumiAdminFailedAttempts(id);
    }
    const updated = await updateHumiAdmin(id, updateData);

    return NextResponse.json({ success: true, data: updated, error: null });
  } catch (err) {
    console.error("[superadmin][humi-admins PATCH]", err);
    return NextResponse.json({ success: false, data: null, error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireSuperAdmin(request);
  if (denied) return denied;

  const { id } = await params;
  const existing = await getHumiAdminById(id);
  if (!existing) {
    return NextResponse.json({ success: false, data: null, error: "HUMI Admin not found" }, { status: 404 });
  }

  await deactivateHumiAdmin(id);
  return NextResponse.json({ success: true, data: { message: "HUMI Admin deactivated" }, error: null });
}
