import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { resolveTenantFromSubdomain } from "@/lib/tenant";
import { SearchableCourseGrid } from "@/components/public/SearchableCourseGrid";

export const metadata: Metadata = {
  title: "Programs — HUMI Hub",
  description:
    "Explore HUMI Hub's professional training programs across multiple industries. Designed by industry experts for global employers.",
};

function resolveHref(slug: string): string {
  return `/programs/${slug.toLowerCase().replace(/_/g, "-")}`;
}

interface ProgramsPageProps {
  readonly searchParams: Promise<{ industry?: string }>;
}

export default async function ProgramsPage({ searchParams }: ProgramsPageProps) {
  const { industry } = await searchParams;
  const tenant = await resolveTenantFromSubdomain();

  const courses = await prisma.course.findMany({
    where: {
      isActive: true,
      ...(tenant ? { tenantId: tenant.tenantId } : {}),
      ...(industry ? { industry } : {}),
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      durationWeeks: true,
      price: true,
      currency: true,
      industry: true,
    },
  });

  const initialCourses = courses.map((c) => ({
    ...c,
    price: c.price.toString(),
  }));

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-blue-900 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-extrabold mb-4">
            {industry ? `${industry} Programs` : "Our Training Programs"}
          </h1>
          <p className="text-blue-100 text-lg">
            {industry
              ? `Showing ${industry} courses. Designed by industry experts for global employers.`
              : "Each program is designed by industry experts to give you the exact skills that US, Australian, and UK employers are looking for."}
          </p>
          {industry && (
            <a
              href="/programs"
              className="inline-block mt-4 text-sm text-blue-200 underline hover:text-white"
            >
              ← View all industries
            </a>
          )}
        </div>
      </section>

      {/* Programs Grid with Search */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <SearchableCourseGrid
            initialCourses={initialCourses}
            industry={industry}
            resolveHref={resolveHref}
          />
        </div>
      </section>
    </div>
  );
}
