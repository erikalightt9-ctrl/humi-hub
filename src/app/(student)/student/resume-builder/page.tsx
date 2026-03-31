import type { Metadata } from "next";
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ResumeBuilder } from "@/components/student/ResumeBuilder";
import { FileText } from "lucide-react";

export const metadata: Metadata = { title: "Resume Builder | HUMI Hub Student" };

export default async function ResumeBuilderPage() {
  const session = await getServerSession(authOptions);
  const studentId = (session?.user as { id: string } | undefined)?.id;
  if (!studentId) redirect("/student/login");

  const [student, subscription] = await Promise.all([
    prisma.student.findUnique({
      where: { id: studentId },
      include: {
        enrollment: {
          include: { course: { select: { title: true } } },
        },
        certificates: {
          include: { course: { select: { title: true } } },
        },
      },
    }),
    prisma.subscription.findFirst({
      where: { studentId, status: "ACTIVE" },
      select: { id: true },
    }),
  ]);

  if (!student) redirect("/student/login");

  const technicalSkills = student.enrollment.technicalSkills ?? [];
  const certifications = student.certificates.map((c) => ({
    title: c.course.title,
    certNumber: c.certNumber,
    issuedAt: c.issuedAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-blue-50 rounded-lg p-2">
            <FileText className="h-5 w-5 text-blue-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Resume Builder</h1>
            <p className="text-sm text-gray-500">
              Create a professional resume from your training data
            </p>
          </div>
        </div>
      </div>

      <ResumeBuilder
        initialName={student.name}
        initialEmail={student.email}
        initialSkills={technicalSkills}
        initialCertifications={certifications}
        courseTitle={student.enrollment.course.title}
        hasSubscription={!!subscription}
      />
    </div>
  );
}
