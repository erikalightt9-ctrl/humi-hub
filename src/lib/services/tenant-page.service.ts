import { prisma } from "@/lib/prisma";
import { MAX_PAGES_PER_ORG } from "@/lib/constants/page-builder";
import type { CreatePageInput, UpdatePageInput } from "@/lib/validators/page-builder";

/* ------------------------------------------------------------------ */
/*  tenant-page.service.ts                                            */
/*  All functions enforce organizationId for tenant isolation         */
/* ------------------------------------------------------------------ */

export async function listPages(organizationId: string) {
  return prisma.tenantPage.findMany({
    where: { organizationId },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      title: true,
      slug: true,
      type: true,
      isPublished: true,
      order: true,
      metaTitle: true,
      metaDescription: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function getPageById(organizationId: string, id: string) {
  return prisma.tenantPage.findFirst({
    where: { id, organizationId },
  });
}

export async function createPage(organizationId: string, data: CreatePageInput) {
  // Enforce page limit
  const count = await prisma.tenantPage.count({ where: { organizationId } });
  if (count >= MAX_PAGES_PER_ORG) {
    throw new Error(`Page limit reached (${MAX_PAGES_PER_ORG} max per organization)`);
  }

  return prisma.tenantPage.create({
    data: {
      organizationId,
      title: data.title,
      slug: data.slug,
      type: data.type ?? "CUSTOM",
      isPublished: data.isPublished ?? false,
      sections: (data.sections ?? []) as object[],
      metaTitle: data.metaTitle ?? null,
      metaDescription: data.metaDescription ?? null,
      order: data.order ?? 0,
    },
  });
}

export async function updatePage(
  organizationId: string,
  id: string,
  data: UpdatePageInput,
) {
  // Verify ownership first
  const existing = await prisma.tenantPage.findFirst({ where: { id, organizationId } });
  if (!existing) return null;

  return prisma.tenantPage.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.slug !== undefined && { slug: data.slug }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.isPublished !== undefined && { isPublished: data.isPublished }),
      ...(data.sections !== undefined && { sections: data.sections as object[] }),
      ...(data.metaTitle !== undefined && { metaTitle: data.metaTitle }),
      ...(data.metaDescription !== undefined && { metaDescription: data.metaDescription }),
      ...(data.order !== undefined && { order: data.order }),
    },
  });
}

export async function deletePage(organizationId: string, id: string) {
  // Verify ownership first
  const existing = await prisma.tenantPage.findFirst({ where: { id, organizationId } });
  if (!existing) return null;

  return prisma.tenantPage.delete({ where: { id } });
}

export async function reorderSections(
  organizationId: string,
  id: string,
  sections: object[],
) {
  const existing = await prisma.tenantPage.findFirst({ where: { id, organizationId } });
  if (!existing) return null;

  return prisma.tenantPage.update({
    where: { id },
    data: { sections },
  });
}

export async function getPublicPage(orgSlug: string, pageSlug: string) {
  return prisma.tenantPage.findFirst({
    where: {
      slug: pageSlug,
      isPublished: true,
      organization: {
        slug: orgSlug,
        isActive: true,
      },
    },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          siteName: true,
          tagline: true,
        },
      },
    },
  });
}

export async function getPublicSiteData(orgSlug: string) {
  const org = await prisma.organization.findFirst({
    where: { slug: orgSlug, isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      siteName: true,
      tagline: true,
      theme: true,
      pages: {
        where: { isPublished: true },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          title: true,
          slug: true,
          type: true,
          sections: true,
          metaTitle: true,
          metaDescription: true,
          order: true,
        },
      },
    },
  });

  if (!org) return null;

  return {
    organization: {
      id: org.id,
      name: org.name,
      slug: org.slug,
      logoUrl: org.logoUrl,
      siteName: org.siteName,
      tagline: org.tagline,
    },
    theme: org.theme,
    pages: org.pages,
  };
}
