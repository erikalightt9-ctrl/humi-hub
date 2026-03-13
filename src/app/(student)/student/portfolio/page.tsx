import type { Metadata } from "next";
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPortfolioData } from "@/lib/repositories/portfolio.repository";
import { PortfolioPreview } from "@/components/student/PortfolioPreview";
import { PortfolioToggle } from "@/components/student/PortfolioToggle";
import { UserCircle } from "lucide-react";

export const metadata: Metadata = { title: "My Portfolio | HUMI Student" };

export default async function StudentPortfolioPage() {
  const session = await getServerSession(authOptions);
  const studentId = (session?.user as { id: string } | undefined)?.id;
  if (!studentId) redirect("/student/login");

  const portfolio = await getPortfolioData(studentId);
  if (!portfolio) redirect("/student/dashboard");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-blue-100 rounded-lg p-2">
            <UserCircle className="h-5 w-5 text-blue-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Portfolio</h1>
            <p className="text-sm text-gray-500">
              Share your achievements with employers
            </p>
          </div>
        </div>
      </div>

      {/* Visibility Toggle */}
      <PortfolioToggle
        studentId={studentId}
        initialIsPublic={portfolio.isPublic}
      />

      {/* Portfolio Preview */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Portfolio Preview
        </h2>
        <PortfolioPreview
          studentName={portfolio.studentName}
          courseTitle={portfolio.courseTitle}
          courseSlug={portfolio.courseSlug}
          enrolledAt={portfolio.enrolledAt.toISOString()}
          certificates={portfolio.certificates.map((c) => ({
            ...c,
            issuedAt: c.issuedAt.toISOString(),
          }))}
          badges={portfolio.badges.map((b) => ({
            ...b,
            earnedAt: b.earnedAt.toISOString(),
          }))}
          quizScores={portfolio.quizScores}
          assignments={portfolio.assignments}
        />
      </div>
    </div>
  );
}
