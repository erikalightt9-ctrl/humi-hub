import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPublicSiteData } from "@/lib/services/tenant-page.service";
import SectionRenderer, { type PageSection } from "@/components/page-builder/SectionRenderer";

export const revalidate = 60;

interface SitePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPublicSiteData(slug);

  if (!data) return { title: "Not Found" };

  const { organization, pages } = data;
  const businessName = organization.siteName ?? organization.name;
  const landingPage = pages.find((p) => p.type === "LANDING");

  return {
    title: landingPage?.metaTitle ?? businessName,
    description: landingPage?.metaDescription ?? organization.tagline ?? undefined,
  };
}

function DefaultWelcomePage({ businessName }: { businessName: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 py-24 text-center">
      <h1
        className="mb-4 text-4xl font-bold md:text-5xl"
        style={{ color: "var(--color-primary, #3B82F6)" }}
      >
        Welcome to {businessName}
      </h1>
      <p className="text-lg text-gray-600">
        Our site is coming soon. Check back later!
      </p>
    </div>
  );
}

export default async function SiteLandingPage({ params }: SitePageProps) {
  const { slug } = await params;
  const data = await getPublicSiteData(slug);

  if (!data) {
    notFound();
  }

  const { organization, pages } = data;
  const businessName = organization.siteName ?? organization.name;
  const landingPage = pages.find((p) => p.type === "LANDING");

  if (!landingPage) {
    return <DefaultWelcomePage businessName={businessName} />;
  }

  const sections = (landingPage.sections ?? []) as unknown as PageSection[];

  if (sections.length === 0) {
    return <DefaultWelcomePage businessName={businessName} />;
  }

  return (
    <div>
      {sections.map((section, index) => (
        <SectionRenderer key={index} section={section} />
      ))}
    </div>
  );
}
