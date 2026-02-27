import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getQuizzesByCourse } from "@/lib/repositories/quiz.repository";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function QuizListPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "student") {
    redirect("/student/login");
  }
  const { courseId } = await params;
  const quizzes = await getQuizzesByCourse(courseId);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-700 text-white px-6 py-4">
        <Link href={`/student/courses/${courseId}`} className="text-blue-200 hover:text-white text-sm">← Course</Link>
        <h1 className="text-xl font-bold mt-1">Quizzes</h1>
      </div>
      <div className="max-w-3xl mx-auto p-6 space-y-4">
        {quizzes.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center text-gray-400">No quizzes available yet.</div>
        ) : quizzes.map((quiz) => (
          <div key={quiz.id} className="bg-white rounded-xl shadow p-6">
            <h2 className="font-semibold text-gray-800 text-lg">{quiz.title}</h2>
            {quiz.description && <p className="text-gray-500 text-sm mt-1">{quiz.description}</p>}
            <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
              <span>{quiz._count.questions} questions</span>
              <span>Pass: {quiz.passingScore}%</span>
            </div>
            <Link href={`/student/courses/${courseId}/quizzes/${quiz.id}`}
              className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
              Take Quiz
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
