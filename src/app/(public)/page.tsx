import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import Link from "next/link";
import { HeroSection } from "@/components/public/HeroSection";
import { IndustryProgramsSection } from "@/components/public/IndustryProgramsSection";
import { CorporateTrainingSection } from "@/components/public/CorporateTrainingSection";
import { CourseCard } from "@/components/public/CourseCard";
import { WhyChooseUs } from "@/components/public/WhyChooseUs";
import { HowItWorksSection } from "@/components/public/HowItWorksSection";
import { LearningExperienceSection } from "@/components/public/LearningExperienceSection";
import { TrainersSection } from "@/components/public/TrainersSection";
import { TestimonialsSection } from "@/components/public/TestimonialsSection";
import { CareerPathwaysSection } from "@/components/public/CareerPathwaysSection";
import { EnrollmentCTASection } from "@/components/public/EnrollmentCTASection";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "HUMI Training Center — Professional Training Programs",
  description:
    "The Philippines' premier professional training platform. Industry-specific programs in Healthcare, Real Estate, Finance, Legal, Tech, and more — with AI-enhanced curriculum and career placement support.",
};

const courseHrefs: Record<string, string> = {
  MEDICAL_VA: "/programs/medical-va",
  REAL_ESTATE_VA: "/programs/real-estate-va",
  US_BOOKKEEPING_VA: "/programs/us-bookkeeping-va",
};

export default async function HomePage() {
  const courses = await prisma.course.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <>
      {/* 1. Hero — dual audience positioning */}
      <HeroSection />

      {/* 2. Industry Programs — 8 industry cards */}
      <IndustryProgramsSection />

      {/* 3. Featured Courses — dynamic from DB */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-blue-600 font-semibold text-sm uppercase tracking-wide mb-2">
              Featured Programs
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
              Start With Our <span className="text-blue-700">Top Programs</span>
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              Our most popular training programs — designed to get you job-ready
              in as little as 8 weeks.
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
                currency={course.currency}
                slug={course.slug}
                href={courseHrefs[course.slug] ?? "/programs"}
              />
            ))}
          </div>
          <div className="text-center mt-10">
            <Button asChild variant="outline" size="lg">
              <Link href="/programs">View All Programs</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 4. How It Works — 4-step process */}
      <HowItWorksSection />

      {/* 5. Platform Advantages — 8 advantage cards */}
      <WhyChooseUs />

      {/* 6. Learning Experience — platform features */}
      <LearningExperienceSection />

      {/* 7. Expert Trainers — tiers + stats */}
      <TrainersSection />

      {/* 8. Corporate Training — B2B positioning */}
      <CorporateTrainingSection />

      {/* 9. Testimonials — dynamic from DB */}
      <TestimonialsSection />

      {/* 10. Career Pathways — outcomes + career table */}
      <CareerPathwaysSection />

      {/* 11. Final CTA — dual audience enrollment */}
      <EnrollmentCTASection />
    </>
  );
}
