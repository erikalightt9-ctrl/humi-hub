import type { Metadata } from "next";
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SkillVerification } from "@/components/student/SkillVerification";
import { ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Skill Verification | VA Student",
};

export default async function SkillVerificationPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string })?.role !== "student") {
    redirect("/student/login");
  }

  const studentId = (session.user as { id: string }).id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-blue-100 rounded-lg p-2">
            <ShieldCheck className="h-5 w-5 text-blue-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Skill Verification
            </h1>
            <p className="text-sm text-gray-500">
              Auto-verified skills based on your performance across all training
              activities
            </p>
          </div>
        </div>
      </div>

      {/* Skill Verification Component */}
      <SkillVerification studentId={studentId} />
    </div>
  );
}
