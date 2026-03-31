import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { resolveTenantFromSubdomain } from "@/lib/tenant";
import { SearchableCourseGrid } from "@/components/public/SearchableCourseGrid";

export const metadata: Metadata = {
  title: "Courses",
  description:
    "Explore HUMI Hub's professional training programs across multiple specializations.",
};

function resolveHref(slug: string): string {
  const map: Record<string, string> = {
    MEDICAL_VA: "/courses/medical-va",
    REAL_ESTATE_VA: "/courses/real-estate-va",
    US_BOOKKEEPING_VA: "/courses/us-bookkeeping-va",
  };
  return map[slug] ?? `/programs/${slug.toLowerCase().replace(/_/g, "-")}`;
}

export default async function CoursesPage() {
  const tenant = await resolveTenantFromSubdomain();

  const courses = await prisma.course.findMany({
    where: {
      isActive: true,
      ...(tenant ? { tenantId: tenant.tenantId } : {}),
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
          <h1 className="text-4xl font-extrabold mb-4">Our Training Programs</h1>
          <p className="text-blue-100 text-lg">
            Each program is designed by industry experts to give you the exact
            skills that US, Australian, and UK employers are looking for.
          </p>
        </div>
      </section>

      {/* Courses Grid with Search */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <SearchableCourseGrid
            initialCourses={initialCourses}
            resolveHref={resolveHref}
          />
        </div>
      </section>
    </div>
  );
}
