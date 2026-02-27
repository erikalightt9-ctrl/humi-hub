import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getLessonsByCourse, getCourseProgress, getCompletedLessonIds } from "@/lib/repositories/lesson.repository";
import { getQuizzesByCourse } from "@/lib/repositories/quiz.repository";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CourseOverviewPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "student") {
    redirect("/student/login");
  }
  const studentId = (session.user as any).id as string;
  const { courseId } = await params;

  const [course, lessons, progress, completedIds, quizzes] = await Promise.all([
    prisma.course.findUnique({ where: { id: courseId } }),
    getLessonsByCourse(courseId),
    getCourseProgress(studentId, courseId),
    getCompletedLessonIds(studentId, courseId),
    getQuizzesByCourse(courseId),
  ]);

  if (!course) redirect("/student/dashboard");
  const completedSet = new Set(completedIds);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-700 text-white px-6 py-4">
        <Link href="/student/dashboard" className="text-blue-200 hover:text-white text-sm">← Dashboard</Link>
        <h1 className="text-xl font-bold mt-1">{course.title}</h1>
      </div>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Progress</span>
            <span className="text-sm font-bold text-blue-600">{progress.percent}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div className="bg-blue-600 h-3 rounded-full transition-all" style={{ width: `${progress.percent}%` }} />
          </div>
          <p className="text-xs text-gray-500 mt-1">{progress.completed} of {progress.total} lessons completed</p>
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-semibold text-gray-700 mb-4">Lessons</h2>
          {lessons.length === 0 ? (
            <p className="text-gray-400 text-sm">No lessons published yet.</p>
          ) : (
            <div className="space-y-2">
              {lessons.map((lesson, idx) => (
                <Link key={lesson.id} href={`/student/courses/${courseId}/lessons/${lesson.id}`}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:border-blue-300 hover:bg-blue-50 transition">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${completedSet.has(lesson.id) ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {completedSet.has(lesson.id) ? "✓" : idx + 1}
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
        {quizzes.length > 0 && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="font-semibold text-gray-700 mb-3">Quizzes</h2>
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link href={`/student/courses/${courseId}/forum`} className="bg-white rounded-xl shadow p-4 text-center hover:shadow-md transition">
            <div className="text-2xl mb-1">💬</div>
            <div className="text-sm font-medium">Forum</div>
          </Link>
          <Link href={`/student/courses/${courseId}/assignments`} className="bg-white rounded-xl shadow p-4 text-center hover:shadow-md transition">
            <div className="text-2xl mb-1">📝</div>
            <div className="text-sm font-medium">Assignments</div>
          </Link>
          <Link href={`/student/courses/${courseId}/leaderboard`} className="bg-white rounded-xl shadow p-4 text-center hover:shadow-md transition">
            <div className="text-2xl mb-1">🏆</div>
            <div className="text-sm font-medium">Leaderboard</div>
          </Link>
          <Link href={`/student/certificates`} className="bg-white rounded-xl shadow p-4 text-center hover:shadow-md transition">
            <div className="text-2xl mb-1">🎓</div>
            <div className="text-sm font-medium">Certificates</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
