import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { requireSuperAdmin } from "@/lib/auth-guards";
import {
  getAllTenantsWithStats,
  createTenant,
} from "@/lib/repositories/superadmin.repository";
import { sendTenantWelcomeEmail } from "@/lib/email/send-tenant-welcome";
import { prisma } from "@/lib/prisma";
import { MODULE_KEYS } from "@/lib/modules";

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
  enabledModules: z.array(z.string()).optional(),
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

    const { adminPassword, enabledModules, ...rest } = result.data;
    const adminPasswordHash = await bcrypt.hash(adminPassword, 12);

    const { org, manager } = await createTenant({ ...rest, adminPasswordHash });

    // Seed module feature flags for all known modules
    const enabledSet = new Set(enabledModules ?? []);
    await prisma.tenantFeatureFlag.createMany({
      data: MODULE_KEYS.map((key) => ({
        tenantId: org.id,
        feature: key,
        enabled: enabledSet.has(key),
      })),
      skipDuplicates: true,
    });

    // Fire welcome email — non-blocking so a mail failure doesn't block the response
    sendTenantWelcomeEmail({
      orgName: org.name,
      subdomain: org.subdomain ?? rest.subdomain,
      plan: org.plan,
      adminName: rest.adminName,
      adminEmail: rest.adminEmail,
      temporaryPassword: adminPassword,
    }).catch((err) => {
      console.error("[POST /api/superadmin/tenants] welcome email failed:", err);
    });

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
