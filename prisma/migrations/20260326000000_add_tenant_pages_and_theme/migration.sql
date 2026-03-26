-- CreateEnum
CREATE TYPE "PageType" AS ENUM ('LANDING', 'CONTACT', 'CUSTOM');

-- CreateEnum
CREATE TYPE "SectionType" AS ENUM ('HERO', 'FEATURES', 'TESTIMONIALS', 'CONTACT', 'CTA', 'TEXT', 'IMAGE');

-- CreateTable
CREATE TABLE "tenant_pages" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "PageType" NOT NULL DEFAULT 'CUSTOM',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "sections" JSONB NOT NULL DEFAULT '[]',
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_themes" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "primaryColor" TEXT NOT NULL DEFAULT '#3B82F6',
    "secondaryColor" TEXT NOT NULL DEFAULT '#1E40AF',
    "accentColor" TEXT NOT NULL DEFAULT '#F59E0B',
    "backgroundColor" TEXT NOT NULL DEFAULT '#FFFFFF',
    "textColor" TEXT NOT NULL DEFAULT '#111827',
    "fontHeading" TEXT NOT NULL DEFAULT 'Inter',
    "fontBody" TEXT NOT NULL DEFAULT 'Inter',
    "logoUrl" TEXT,
    "faviconUrl" TEXT,
    "customCss" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_themes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tenant_pages_organizationId_idx" ON "tenant_pages"("organizationId");

-- CreateIndex
CREATE INDEX "tenant_pages_organizationId_isPublished_idx" ON "tenant_pages"("organizationId", "isPublished");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_pages_organizationId_slug_key" ON "tenant_pages"("organizationId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_themes_organizationId_key" ON "tenant_themes"("organizationId");

-- AddForeignKey
ALTER TABLE "tenant_pages" ADD CONSTRAINT "tenant_pages_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_themes" ADD CONSTRAINT "tenant_themes_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
