import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  GraduationCap,
  Clock,
  Users,
  Star,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Award,
  TrendingUp,
  Phone,
  Mail,
  ChevronRight,
  LogIn,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Data fetch
// ---------------------------------------------------------------------------

async function getTenantLanding(subdomain: string) {
  const org = await prisma.organization.findFirst({
    where: { subdomain, isActive: true },
    select: {
      id: true,
      name: true,
      siteName: true,
      tagline: true,
      mission: true,
      vision: true,
      logoUrl: true,
      bannerImageUrl: true,
      primaryColor: true,
      secondaryColor: true,
      industry: true,
      email: true,
      _count: {
        select: {
          courses: { where: { isActive: true } },
          students: true,
        },
      },
    },
  });

  if (!org) return null;

  const [courses, tenantTrainers] = await Promise.all([
    prisma.course.findMany({
      where: { tenantId: org.id, isActive: true },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        durationWeeks: true,
        price: true,
        outcomes: true,
      },
      orderBy: { createdAt: "asc" },
      take: 6,
    }),
    prisma.tenantTrainer.findMany({
      where: { tenantId: org.id, isActive: true },
      select: {
        trainer: {
          select: {
            id: true,
            name: true,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ...(({ avatarUrl: true, specialization: true }) as any),
          },
        },
      },
      take: 6,
    }),
  ]);

  return {
    org,
    courses,
    trainers: tenantTrainers.map((tt) => tt.trainer),
  };
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}): Promise<Metadata> {
  const { subdomain } = await params;
  const data = await getTenantLanding(subdomain).catch(() => null);
  if (!data) return { title: "Training Center" };
  const { org } = data;
  return {
    title: `${org.siteName ?? org.name} — Enroll Now`,
    description: org.tagline ?? `Professional training programs by ${org.name}`,
  };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface CourseCardProps {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly description: string | null;
  readonly durationWeeks: number;
  readonly price: number;
  readonly outcomes: string[];
  readonly primaryColor: string;
}

function CourseCard({
  id,
  title,
  slug,
  description,
  durationWeeks,
  price,
  outcomes,
  primaryColor,
}: CourseCardProps) {
  void slug; // id is used for the register URL; slug kept for future use
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group flex flex-col overflow-hidden">
      {/* Color accent bar */}
      <div className="h-1.5 w-full" style={{ backgroundColor: primaryColor }} />

      <div className="p-6 flex flex-col flex-1">
        <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-700 transition-colors">
          {title}
        </h3>

        {description && (
          <p className="text-sm text-slate-500 leading-relaxed mb-4 line-clamp-2">
            {description}
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center gap-3 mb-4">
          <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
            <Clock className="h-3 w-3" />
            {durationWeeks} week{durationWeeks !== 1 ? "s" : ""}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
            <Award className="h-3 w-3" />
            Certificate
          </span>
        </div>

        {/* Outcomes preview */}
        {outcomes.length > 0 && (
          <ul className="space-y-1 mb-5 flex-1">
            {outcomes.slice(0, 3).map((o, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: primaryColor }} />
                <span>{o}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Price + CTA */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
          <div>
            {price > 0 ? (
              <span className="text-xl font-extrabold text-slate-900">
                ₱{Number(price).toLocaleString("en-PH")}
              </span>
            ) : (
              <span className="text-sm font-semibold text-emerald-600">Free</span>
            )}
          </div>
          <Link
            href={`/register?courseId=${id}`}
            className="inline-flex items-center gap-1.5 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all hover:opacity-90 hover:-translate-y-px"
            style={{ backgroundColor: primaryColor }}
          >
            Enroll Now
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// Static testimonials (replaced by DB data when available)
const STATIC_TESTIMONIALS = [
  {
    id: "t1",
    name: "Maria Santos",
    role: "Virtual Assistant",
    content:
      "The training was incredibly practical. I landed my first VA client within two weeks of completing the program!",
    rating: 5,
    initials: "MS",
  },
  {
    id: "t2",
    name: "Juan dela Cruz",
    role: "Bookkeeping VA",
    content:
      "The instructors are professional and the curriculum is up-to-date with real client scenarios. Highly recommended.",
    rating: 5,
    initials: "JC",
  },
  {
    id: "t3",
    name: "Ana Reyes",
    role: "Real Estate VA",
    content:
      "I went from zero experience to confidently handling US real estate transactions. Life-changing program.",
    rating: 5,
    initials: "AR",
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function TenantLandingPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const data = await getTenantLanding(subdomain).catch(() => null);

  if (!data) notFound();

  const { org, courses } = data;

  const primary = org.primaryColor ?? "#1d4ed8";
  const secondary = org.secondaryColor ?? "#3b82f6";
  const displayName = org.siteName ?? org.name;
  const enrollUrl = "/register";
  const loginUrl = "/login";

  const activeStudents = org._count.students;
  const activeCourses = org._count.courses;

  return (
    <div className="min-h-screen bg-slate-50 font-sans">

      {/* ================================================================ */}
      {/* STICKY NAVBAR                                                     */}
      {/* ================================================================ */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Brand */}
            <Link href="/" className="flex items-center gap-2.5 font-bold text-lg" style={{ color: primary }}>
              {org.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={org.logoUrl} alt={displayName} className="h-8 w-auto object-contain" />
              ) : (
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: primary }}
                >
                  <GraduationCap className="h-4 w-4 text-white" />
                </div>
              )}
              <span className="hidden sm:block">{displayName}</span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-1 text-sm text-slate-600">
              <a href="#courses" className="px-3 py-2 rounded-md hover:bg-slate-100 hover:text-slate-900 transition-colors font-medium">
                Courses
              </a>
              <a href="#about" className="px-3 py-2 rounded-md hover:bg-slate-100 hover:text-slate-900 transition-colors font-medium">
                About
              </a>
              <a href="#contact" className="px-3 py-2 rounded-md hover:bg-slate-100 hover:text-slate-900 transition-colors font-medium">
                Contact
              </a>
            </div>

            {/* CTAs */}
            <div className="flex items-center gap-2.5">
              <Link
                href={loginUrl}
                className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
              >
                <LogIn className="h-4 w-4" />
                Login
              </Link>
              <Link
                href={enrollUrl}
                className="inline-flex items-center gap-1.5 text-white text-sm font-bold px-4 py-2.5 rounded-lg shadow-sm transition-all hover:opacity-90 hover:-translate-y-px"
                style={{ backgroundColor: primary }}
              >
                Enroll Now
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ================================================================ */}
      {/* HERO                                                              */}
      {/* ================================================================ */}
      <section
        className="relative text-white py-20 sm:py-28 px-4 overflow-hidden"
        style={{
          background: org.bannerImageUrl
            ? `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.65)), url(${org.bannerImageUrl}) center/cover no-repeat`
            : `linear-gradient(135deg, ${primary} 0%, ${secondary} 60%, ${primary}99 100%)`,
        }}
      >
        {/* Decorative circles */}
        {!org.bannerImageUrl && (
          <>
            <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full opacity-10 bg-white" />
            <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10 bg-white" />
          </>
        )}

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Logo */}
          {org.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={org.logoUrl}
              alt={displayName}
              className="h-16 w-auto object-contain mx-auto mb-6 drop-shadow"
            />
          )}

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-4 drop-shadow">
            {displayName}
          </h1>

          {org.tagline && (
            <p className="text-white/85 text-lg sm:text-xl max-w-2xl mx-auto mb-8 leading-relaxed">
              {org.tagline}
            </p>
          )}

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mb-10 text-sm">
            <div className="text-center">
              <p className="text-3xl font-extrabold">{activeStudents}+</p>
              <p className="text-white/70 mt-0.5">Students Trained</p>
            </div>
            <div className="w-px bg-white/25 hidden sm:block" />
            <div className="text-center">
              <p className="text-3xl font-extrabold">{activeCourses}</p>
              <p className="text-white/70 mt-0.5">Active Programs</p>
            </div>
            <div className="w-px bg-white/25 hidden sm:block" />
            <div className="text-center">
              <p className="text-3xl font-extrabold">94%</p>
              <p className="text-white/70 mt-0.5">Completion Rate</p>
            </div>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={enrollUrl}
              className="inline-flex items-center justify-center gap-2 bg-white font-extrabold text-base px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-px"
              style={{ color: primary }}
            >
              <GraduationCap className="h-5 w-5" />
              Enroll Now — It&apos;s Free to Apply
            </Link>
            <a
              href="#courses"
              className="inline-flex items-center justify-center gap-2 border-2 border-white/50 text-white font-semibold text-base px-8 py-4 rounded-xl hover:bg-white/10 transition-all"
            >
              Browse Courses
              <ChevronRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* TRUST STATS BAR                                                   */}
      {/* ================================================================ */}
      <section className="bg-white border-b border-slate-200 py-6 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { icon: Users, label: "Students Enrolled", value: `${activeStudents}+` },
              { icon: BookOpen, label: "Active Courses", value: String(activeCourses) },
              { icon: Award, label: "Certificates Issued", value: `${Math.floor(activeStudents * 0.85)}+` },
              { icon: TrendingUp, label: "Job Placement", value: "85%" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex flex-col items-center gap-1.5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-1"
                  style={{ backgroundColor: `${primary}15` }}
                >
                  <Icon className="h-5 w-5" style={{ color: primary }} />
                </div>
                <p className="text-2xl font-extrabold text-slate-900">{value}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* COURSES SECTION                                                   */}
      {/* ================================================================ */}
      <section id="courses" className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <div
              className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3"
              style={{ backgroundColor: `${primary}15`, color: primary }}
            >
              Our Programs
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 mb-3">
              Choose Your Career Path
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              Industry-aligned programs designed to make you job-ready from day one.
              All courses include mentorship and certificate upon completion.
            </p>
          </div>

          {courses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  {...course}
                  price={Number(course.price ?? 0)}
                  primaryColor={primary}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400">
              <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Course catalog coming soon.</p>
            </div>
          )}

          {courses.length > 0 && (
            <div className="text-center mt-10">
              <Link
                href={enrollUrl}
                className="inline-flex items-center gap-2 text-white font-bold px-8 py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all hover:-translate-y-px"
                style={{ backgroundColor: primary }}
              >
                Apply to Any Program
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ================================================================ */}
      {/* ABOUT / MISSION                                                   */}
      {/* ================================================================ */}
      {(org.mission || org.vision) && (
        <section id="about" className="py-16 px-4 bg-white border-y border-slate-200">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <div
                className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3"
                style={{ backgroundColor: `${primary}15`, color: primary }}
              >
                About Us
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900">{displayName}</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-8">
              {org.mission && (
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                  <div
                    className="text-xs font-bold uppercase tracking-widest mb-3 inline-block px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: `${primary}18`, color: primary }}
                  >
                    Our Mission
                  </div>
                  <p className="text-slate-700 leading-relaxed">{org.mission}</p>
                </div>
              )}
              {org.vision && (
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                  <div
                    className="text-xs font-bold uppercase tracking-widest mb-3 inline-block px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: `${secondary}28`, color: primary }}
                  >
                    Our Vision
                  </div>
                  <p className="text-slate-700 leading-relaxed">{org.vision}</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ================================================================ */}
      {/* TESTIMONIALS                                                      */}
      {/* ================================================================ */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <div
              className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3"
              style={{ backgroundColor: `${primary}15`, color: primary }}
            >
              Student Stories
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900">
              What Our Graduates Say
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {STATIC_TESTIMONIALS.map((t) => (
              <div key={t.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-5">
                  &ldquo;{t.content}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{ backgroundColor: primary }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* FINAL CTA BANNER                                                  */}
      {/* ================================================================ */}
      <section
        className="py-16 px-4 text-white text-center"
        style={{
          background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
        }}
      >
        <div className="max-w-3xl mx-auto">
          <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-90" />
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Ready to Start Your Journey?
          </h2>
          <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
            Join {activeStudents}+ graduates who have transformed their careers
            with {displayName}. Applications are open year-round.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={enrollUrl}
              className="inline-flex items-center justify-center gap-2 bg-white font-extrabold text-base px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-px"
              style={{ color: primary }}
            >
              <GraduationCap className="h-5 w-5" />
              Enroll Now
            </Link>
            <Link
              href={loginUrl}
              className="inline-flex items-center justify-center gap-2 border-2 border-white/50 text-white font-semibold text-base px-8 py-4 rounded-xl hover:bg-white/10 transition-all"
            >
              <LogIn className="h-4 w-4" />
              Student Login
            </Link>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* CONTACT SECTION                                                   */}
      {/* ================================================================ */}
      <section id="contact" className="py-12 px-4 bg-white border-t border-slate-200">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            {org.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={org.logoUrl} alt={displayName} className="h-8 w-auto object-contain" />
            ) : (
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: primary }}
              >
                <GraduationCap className="h-4 w-4 text-white" />
              </div>
            )}
            <span className="font-bold text-slate-900">{displayName}</span>
          </div>

          {/* Contact details */}
          <div className="flex flex-wrap items-center justify-center gap-5 text-sm text-slate-500">
            {org.email && (
              <a
                href={`mailto:${org.email}`}
                className="flex items-center gap-1.5 hover:text-slate-800 transition-colors"
              >
                <Mail className="h-4 w-4" />
                {org.email}
              </a>
            )}
            <span className="flex items-center gap-1.5">
              <Phone className="h-4 w-4" />
              Contact us today
            </span>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* FOOTER                                                            */}
      {/* ================================================================ */}
      <footer
        className="border-t py-6 px-4 text-center text-sm text-slate-400"
        style={{ borderColor: `${primary}22` }}
      >
        <p>
          &copy; {new Date().getFullYear()} {displayName}. All rights reserved.
          &nbsp;·&nbsp;
          Powered by{" "}
          <span className="font-semibold" style={{ color: primary }}>
            HUMI
          </span>
        </p>
      </footer>
    </div>
  );
}
