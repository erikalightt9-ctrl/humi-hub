import Link from "next/link";
import {
  Stethoscope,
  Home,
  Calculator,
  Scale,
  Monitor,
  ShoppingCart,
  Building2,
  Headphones,
  GraduationCap,
  ArrowRight,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CURRENCY_SYMBOLS, type CurrencyCode } from "@/lib/validations/course.schema";
import type { LucideIcon } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Slug → theme mapping                                               */
/* ------------------------------------------------------------------ */

interface IndustryTheme {
  readonly icon: LucideIcon;
  readonly color: string;
  readonly iconBg: string;
  readonly iconColor: string;
  readonly tag: string;
}

/** Map a course slug to an industry look & feel */
function getThemeForSlug(slug: string): IndustryTheme {
  const s = slug.toUpperCase();

  if (s.includes("MEDICAL") || s.includes("HEALTH"))
    return {
      icon: Stethoscope,
      color: "bg-red-50 border-red-100 hover:border-red-200",
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      tag: "Healthcare",
    };

  if (s.includes("REAL_ESTATE") || s.includes("REALESTATE"))
    return {
      icon: Home,
      color: "bg-emerald-50 border-emerald-100 hover:border-emerald-200",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      tag: "Real Estate",
    };

  if (s.includes("BOOKKEEPING") || s.includes("FINANCE") || s.includes("ACCOUNTING"))
    return {
      icon: Calculator,
      color: "bg-blue-50 border-blue-100 hover:border-blue-200",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      tag: "Finance",
    };

  if (s.includes("LEGAL") || s.includes("COMPLIANCE"))
    return {
      icon: Scale,
      color: "bg-purple-50 border-purple-100 hover:border-purple-200",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      tag: "Legal",
    };

  if (s.includes("TECH") || s.includes("IT") || s.includes("SOFTWARE"))
    return {
      icon: Monitor,
      color: "bg-cyan-50 border-cyan-100 hover:border-cyan-200",
      iconBg: "bg-cyan-100",
      iconColor: "text-cyan-600",
      tag: "Technology",
    };

  if (s.includes("ECOMMERCE") || s.includes("COMMERCE") || s.includes("RETAIL"))
    return {
      icon: ShoppingCart,
      color: "bg-amber-50 border-amber-100 hover:border-amber-200",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      tag: "E-Commerce",
    };

  if (s.includes("EXECUTIVE") || s.includes("BUSINESS"))
    return {
      icon: Building2,
      color: "bg-slate-50 border-slate-100 hover:border-slate-200",
      iconBg: "bg-slate-100",
      iconColor: "text-slate-600",
      tag: "Business",
    };

  if (s.includes("CUSTOMER") || s.includes("SUPPORT"))
    return {
      icon: Headphones,
      color: "bg-pink-50 border-pink-100 hover:border-pink-200",
      iconBg: "bg-pink-100",
      iconColor: "text-pink-600",
      tag: "Customer Success",
    };

  // Fallback
  return {
    icon: GraduationCap,
    color: "bg-gray-50 border-gray-100 hover:border-gray-200",
    iconBg: "bg-gray-100",
    iconColor: "text-gray-600",
    tag: "Professional",
  };
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ProgramCourse {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly slug: string;
  readonly durationWeeks: number;
  readonly price: { toString(): string };
  readonly currency: string;
}

interface IndustryProgramsSectionProps {
  readonly courses: readonly ProgramCourse[];
  readonly courseHrefs: Readonly<Record<string, string>>;
}

/* ------------------------------------------------------------------ */
/*  IndustryProgramsSection                                            */
/* ------------------------------------------------------------------ */

export function IndustryProgramsSection({
  courses,
  courseHrefs,
}: IndustryProgramsSectionProps) {
  /* Choose grid columns based on course count */
  const gridCols =
    courses.length <= 2
      ? "lg:grid-cols-2"
      : courses.length === 3
        ? "lg:grid-cols-3"
        : "lg:grid-cols-4";

  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-blue-600 font-semibold text-sm uppercase tracking-wide mb-2">
            Industry-Specific Training
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
            Programs Designed for{" "}
            <span className="text-blue-700">Every Industry</span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Choose from specialized training programs aligned with global
            industry standards. Each program combines technical expertise with
            practical, hands-on experience.
          </p>
        </div>

        {/* Program Cards */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${gridCols} gap-6`}>
          {courses.map((course) => {
            const theme = getThemeForSlug(course.slug);
            const Icon = theme.icon;
            const priceNum = parseFloat(course.price.toString());
            const symbol =
              CURRENCY_SYMBOLS[course.currency as CurrencyCode] ?? "₱";
            const href = courseHrefs[course.slug] ?? "/programs";

            return (
              <div
                key={course.id}
                className={`rounded-xl border p-6 ${theme.color} hover:shadow-lg transition-all group flex flex-col`}
              >
                {/* Icon + Tag */}
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center ${theme.iconBg}`}
                  >
                    <Icon className={`h-6 w-6 ${theme.iconColor}`} />
                  </div>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${theme.iconBg} ${theme.iconColor}`}
                  >
                    {theme.tag}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-bold text-lg text-gray-900 mb-2 leading-snug">
                  {course.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-gray-600 leading-relaxed mb-4 flex-1 line-clamp-3">
                  {course.description}
                </p>

                {/* Meta: duration + price */}
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-5">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {course.durationWeeks} weeks
                  </span>
                  <span className="font-semibold text-gray-700">
                    {symbol}
                    {priceNum.toLocaleString()}
                  </span>
                </div>

                {/* CTAs */}
                <div className="flex gap-2">
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="flex-1"
                  >
                    <Link href={href}>Learn More</Link>
                  </Button>
                  <Button
                    asChild
                    size="sm"
                    className="flex-1 bg-blue-700 hover:bg-blue-800"
                  >
                    <Link href="/enroll">
                      Enroll <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Button
            asChild
            variant="outline"
            size="lg"
            className="font-semibold"
          >
            <Link href="/programs">
              View All Programs <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
