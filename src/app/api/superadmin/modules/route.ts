import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { MODULE_KEYS, MODULE_LIST, resolveEnabledModules } from "@/lib/modules";

/* ------------------------------------------------------------------ */
/*  GET — All tenants with their module flags                          */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request });
  const guard = requireSuperAdmin(token);
  if (!guard.ok) return guard.response;

  const tenants = await prisma.organization.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      plan: true,
      isActive: true,
      featureFlags: {
        where: { feature: { in: [...MODULE_KEYS] } },
        select: { feature: true, enabled: true },
      },
    },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });

  const data = tenants.map((t) => ({
    tenantId: t.id,
    tenantName: t.name,
    slug: t.slug,
    plan: t.plan,
    isActive: t.isActive,
    modules: resolveEnabledModules(t.featureFlags),
  }));

  return NextResponse.json({
    success: true,
    data: { tenants: data, moduleList: MODULE_LIST.map((m) => ({ key: m.key, label: m.label, description: m.description, badge: m.badge, defaultEnabled: m.defaultEnabled })) },
    error: null,
  });
}

/* ------------------------------------------------------------------ */
/*  PATCH — Toggle a module for a tenant                               */
/* ------------------------------------------------------------------ */

const PatchSchema = z.object({
  tenantId: z.string().min(1),
  moduleKey: z.enum(MODULE_KEYS),
  enabled: z.boolean(),
});

export async function PATCH(request: NextRequest) {
  const token = await getToken({ req: request });
  const guard = requireSuperAdmin(token);
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, data: null, error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { tenantId, moduleKey, enabled } = parsed.data;

  await prisma.tenantFeatureFlag.upsert({
    where: { tenantId_feature: { tenantId, feature: moduleKey } },
    create: { tenantId, feature: moduleKey, enabled },
    update: { enabled },
  });

  return NextResponse.json({ success: true, data: { tenantId, moduleKey, enabled }, error: null });
}
