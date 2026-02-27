import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getLeaderboard } from "@/lib/repositories/gamification.repository";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "student") {
    redirect("/student/login");
  }
  const { courseId } = await params;
  const leaderboard = await getLeaderboard(courseId);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-700 text-white px-6 py-4">
        <Link href={`/student/courses/${courseId}`} className="text-blue-200 hover:text-white text-sm">← Course</Link>
        <h1 className="text-xl font-bold mt-1">Leaderboard 🏆</h1>
      </div>
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Student</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leaderboard.length === 0 ? (
                <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-400">No rankings yet</td></tr>
              ) : leaderboard.map((entry) => (
                <tr key={entry.studentId} className={entry.rank <= 3 ? "bg-yellow-50" : ""}>
                  <td className="px-6 py-4 text-sm font-bold text-gray-700">
                    {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : `#${entry.rank}`}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800">{entry.name}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-blue-600 text-right">{entry.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
