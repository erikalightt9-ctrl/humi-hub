import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { getAllHumiAdmins, createHumiAdmin } from "@/lib/repositories/humi-admin.repository";

async function requireSuperAdmin(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.isSuperAdmin) {
    return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET(request: NextRequest) {
  const denied = await requireSuperAdmin(request);
  if (denied) return denied;

  try {
    const admins = await getAllHumiAdmins();
    return NextResponse.json({ success: true, data: admins, error: null });
  } catch (err) {
    console.error("[superadmin][humi-admins GET]", err);
    return NextResponse.json({ success: false, data: null, error: "Failed to load HUMI Admins" }, { status: 500 });
  }
}

const createSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  permissions: z.object({
    canReviewTenants: z.boolean().optional(),
    canOnboardTenants: z.boolean().optional(),
    canMonitorPlatform: z.boolean().optional(),
    canProvideSupport: z.boolean().optional(),
    canManageContent: z.boolean().optional(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  const denied = await requireSuperAdmin(request);
  if (denied) return denied;

  try {
    const body = await request.json();
    const result = createSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({
        success: false,
        data: null,
        error: result.error.issues[0].message,
      }, { status: 400 });
    }

    const admin = await createHumiAdmin(result.data);
    return NextResponse.json({ success: true, data: admin, error: null }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create HUMI Admin";
    if (message.includes("Unique constraint") || message.includes("email")) {
      return NextResponse.json({ success: false, data: null, error: "Email already in use" }, { status: 409 });
    }
    console.error("[superadmin][humi-admins POST]", err);
    return NextResponse.json({ success: false, data: null, error: message }, { status: 500 });
  }
}
