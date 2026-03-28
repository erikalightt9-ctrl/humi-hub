import { prisma } from "@/lib/prisma";
import type { UpdateThemeInput } from "@/lib/validators/page-builder";

/* ------------------------------------------------------------------ */
/*  tenant-theme.service.ts                                           */
/*  Tenant isolation enforced via organizationId                      */
/* ------------------------------------------------------------------ */

export async function getTheme(organizationId: string) {
  return prisma.tenantTheme.findUnique({
    where: { organizationId },
  });
}

export async function upsertTheme(organizationId: string, data: UpdateThemeInput) {
  return prisma.tenantTheme.upsert({
    where: { organizationId },
    update: {
      ...(data.primaryColor !== undefined && { primaryColor: data.primaryColor }),
      ...(data.secondaryColor !== undefined && { secondaryColor: data.secondaryColor }),
      ...(data.accentColor !== undefined && { accentColor: data.accentColor }),
      ...(data.backgroundColor !== undefined && { backgroundColor: data.backgroundColor }),
      ...(data.textColor !== undefined && { textColor: data.textColor }),
      ...(data.fontHeading !== undefined && { fontHeading: data.fontHeading }),
      ...(data.fontBody !== undefined && { fontBody: data.fontBody }),
      ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl }),
      ...(data.faviconUrl !== undefined && { faviconUrl: data.faviconUrl }),
      ...(data.customCss !== undefined && { customCss: data.customCss }),
      ...(data.headingSize !== undefined && { headingSize: data.headingSize }),
      ...(data.bodySize !== undefined && { bodySize: data.bodySize }),
    },
    create: {
      organizationId,
      primaryColor: data.primaryColor ?? "#3B82F6",
      secondaryColor: data.secondaryColor ?? "#1E40AF",
      accentColor: data.accentColor ?? "#F59E0B",
      backgroundColor: data.backgroundColor ?? "#FFFFFF",
      textColor: data.textColor ?? "#111827",
      fontHeading: data.fontHeading ?? "Inter",
      fontBody: data.fontBody ?? "Inter",
      logoUrl: data.logoUrl ?? null,
      faviconUrl: data.faviconUrl ?? null,
      customCss: data.customCss ?? null,
      headingSize: data.headingSize ?? "md",
      bodySize: data.bodySize ?? "md",
    },
  });
}
