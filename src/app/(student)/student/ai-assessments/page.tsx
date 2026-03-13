import type { Metadata } from "next";
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AIAssessmentCard } from "@/components/student/AIAssessmentCard";
import { SubscriptionGate } from "@/components/student/SubscriptionGate";
import { Sparkles } from "lucide-react";
import type { AIAssessmentResult } from "@/lib/types/ai.types";

export const metadata: Metadata = {
  title: "AI Review | HUMI Student",
};

export default async function AIAssessmentsPage() {
  const session = await getServerSession(authOptions);
  const studentId = (session?.user as { id: string } | undefined)?.id;
  if (!studentId) redirect("/student/login");

  // Get student's enrollment to know courseId
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      enrollment: {
        select: { courseId: true },
      },
    },
  });

  if (!student) redirect("/student/dashboard");

  // Get all submissions for this student's course
  const submissions = await prisma.submission.findMany({
    where: {
      studentId,
      assignment: { courseId: student.enrollment.courseId },
    },
    include: {
      assignment: {
        select: { title: true, maxPoints: true },
      },
    },
    orderBy: { submittedAt: "desc" },
  });

  const submissionData = submissions.map((s) => ({
    id: s.id,
    assignmentTitle: s.assignment.title,
    fileName: s.fileName,
    status: s.status,
    grade: s.grade,
    maxPoints: s.assignment.maxPoints,
    submittedAt: s.submittedAt.toISOString(),
    aiEvaluation: s.aiEvaluation
      ? (s.aiEvaluation as unknown as AIAssessmentResult)
      : null,
    aiEvaluatedAt: s.aiEvaluatedAt?.toISOString() ?? null,
  }));

  return (
    <div className="space-y-6">
      <SubscriptionGate>
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-purple-100 rounded-lg p-2">
              <Sparkles className="h-5 w-5 text-purple-700" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Review</h1>
              <p className="text-sm text-gray-500">
                Get AI-powered feedback on your assignment submissions
              </p>
            </div>
          </div>
        </div>

        {/* Submissions list */}
        {submissionData.length > 0 ? (
          <div className="space-y-4">
            {submissionData.map((sub) => (
              <AIAssessmentCard key={sub.id} submission={sub} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
            <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-purple-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              No Submissions Yet
            </h2>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Submit your assignments to get AI-powered feedback and skill
              assessments. Each submission can be reviewed by our AI to help you
              improve.
            </p>
          </div>
        )}
      </SubscriptionGate>
    </div>
  );
}
