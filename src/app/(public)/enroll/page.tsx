import type { Metadata } from "next";
export const dynamic = "force-dynamic";

import { EnrollmentForm } from "@/components/enrollment/EnrollmentForm";
import { prisma } from "@/lib/prisma";
import { resolveTenantFromSubdomain } from "@/lib/tenant";
import { GraduationCap, CheckCircle2, Clock, Award } from "lucide-react";

export const metadata: Metadata = {
  title: "Enroll Now",
  description:
    "Apply for a professional training program. Applications are open year-round.",
};

export default async function EnrollPage() {
  const tenant = await resolveTenantFromSubdomain();

  const courses = await prisma.course.findMany({
    where: {
      isActive: true,
      ...(tenant ? { tenantId: tenant.tenantId } : {}),
    },
    select: { id: true, title: true, slug: true },
    orderBy: { createdAt: "asc" },
  });

  // Resolve tenant branding for the hero
  const org = tenant?.tenant ?? null;
  const primaryColor = org?.primaryColor ?? "#1e3a8a";
  const secondaryColor = org?.secondaryColor ?? "#1e40af";
  const displayName = org?.siteName ?? org?.name ?? "HUMI Hub";
  const logoUrl = org?.logoUrl ?? null;

  const perks = [
    "Self-paced + live training sessions",
    "Certificate upon completion",
    "Mentorship from industry experts",
    "Job placement assistance",
  ] as const;

  return (
    <div className="bg-slate-50 min-h-screen">

      {/* ── Branded Hero ── */}
      <section
        className="text-white py-14 px-4 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor}cc 100%)`,
        }}
      >
        {/* decorative circles */}
        <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute -bottom-12 -left-12 w-72 h-72 rounded-full bg-white/5" />

        <div className="relative max-w-3xl mx-auto text-center">
          {/* Org badge */}
          <div className="flex items-center justify-center gap-2 mb-5">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={displayName}
                className="h-8 w-auto object-contain brightness-0 invert"
              />
            ) : (
              <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
            )}
            <span className="text-white/80 text-sm font-medium">{displayName}</span>
          </div>

          <h1 className="text-4xl font-extrabold mb-3 leading-tight">
            Start Your Career Journey
          </h1>
          <p className="text-white/80 text-lg mb-8 max-w-lg mx-auto">
            Complete the form below to apply. It takes about 10 minutes and
            enrollment is open year-round.
          </p>

          {/* Perks */}
          <div className="flex flex-wrap justify-center gap-3">
            {perks.map((perk) => (
              <span
                key={perk}
                className="inline-flex items-center gap-1.5 bg-white/15 text-white/90 text-xs font-medium px-3 py-1.5 rounded-full"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {perk}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Process steps ── */}
      <section className="bg-white border-b border-slate-200 py-6 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-center gap-4 sm:gap-8 text-sm">
            {[
              { step: "1", label: "Fill out the form", icon: GraduationCap },
              { step: "2", label: "Wait for approval", icon: Clock },
              { step: "3", label: "Start learning", icon: Award },
            ].map(({ step, label, icon: Icon }) => (
              <div key={step} className="flex items-center gap-2.5">
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ backgroundColor: primaryColor }}
                >
                  {step}
                </div>
                <Icon className="h-4 w-4 text-slate-400 hidden sm:block" />
                <span className="text-slate-600 font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Enrollment Form ── */}
      <section className="py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Card header */}
            <div
              className="px-8 py-5 border-b border-slate-100"
              style={{ backgroundColor: `${primaryColor}08` }}
            >
              <h2 className="text-lg font-bold text-slate-900">Enrollment Application</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                All fields are required. We&apos;ll review your application within 24–48 hours.
              </p>
            </div>
            <div className="p-8">
              <EnrollmentForm courses={courses} />
            </div>
          </div>

          {/* Trust note */}
          <p className="text-center text-xs text-slate-400 mt-4">
            🔒 Your information is kept private and secure. We never share your data.
          </p>
        </div>
      </section>
    </div>
  );
}
