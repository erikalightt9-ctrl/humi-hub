import type { Metadata } from "next";
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AITaskGenerator } from "@/components/student/AITaskGenerator";
import { SubscriptionGate } from "@/components/student/SubscriptionGate";
import { Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "AI Task Generator | HUMI Hub Student",
};

export default async function AITasksPage() {
  const session = await getServerSession(authOptions);
  const studentId = (session?.user as { id: string } | undefined)?.id;
  if (!studentId) redirect("/student/login");

  return (
    <div className="space-y-6">
      <SubscriptionGate>
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-indigo-50 rounded-lg p-2">
              <Zap className="h-5 w-5 text-indigo-700" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                AI Task Generator
              </h1>
              <p className="text-sm text-gray-500">
                Generate unlimited practice tasks tailored to your course
              </p>
            </div>
          </div>
        </div>

        {/* Task Generator */}
        <AITaskGenerator />
      </SubscriptionGate>
    </div>
  );
}
