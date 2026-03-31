import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  getPreviewLessonById,
  getCourseCurriculum,
} from "@/lib/repositories/lesson.repository";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Lock,
  BookOpen,
  Play,
  GraduationCap,
  Award,
  Users,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Metadata                                                           */
/* ------------------------------------------------------------------ */

export const metadata: Metadata = { title: "Free Lesson Preview | HUMI Hub" };

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface PageProps {
  params: Promise<{ slug: string; lessonId: string }>;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function slugToEnum(slug: string): string {
  return slug.toUpperCase().replace(/-/g, "_");
}

function enumToSlug(enumVal: string): string {
  return enumVal.toLowerCase().replace(/_/g, "-");
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function LessonPreviewPage({ params }: PageProps) {
  const { slug, lessonId } = await params;
  const courseSlug = slugToEnum(slug);

  // Fetch course and lesson in parallel
  const [course, lesson] = await Promise.all([
    prisma.course.findUnique({ where: { slug: courseSlug as never } }),
    getPreviewLessonById(lessonId),
  ]);

  if (!course || !lesson || lesson.courseId !== course.id) return notFound();

  // Get full curriculum for sidebar
  const curriculum = await getCourseCurriculum(course.id);
  const courseSlugPath = enumToSlug(course.slug);

  return (
    <div className="bg-white min-h-screen">
      {/* Top bar */}
      <div className="bg-blue-900 text-white py-3 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link
            href={`/courses/${courseSlugPath}`}
            className="flex items-center gap-2 text-sm text-blue-200 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {course.title}
          </Link>
          <span className="text-xs bg-orange-500/30 text-orange-200 rounded-full px-3 py-1 font-medium">
            Free Preview
          </span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2">
            {/* Lesson header */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-medium text-orange-600 bg-orange-100 rounded-full px-2.5 py-0.5">
                  Free Lesson
                </span>
                <span className="text-xs text-gray-400">
                  Lesson {lesson.order}
                </span>
                {lesson.durationMin > 0 && (
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {lesson.durationMin} min read
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-extrabold text-gray-900">
                {lesson.title}
              </h1>
            </div>

            {/* Lesson content */}
            <div className="prose prose-gray max-w-none">
              <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8 whitespace-pre-wrap text-gray-700 leading-relaxed">
                {lesson.content}
              </div>
            </div>

            {/* CTA Banner */}
            <div className="mt-8 bg-gradient-to-r from-blue-900 to-blue-700 rounded-2xl p-8 text-white">
              <div className="flex items-start gap-4">
                <div className="bg-white/10 rounded-xl p-3 shrink-0">
                  <GraduationCap className="h-8 w-8" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold mb-2">
                    Enjoying this lesson?
                  </h2>
                  <p className="text-blue-100 text-sm mb-4 max-w-lg">
                    Enroll in {course.title} to unlock all lessons, take quizzes,
                    submit assignments, and earn your official certificate of completion.
                  </p>
                  <div className="flex flex-wrap gap-4 mb-6 text-sm text-blue-200">
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="h-4 w-4" />
                      {curriculum.length} lessons
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Award className="h-4 w-4" />
                      Certificate included
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="h-4 w-4" />
                      Community access
                    </span>
                  </div>
                  <Button
                    asChild
                    size="lg"
                    className="bg-white text-blue-900 font-bold hover:bg-blue-50"
                  >
                    <Link href="/portal?tab=enroll">
                      Enroll Now <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar — Course Curriculum */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
                <h3 className="font-bold text-gray-900 mb-1">
                  Course Curriculum
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  {course.title} · {curriculum.length} lessons
                </p>

                <div className="space-y-1">
                  {curriculum.map((item) => {
                    const isCurrent = item.id === lesson.id;
                    const isFree = item.isFreePreview;

                    return (
                      <div key={item.id}>
                        {isFree ? (
                          <Link
                            href={`/courses/${courseSlugPath}/preview/${item.id}`}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                              isCurrent
                                ? "bg-orange-100 text-orange-800 font-medium"
                                : "hover:bg-gray-100 text-gray-700"
                            }`}
                          >
                            <Play
                              className={`h-3.5 w-3.5 shrink-0 ${
                                isCurrent
                                  ? "text-orange-600"
                                  : "text-orange-700"
                              }`}
                            />
                            <span className="flex-1 truncate">
                              {item.order}. {item.title}
                            </span>
                            {!isCurrent && (
                              <span className="text-[10px] font-medium text-orange-500 bg-orange-50 rounded px-1.5 py-0.5">
                                Free
                              </span>
                            )}
                          </Link>
                        ) : (
                          <div className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-400">
                            <Lock className="h-3.5 w-3.5 shrink-0" />
                            <span className="flex-1 truncate">
                              {item.order}. {item.title}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Enroll CTA */}
                <div className="mt-5 pt-4 border-t border-gray-200">
                  <Button
                    asChild
                    className="w-full bg-blue-700 hover:bg-blue-800"
                  >
                    <Link href="/portal?tab=enroll">
                      Unlock All Lessons
                    </Link>
                  </Button>
                  <p className="text-[11px] text-gray-400 text-center mt-2">
                    ₱{parseFloat(course.price.toString()).toLocaleString()} · {course.durationWeeks}-week program
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
