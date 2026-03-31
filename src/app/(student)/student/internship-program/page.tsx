import type { Metadata } from "next";
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { InternshipProgram } from "@/components/student/InternshipProgram";
import { GraduationCap } from "lucide-react";

export const metadata: Metadata = {
  title: "Internship Program | Humi Hub Student",
};

export default async function InternshipProgramPage() {
  const session = await getServerSession(authOptions);
  const studentId = (session?.user as { id: string } | undefined)?.id;
  if (!studentId) redirect("/student/login");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-blue-50 rounded-lg p-2">
            <GraduationCap className="h-5 w-5 text-blue-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Internship Program
            </h1>
            <p className="text-sm text-gray-500">
              Apply to internship opportunities matched to your training
            </p>
          </div>
        </div>
      </div>

      {/* Dashboard */}
      <InternshipProgram />
    </div>
  );
}
