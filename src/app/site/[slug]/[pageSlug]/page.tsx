import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPublicPage } from "@/lib/services/tenant-page.service";
import SectionRenderer, { type PageSection } from "@/components/page-builder/SectionRenderer";

export const revalidate = 60;

interface PageRouteProps {
  params: Promise<{ slug: string; pageSlug: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; pageSlug: string }>;
}): Promise<Metadata> {
  const { slug, pageSlug } = await params;
  const page = await getPublicPage(slug, pageSlug);

  if (!page) return { title: "Not Found" };

  const org = page.organization;
  const businessName = org.siteName ?? org.name;

  return {
    title: page.metaTitle ?? `${page.title} | ${businessName}`,
    description: page.metaDescription ?? undefined,
  };
}

export default async function PublicCustomPage({ params }: PageRouteProps) {
  const { slug, pageSlug } = await params;
  const page = await getPublicPage(slug, pageSlug);

  if (!page) {
    notFound();
  }

  const sections = (page.sections ?? []) as unknown as PageSection[];

  if (sections.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 py-24 text-center">
        <h1
          className="mb-4 text-3xl font-bold md:text-4xl"
          style={{ color: "var(--color-primary, #3B82F6)" }}
        >
          {page.title}
        </h1>
        <p className="text-gray-500">No content yet.</p>
      </div>
    );
  }

  return (
    <div>
      {sections.map((section, index) => (
        <SectionRenderer key={index} section={section} />
      ))}
    </div>
  );
}
