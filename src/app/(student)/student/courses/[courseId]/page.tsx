import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  getLessonsByCourse,
  getLessonsByCourseTier,
  getCourseProgress,
  getCourseProgressByTier,
  getCompletedLessonIds,
} from "@/lib/repositories/lesson.repository";
import { getQuizzesByCourse } from "@/lib/repositories/quiz.repository";
import { prisma } from "@/lib/prisma";
import { COURSE_TIER_LABELS, COURSE_TIER_COLORS } from "@/lib/constants/course-tiers";
import type { CourseTier } from "@prisma/client";
import Link from "next/link";
import { CourseAttendanceButtons } from "@/components/student/CourseAttendanceButtons";

export const dynamic = "force-dynamic";

export default async function CourseOverviewPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const session = await getServerSession(authOptions);
  const studentId = (session?.user as { id: string } | undefined)?.id;
  if (!studentId) redirect("/student/login");

  const { courseId } = await params;

  // Fetch student's enrolled tier
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { courseTier: true },
  });

  const studentTier: CourseTier | null = student?.courseTier ?? null;

  const [course, lessons, progress, completedIds, quizzes] = await Promise.all([
    prisma.course.findUnique({ where: { id: courseId } }),
    studentTier
      ? getLessonsByCourseTier(courseId, studentTier)
      : getLessonsByCourse(courseId),
    studentTier
      ? getCourseProgressByTier(studentId, courseId, studentTier)
      : getCourseProgress(studentId, courseId),
    getCompletedLessonIds(studentId, courseId),
    getQuizzesByCourse(courseId),
  ]);

  if (!course) redirect("/student/dashboard");
  const completedSet = new Set(completedIds);

  const tierColors = studentTier ? COURSE_TIER_COLORS[studentTier] : null;
  const tierLabel = studentTier ? COURSE_TIER_LABELS[studentTier] : null;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
          {tierLabel && tierColors && (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${tierColors.bg} ${tierColors.text}`}
            >
              {tierLabel} Tier
            </span>
          )}
        </div>
        <p className="text-gray-500 text-sm mt-1">{course.description}</p>
      </div>

      {/* Attendance */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">Attendance</h2>
        </div>
        <CourseAttendanceButtons courseId={courseId} />
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">Progress</span>
          <span className="text-sm font-bold text-blue-600">{progress.percent}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div className="bg-blue-600 h-3 rounded-full transition-all" style={{ width: `${progress.percent}%` }} />
        </div>
        <p className="text-xs text-gray-500 mt-1">{progress.completed} of {progress.total} lessons completed</p>
      </div>

      {/* Lessons */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Lessons</h2>
        {lessons.length === 0 ? (
          <p className="text-gray-400 text-sm">No lessons published yet.</p>
        ) : (
          <div className="space-y-2">
            {lessons.map((lesson, idx) => (
              <Link key={lesson.id} href={`/student/courses/${courseId}/lessons/${lesson.id}`}
                className="flex items-center gap-3 p-3 border rounded-lg hover:border-blue-300 hover:bg-blue-50 transition">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${completedSet.has(lesson.id) ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {completedSet.has(lesson.id) ? "\u2713" : idx + 1}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-800">{lesson.title}</div>
                  {lesson.durationMin > 0 && <div className="text-xs text-gray-400">{lesson.durationMin} min</div>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quizzes */}
      {quizzes.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-3">Quizzes</h2>
          <div className="space-y-2">
            {quizzes.map((quiz) => (
              <Link key={quiz.id} href={`/student/courses/${courseId}/quizzes/${quiz.id}`}
                className="flex items-center justify-between p-3 border rounded-lg hover:border-blue-300 transition">
                <span className="text-sm font-medium">{quiz.title}</span>
                <span className="text-xs text-gray-400">{quiz._count.questions} questions</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
