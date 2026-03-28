import Link from "next/link";
import { ArrowRight, Clock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CURRENCY_SYMBOLS, type CurrencyCode } from "@/lib/validations/course.schema";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface FeaturedCourse {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly slug: string;
  readonly industry: string | null;
  readonly durationWeeks: number;
  readonly price: { toString(): string };
  readonly currency: string;
}

interface FeaturedCoursesSectionProps {
  readonly courses: readonly FeaturedCourse[];
  readonly courseHrefs: Readonly<Record<string, string>>;
  /** Max number of courses to display (default 3) */
  readonly limit?: number;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function FeaturedCoursesSection({
  courses,
  courseHrefs,
  limit = 3,
}: FeaturedCoursesSectionProps) {
  const featured = courses.slice(0, limit);
  if (featured.length === 0) return null;

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-blue-600 font-semibold text-sm uppercase tracking-wide mb-1">
              Top Picks
            </p>
            <h2 className="text-3xl font-extrabold text-gray-900">
              Featured <span className="text-blue-700">Courses</span>
            </h2>
          </div>
          <Button asChild variant="outline" size="sm" className="hidden sm:flex gap-1">
            <Link href="/programs">
              All Programs <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        {/* Course cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featured.map((course, idx) => {
            const priceNum = parseFloat(course.price.toString());
            const symbol = CURRENCY_SYMBOLS[course.currency as CurrencyCode] ?? "₱";
            const href = courseHrefs[course.slug] ?? "/programs";

            return (
              <div
                key={course.id}
                className="relative rounded-xl border border-gray-200 bg-white hover:shadow-lg transition-all flex flex-col overflow-hidden"
              >
                {/* Featured ribbon for first card */}
                {idx === 0 && (
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center gap-1 bg-amber-400 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-full">
                      <Star className="h-3 w-3 fill-amber-900" /> Featured
                    </span>
                  </div>
                )}

                <div className="p-6 flex flex-col flex-1">
                  {/* Industry tag */}
                  {course.industry && (
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full w-fit mb-3">
                      {course.industry}
                    </span>
                  )}

                  <h3 className="font-bold text-lg text-gray-900 mb-2 leading-snug">
                    {course.title}
                  </h3>

                  <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">
                    {course.description}
                  </p>

                  {/* Meta */}
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {course.durationWeeks} weeks
                    </span>
                    <span className="font-semibold text-gray-800">
                      {symbol}{priceNum.toLocaleString()}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <Link href={href}>Learn More</Link>
                    </Button>
                    <Button asChild size="sm" className="flex-1 bg-blue-700 hover:bg-blue-800">
                      <Link href="/enroll">
                        Enroll <ArrowRight className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile view-all */}
        <div className="text-center mt-8 sm:hidden">
          <Button asChild variant="outline">
            <Link href="/programs">
              View All Programs <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
