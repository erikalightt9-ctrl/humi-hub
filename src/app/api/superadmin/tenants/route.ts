import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { requireSuperAdmin } from "@/lib/auth-guards";
import {
  getAllTenantsWithStats,
  createTenant,
} from "@/lib/repositories/superadmin.repository";

const createTenantSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  subdomain: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  email: z.string().email(),
  industry: z.string().optional(),
  plan: z.enum(["TRIAL", "STARTER", "PROFESSIONAL", "ENTERPRISE"]).optional(),
  maxSeats: z.number().int().min(1).optional(),
  siteName: z.string().optional(),
  tagline: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  adminName: z.string().min(1),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8),
});

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireSuperAdmin(token);
    if (!guard.ok) return guard.response;

    const tenants = await getAllTenantsWithStats();
    return NextResponse.json({ success: true, data: tenants, error: null });
  } catch (err) {
    console.error("[GET /api/superadmin/tenants]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const guard = requireSuperAdmin(token);
    if (!guard.ok) return guard.response;

    const body = await request.json();
    const result = createTenantSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, data: null, error: result.error.issues[0].message },
        { status: 422 },
      );
    }

    const { adminPassword, ...rest } = result.data;
    const adminPasswordHash = await bcrypt.hash(adminPassword, 12);

    const { org, manager } = await createTenant({ ...rest, adminPasswordHash });
    return NextResponse.json(
      { success: true, data: { org, managerId: manager.id }, error: null },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/superadmin/tenants]", err);
    return NextResponse.json(
      { success: false, data: null, error: "Internal server error" },
      { status: 500 },
    );
  }
}
