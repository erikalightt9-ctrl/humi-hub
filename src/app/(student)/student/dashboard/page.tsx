import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getStudentPoints, getStudentBadges } from "@/lib/repositories/gamification.repository";
import Link from "next/link";

export default async function StudentDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "student") {
    redirect("/student/login");
  }
  const studentId = (session.user as any).id as string;

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { enrollment: { include: { course: true } } },
  });

  if (!student) redirect("/student/login");

  const [points, badges] = await Promise.all([
    getStudentPoints(studentId),
    getStudentBadges(studentId),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-700 text-white px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">VA Training Center</h1>
        <span className="text-blue-200 text-sm">{student.name}</span>
      </div>
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-1">Welcome back, {student.name}!</h2>
          <p className="text-gray-500">Continue your learning journey</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow p-5 text-center">
            <div className="text-3xl font-bold text-blue-600">{points}</div>
            <div className="text-gray-500 mt-1 text-sm">Total Points</div>
          </div>
          <div className="bg-white rounded-xl shadow p-5 text-center">
            <div className="text-3xl font-bold text-yellow-500">{badges.length}</div>
            <div className="text-gray-500 mt-1 text-sm">Badges Earned</div>
          </div>
          <div className="bg-white rounded-xl shadow p-5 text-center">
            <div className="text-3xl">🎓</div>
            <div className="text-gray-500 mt-1 text-sm">{student.enrollment.course.title}</div>
          </div>
        </div>
        {badges.length > 0 && (
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="font-semibold text-gray-700 mb-3">Your Badges</h3>
            <div className="flex flex-wrap gap-3">
              {badges.map((sb) => (
                <div key={sb.id} className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                  <span className="text-xl">{sb.badge.icon}</span>
                  <div>
                    <div className="text-sm font-medium">{sb.badge.name}</div>
                    <div className="text-xs text-gray-500">{sb.badge.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-semibold text-gray-700 mb-4">Your Course</h3>
          <div className="border rounded-lg p-4 hover:border-blue-300 transition">
            <h4 className="font-medium text-gray-800">{student.enrollment.course.title}</h4>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href={`/student/courses/${student.enrollment.courseId}`}
                className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">
                View Course
              </Link>
              <Link href={`/student/courses/${student.enrollment.courseId}/quizzes`}
                className="text-sm bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50">
                Quizzes
              </Link>
              <Link href={`/student/courses/${student.enrollment.courseId}/forum`}
                className="text-sm bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50">
                Forum
              </Link>
              <Link href={`/student/courses/${student.enrollment.courseId}/assignments`}
                className="text-sm bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50">
                Assignments
              </Link>
              <Link href={`/student/certificates`}
                className="text-sm bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50">
                Certificates
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
