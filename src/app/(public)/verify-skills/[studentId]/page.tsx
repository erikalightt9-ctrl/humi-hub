import type { Metadata } from "next";
import { SkillVerificationBadge } from "@/components/public/SkillVerificationBadge";

interface PageProps {
  readonly params: Promise<{ studentId: string }>;
}

export const metadata: Metadata = {
  title: "Verified Skills | HUMI Training Center",
  description:
    "View verified skill levels for a HUMI Training Center student, auto-assessed across communication, technical, and professional dimensions.",
};

export default async function VerifySkillsPage({ params }: PageProps) {
  const { studentId } = await params;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <SkillVerificationBadge studentId={studentId} />
      </div>
    </div>
  );
}
