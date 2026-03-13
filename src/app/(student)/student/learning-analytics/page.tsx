import type { Metadata } from "next";
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getStudentAnalytics } from "@/lib/repositories/learning-analytics.repository";
import { LearningAnalytics } from "@/components/student/LearningAnalytics";
import { BarChart3 } from "lucide-react";

export const metadata: Metadata = {
  title: "Learning Analytics | HUMI Student",
};

export default async function LearningAnalyticsPage() {
  const session = await getServerSession(authOptions);
  const studentId = (session?.user as { id: string } | undefined)?.id;
  if (!studentId) redirect("/student/login");

  const analytics = await getStudentAnalytics(studentId);
  if (!analytics) redirect("/student/dashboard");

  /* Serialize dates for the client component */
  const serialized = {
    ...analytics,
    recentActivity: analytics.recentActivity.map((a) => ({
      ...a,
      timestamp: a.timestamp.toISOString(),
    })),
    quizScores: analytics.quizScores.map((q) => ({
      ...q,
      completedAt: q.completedAt.toISOString(),
    })),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-blue-100 rounded-lg p-2">
            <BarChart3 className="h-5 w-5 text-blue-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Learning Analytics
            </h1>
            <p className="text-sm text-gray-500">
              Track your progress and performance
            </p>
          </div>
        </div>
      </div>

      <LearningAnalytics data={serialized} />
    </div>
  );
}
