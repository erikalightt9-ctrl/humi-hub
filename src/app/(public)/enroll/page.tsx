import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import { EnrollmentForm } from "@/components/enrollment/EnrollmentForm";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Enroll Now",
  description:
    "Apply for VA Training Center's Medical VA, Real Estate VA, or US Bookkeeping VA programs. Applications are open year-round.",
};

export default async function EnrollPage() {
  const courses = await prisma.course.findMany({
    where: { isActive: true },
    select: { id: true, title: true, slug: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero */}
      <section className="bg-blue-900 text-white py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-extrabold mb-2">Apply Now</h1>
          <p className="text-blue-100">
            Complete the form below to start your VA training journey. It takes about 10 minutes.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="py-12 px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <EnrollmentForm courses={courses} />
        </div>
      </section>
    </div>
  );
}
