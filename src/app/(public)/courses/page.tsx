import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import { CourseCard } from "@/components/public/CourseCard";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Courses",
  description:
    "Explore VA Training Center's specialized programs: Medical VA, Real Estate VA, and US Bookkeeping VA.",
};

const courseHrefs: Record<string, string> = {
  MEDICAL_VA: "/courses/medical-va",
  REAL_ESTATE_VA: "/courses/real-estate-va",
  US_BOOKKEEPING_VA: "/courses/us-bookkeeping-va",
};

export default async function CoursesPage() {
  const courses = await prisma.course.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-blue-900 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-extrabold mb-4">Our Training Programs</h1>
          <p className="text-blue-100 text-lg">
            Each program is designed by industry experts to give you the exact skills that US,
            Australian, and UK employers are looking for.
          </p>
        </div>
      </section>

      {/* Courses Grid */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                title={course.title}
                description={course.description}
                durationWeeks={course.durationWeeks}
                price={course.price.toString()}
                slug={course.slug}
                href={courseHrefs[course.slug] ?? "/courses"}
              />
            ))}
          </div>

          {/* Comparison note */}
          <div className="mt-12 bg-blue-50 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Not sure which program to choose?</h2>
            <p className="text-gray-600 mb-4">
              All three programs open doors to remote work with international clients. Here is a
              quick guide:
            </p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>
                <strong>Medical VA</strong> — Ideal if you have a healthcare background or interest
                in the medical field.
              </li>
              <li>
                <strong>Real Estate VA</strong> — Perfect if you enjoy sales, marketing, and working
                with high-energy professionals.
              </li>
              <li>
                <strong>US Bookkeeping VA</strong> — Best for detail-oriented individuals with an
                aptitude for numbers and finance.
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
