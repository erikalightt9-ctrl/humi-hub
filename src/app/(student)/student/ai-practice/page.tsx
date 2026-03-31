import type { Metadata } from "next";
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAIPracticeData } from "@/lib/constants/ai-practice-scenarios";
import { AIPracticeScenarioCard } from "@/components/student/AIPracticeScenarioCard";
import { Bot, FileText, Calendar, Shield, MessageCircle, Home, Users, TrendingUp, ClipboardList, Database, Receipt, Building, Tags, BarChart, ArrowLeftRight } from "lucide-react";

export const metadata: Metadata = { title: "AI Practice | Humi Hub Student" };

/* Map icon string names to Lucide components */
const ICON_MAP: Record<string, typeof Bot> = {
  FileText,
  Calendar,
  Shield,
  MessageCircle,
  Home,
  Users,
  TrendingUp,
  ClipboardList,
  Database,
  Receipt,
  Building,
  Tags,
  BarChart,
  ArrowLeftRight,
};

export default async function AIPracticePage() {
  const session = await getServerSession(authOptions);
  const studentId = (session?.user as { id: string } | undefined)?.id;
  if (!studentId) redirect("/student/login");

  /* Resolve the student's course slug */
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      enrollment: {
        select: {
          course: { select: { slug: true, title: true } },
        },
      },
    },
  });

  const courseSlug = student?.enrollment?.course?.slug;
  const courseTitle = student?.enrollment?.course?.title ?? "Your Course";
  const practiceData = courseSlug ? getAIPracticeData(courseSlug) : null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-blue-50 rounded-lg p-2">
            <Bot className="h-5 w-5 text-blue-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Practice</h1>
            <p className="text-sm text-gray-500">{courseTitle}</p>
          </div>
        </div>
        <p className="text-gray-600 text-sm mt-3 max-w-2xl">
          Practice using AI tools with real-world scenarios from your course. Copy the sample prompts,
          use them with any AI tool (ChatGPT, Claude, etc.), and compare your results with the expected output format.
          Remember: <strong>AI drafts, you verify and deliver.</strong>
        </p>
      </div>

      {/* Scenarios */}
      {!practiceData ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <div className="text-5xl mb-4">{"\uD83E\uDD16"}</div>
          <p className="text-gray-500">No practice scenarios available for your course yet. Check back soon!</p>
        </div>
      ) : (
        practiceData.categories.map((category) => {
          const IconComponent = ICON_MAP[category.icon] ?? Bot;

          return (
            <section key={category.name}>
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-gray-100 rounded-lg p-1.5">
                  <IconComponent className="h-4 w-4 text-gray-700" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">{category.name}</h2>
                <span className="text-xs text-gray-400 ml-1">
                  {category.scenarios.length} scenario{category.scenarios.length > 1 ? "s" : ""}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {category.scenarios.map((scenario) => (
                  <AIPracticeScenarioCard
                    key={scenario.id}
                    title={scenario.title}
                    description={scenario.description}
                    samplePrompt={scenario.samplePrompt}
                    expectedOutputFormat={scenario.expectedOutputFormat}
                  />
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
