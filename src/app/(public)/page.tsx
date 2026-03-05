import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import Link from "next/link";
import { HeroSection } from "@/components/public/HeroSection";
import { VAaiSection } from "@/components/public/VAaiSection";
import { CourseCard } from "@/components/public/CourseCard";
import { WhyChooseUs } from "@/components/public/WhyChooseUs";
import { TestimonialsSection } from "@/components/public/TestimonialsSection";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Home — Virtual Assistant Training Programs",
  description:
    "Become an AI-powered Virtual Assistant. Specialized courses in Medical VA, Real Estate VA, and US Bookkeeping VA — with hands-on AI training.",
};

const courseHrefs: Record<string, string> = {
  MEDICAL_VA: "/courses/medical-va",
  REAL_ESTATE_VA: "/courses/real-estate-va",
  US_BOOKKEEPING_VA: "/courses/us-bookkeeping-va",
};

export default async function HomePage() {
  const courses = await prisma.course.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <>
      <HeroSection />

      <VAaiSection />

      {/* Course preview */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Our Programs</h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              Choose the VA specialization that matches your interests and career goals.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
          <div className="text-center mt-10">
            <Button asChild variant="outline" size="lg">
              <Link href="/courses">View All Programs</Link>
            </Button>
          </div>
        </div>
      </section>

      <TestimonialsSection />

      <WhyChooseUs />

      {/* CTA Banner */}
      <section className="bg-blue-700 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold mb-4">Ready to Become an AI-Powered VA?</h2>
          <p className="text-blue-100 mb-8 text-lg">
            Join 2,400+ Filipino professionals who are earning more by working smarter with AI.
            Applications are open year-round.
          </p>
          <Button asChild size="lg" className="bg-white text-blue-700 font-bold hover:bg-blue-50">
            <Link href="/enroll">Apply Now — It is Free</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
