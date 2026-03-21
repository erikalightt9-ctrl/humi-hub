import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import { HeroSection } from "@/components/public/HeroSection";
import { IndustryProgramsSection } from "@/components/public/IndustryProgramsSection";
import { CorporateTrainingSection } from "@/components/public/CorporateTrainingSection";
import { WhyChooseUs } from "@/components/public/WhyChooseUs";
import { HowItWorksSection } from "@/components/public/HowItWorksSection";
import { LearningExperienceSection } from "@/components/public/LearningExperienceSection";
import { TrainersSection } from "@/components/public/TrainersSection";
import { TestimonialsSection } from "@/components/public/TestimonialsSection";
import { EnrollmentCTASection } from "@/components/public/EnrollmentCTASection";
import { prisma } from "@/lib/prisma";
import { resolveTenantFromSubdomain } from "@/lib/tenant";

export const metadata: Metadata = {
  title: "HUMI Training Center — Professional Training Programs",
  description:
    "The Philippines' premier professional training platform. Industry-specific programs in Healthcare, Real Estate, Finance, Legal, Tech, and more — with AI-enhanced curriculum and career placement support.",
};

/** Convert DB slug (UPPER_SNAKE) → URL slug (lower-kebab) */
function buildCourseHrefs(
  courses: readonly { readonly slug: string }[],
): Record<string, string> {
  const hrefs: Record<string, string> = {};
  for (const c of courses) {
    hrefs[c.slug] = `/programs/${c.slug.toLowerCase().replace(/_/g, "-")}`;
  }
  return hrefs;
}

export default async function HomePage() {
  const tenant = await resolveTenantFromSubdomain();

  const courses = await prisma.course.findMany({
    where: {
      isActive: true,
      ...(tenant ? { tenantId: tenant.tenantId } : {}),
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <>
      {/* 1. Hero — dual audience positioning */}
      <HeroSection />

      {/* 2. Industry Programs — dynamic course cards */}
      <IndustryProgramsSection courses={courses} courseHrefs={buildCourseHrefs(courses)} />

      {/* 3. How It Works — 4-step process */}
      <HowItWorksSection />

      {/* 4. Platform Advantages — 8 advantage cards */}
      <WhyChooseUs />

      {/* 5. Learning Experience — platform features */}
      <LearningExperienceSection />

      {/* 6. Expert Trainers — tiers + stats */}
      <TrainersSection />

      {/* 7. Corporate Training — B2B positioning */}
      <CorporateTrainingSection />

      {/* 8. Testimonials — dynamic from DB */}
      <TestimonialsSection />

      {/* 9. Final CTA — dual audience enrollment */}
      <EnrollmentCTASection />
    </>
  );
}
