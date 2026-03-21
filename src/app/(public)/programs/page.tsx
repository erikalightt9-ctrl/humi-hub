import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import { CourseCard } from "@/components/public/CourseCard";
import { prisma } from "@/lib/prisma";
import { resolveTenantFromSubdomain } from "@/lib/tenant";

export const metadata: Metadata = {
  title: "Programs — HUMI Training Center",
  description:
    "Explore HUMI Training Center's professional training programs across multiple industries. Designed by industry experts for global employers.",
};

function buildCourseHrefs(
  courses: readonly { readonly slug: string }[],
): Record<string, string> {
  const hrefs: Record<string, string> = {};
  for (const c of courses) {
    hrefs[c.slug] = `/programs/${c.slug.toLowerCase().replace(/_/g, "-")}`;
  }
  return hrefs;
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
  });

  const courseHrefs = buildCourseHrefs(courses);

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

      {/* Programs Grid */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          {courses.length === 0 ? (
            <p className="text-center text-gray-500 py-12">
              No programs found{industry ? ` for "${industry}"` : ""}.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  title={course.title}
                  description={course.description}
                  durationWeeks={course.durationWeeks}
                  price={course.price.toString()}
                  currency={course.currency}
                  slug={course.slug}
                  href={courseHrefs[course.slug] ?? "/programs"}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
