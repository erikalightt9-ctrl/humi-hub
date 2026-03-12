import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import { CourseCard } from "@/components/public/CourseCard";
import { ProgramComparisonTable } from "@/components/public/ProgramComparisonTable";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Programs \u2014 HUMI+ VA Training Center",
  description:
    "Explore HUMI+ VA Training Center's specialized programs: Medical VA, Real Estate VA, and US Bookkeeping VA.",
};

const courseHrefs: Record<string, string> = {
  MEDICAL_VA: "/programs/medical-va",
  REAL_ESTATE_VA: "/programs/real-estate-va",
  US_BOOKKEEPING_VA: "/programs/us-bookkeeping-va",
};

export default async function ProgramsPage() {
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
            Australian, and UK employers are looking for. Choose a specialization and start
            your journey to becoming an AI-powered virtual assistant.
          </p>
        </div>
      </section>

      {/* Programs Grid */}
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
                currency={course.currency}
                slug={course.slug}
                href={courseHrefs[course.slug] ?? "/programs"}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Comparison section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-3">
              Not sure which program?
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              Compare our three specializations side by side to find the best fit
              for your background and career goals.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8">
            <ProgramComparisonTable />
          </div>
        </div>
      </section>
    </div>
  );
}
