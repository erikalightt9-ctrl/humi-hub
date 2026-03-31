import type { Metadata } from "next";
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getStudentSkillData } from "@/lib/repositories/skill-tree.repository";
import { SkillTreeVisualization } from "@/components/student/SkillTreeVisualization";
import { TreePine } from "lucide-react";

export const metadata: Metadata = {
  title: "Skill Tree | Humi Hub Student",
};

export default async function SkillTreePage() {
  const session = await getServerSession(authOptions);
  const studentId = (session?.user as { id: string } | undefined)?.id;
  if (!studentId) redirect("/student/login");

  const skillData = await getStudentSkillData(studentId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-blue-50 rounded-lg p-2">
            <TreePine className="h-5 w-5 text-blue-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Skill Tree</h1>
            <p className="text-sm text-gray-500">
              Track your growth across core competencies
            </p>
          </div>
        </div>
      </div>

      {/* Skill Tree Visualization */}
      <SkillTreeVisualization initialData={skillData} />
    </div>
  );
}
