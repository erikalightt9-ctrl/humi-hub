import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPortfolioData } from "@/lib/repositories/portfolio.repository";
import { PortfolioPreview } from "@/components/student/PortfolioPreview";
import { GraduationCap } from "lucide-react";
import Link from "next/link";

interface PageProps {
  readonly params: Promise<{ studentId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { studentId } = await params;
  const data = await getPortfolioData(studentId);

  if (!data || !data.isPublic) {
    return { title: "Portfolio Not Found" };
  }

  return {
    title: `${data.studentName} — VA Training Center Graduate`,
    description: `View ${data.studentName}'s portfolio and achievements from the ${data.courseTitle} program at VA Training Center.`,
  };
}

export default async function PublicPortfolioPage({ params }: PageProps) {
  const { studentId } = await params;
  const data = await getPortfolioData(studentId);

  if (!data || !data.isPublic) {
    notFound();
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Mini header */}
      <div className="bg-gray-50 border-b border-gray-200 py-4 px-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-blue-900">
            <GraduationCap className="h-5 w-5 text-blue-600" />
            VA Training Center
          </Link>
          <span className="text-xs text-gray-400">Verified Graduate Portfolio</span>
        </div>
      </div>

      {/* Portfolio Content */}
      <div className="max-w-3xl mx-auto px-4 py-10">
        <PortfolioPreview
          studentName={data.studentName}
          courseTitle={data.courseTitle}
          courseSlug={data.courseSlug}
          enrolledAt={data.enrolledAt.toISOString()}
          certificates={data.certificates.map((c) => ({
            ...c,
            issuedAt: c.issuedAt.toISOString(),
          }))}
          badges={data.badges.map((b) => ({
            ...b,
            earnedAt: b.earnedAt.toISOString(),
          }))}
          quizScores={data.quizScores}
          assignments={data.assignments}
        />
      </div>

      {/* CTA */}
      <div className="bg-blue-50 py-8 px-4 text-center">
        <p className="text-gray-600 text-sm mb-2">
          Want to become an AI-powered Virtual Assistant?
        </p>
        <Link
          href="/enroll"
          className="inline-block bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-blue-800 transition-colors text-sm"
        >
          Enroll at VA Training Center
        </Link>
      </div>
    </div>
  );
}
