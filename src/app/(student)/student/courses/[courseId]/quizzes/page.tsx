import { getQuizzesByCourse } from "@/lib/repositories/quiz.repository";
import Link from "next/link";
import { Clock } from "lucide-react";
import { QuizLeaderboard } from "@/components/student/QuizLeaderboard";

export const dynamic = "force-dynamic";

export default async function QuizListPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const quizzes = await getQuizzesByCourse(courseId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quizzes</h1>
        <p className="text-gray-500 text-sm mt-1">Test your knowledge</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quiz list */}
        <div className="lg:col-span-2 space-y-4">
          {quizzes.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
              No quizzes available yet.
            </div>
          ) : (
            quizzes.map((quiz) => (
              <div key={quiz.id} className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="font-semibold text-gray-800 text-lg">{quiz.title}</h2>
                {quiz.description && (
                  <p className="text-gray-500 text-sm mt-1">{quiz.description}</p>
                )}
                <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                  <span>{quiz._count.questions} questions</span>
                  <span>Pass: {quiz.passingScore}%</span>
                  {(quiz as { duration?: number | null }).duration && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {(quiz as { duration?: number | null }).duration} min
                    </span>
                  )}
                </div>
                <Link
                  href={`/student/courses/${courseId}/quizzes/${quiz.id}`}
                  className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
                >
                  Take Quiz
                </Link>
              </div>
            ))
          )}
        </div>

        {/* Leaderboard sidebar */}
        <div className="lg:col-span-1">
          <QuizLeaderboard courseId={courseId} />
        </div>
      </div>
    </div>
  );
}
