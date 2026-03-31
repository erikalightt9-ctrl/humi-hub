/**
 * /course/[slug]
 *
 * Tenant-scoped direct course landing page.
 * URL: tenantA.yourplatform.com/course/medical-va
 *
 * - Resolves tenant from subdomain (x-tenant-subdomain header)
 * - Shows course details scoped to that tenant's course catalog
 * - CTA: "Enroll Now" links to /enroll?courseId=xxx
 * - If no tenant, falls back to platform-wide course lookup
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { GraduationCap, Clock, Users, BookOpen, ArrowRight, CheckCircle2, Star } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { resolveTenantFromSubdomain } from "@/lib/tenant";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourse(slug);
  if (!course) return { title: "Course Not Found" };
  return {
    title: `${course.title} — Enroll Now`,
    description: course.description,
  };
}

async function getCourse(slug: string) {
  const tenant = await resolveTenantFromSubdomain();

  return prisma.course.findFirst({
    where: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      slug: slug as any,
      isActive: true,
      ...(tenant ? { tenantId: tenant.tenantId } : {}),
    },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      durationWeeks: true,
      outcomes: true,
      price: true,
      isActive: true,
      tenantId: true,
    },
  });
}

export default async function CourseLandingPage({ params }: Props) {
  const { slug } = await params;
  const [course, tenant] = await Promise.all([
    getCourse(slug),
    resolveTenantFromSubdomain(),
  ]);

  if (!course) notFound();

  const primaryColor = tenant?.tenant.primaryColor ?? "#1E3A8A";
  const tenantName = tenant?.tenant.siteName ?? tenant?.tenant.name ?? "HUMI Hub";
  const logoUrl = tenant?.tenant.logoUrl ?? null;

  const price = Number(course.price ?? 0);
  const enrollUrl = `/enroll?courseId=${course.id}`;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section
        className="text-white py-16 px-4"
        style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}cc 100%)` }}
      >
        <div className="max-w-3xl mx-auto">
          {/* Tenant badge */}
          <div className="flex items-center gap-2 mb-6">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={tenantName} className="h-8 w-auto object-contain brightness-0 invert" />
            ) : (
              <GraduationCap className="h-6 w-6 text-white/80" />
            )}
            <span className="text-white/80 text-sm font-medium">{tenantName}</span>
          </div>

          <h1 className="text-4xl font-extrabold mb-4 leading-tight">{course.title}</h1>
          <p className="text-white/85 text-lg mb-8 max-w-2xl">{course.description}</p>

          <div className="flex flex-wrap gap-4 mb-8">
            <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-4 py-1.5 text-sm">
              <Clock className="h-4 w-4" />
              {course.durationWeeks} week{course.durationWeeks !== 1 ? "s" : ""}
            </div>
            <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-4 py-1.5 text-sm">
              <BookOpen className="h-4 w-4" />
              Self-paced + Live sessions
            </div>
            <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-4 py-1.5 text-sm">
              <Star className="h-4 w-4 text-amber-300" />
              Certificate included
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <Link
              href={enrollUrl}
              className="inline-flex items-center gap-2 bg-white text-slate-900 font-bold px-8 py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-px text-base"
              style={{ color: primaryColor }}
            >
              Enroll Now
              <ArrowRight className="h-5 w-5" />
            </Link>
            {price > 0 && (
              <div className="flex items-baseline gap-1 text-white">
                <span className="text-3xl font-extrabold">
                  ₱{price.toLocaleString("en-PH")}
                </span>
                <span className="text-white/70 text-sm">/ program</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Outcomes */}
      {course.outcomes.length > 0 && (
        <section className="py-12 px-4 bg-white border-b border-slate-100">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Users className="h-5 w-5" style={{ color: primaryColor }} />
              What You&apos;ll Learn
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {course.outcomes.map((outcome, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" style={{ color: primaryColor }} />
                  <span className="text-sm text-slate-700">{outcome}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Bottom CTA */}
      <section className="py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">
            Ready to start your journey?
          </h2>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">
            Join {tenantName} and gain the skills employers are looking for.
          </p>
          <Link
            href={enrollUrl}
            className="inline-flex items-center gap-2 text-white font-bold px-10 py-4 rounded-xl shadow-lg hover:opacity-90 transition-all hover:-translate-y-px text-base"
            style={{ backgroundColor: primaryColor }}
          >
            <GraduationCap className="h-5 w-5" />
            Enroll in {course.title}
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
