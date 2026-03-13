import type { Metadata } from "next";
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AIFeedbackDashboard } from "@/components/student/AIFeedbackDashboard";
import { SubscriptionGate } from "@/components/student/SubscriptionGate";
import { BarChart2 } from "lucide-react";

export const metadata: Metadata = {
  title: "AI Feedback Engine | HUMI Student",
};

export default async function AIFeedbackEnginePage() {
  const session = await getServerSession(authOptions);
  const studentId = (session?.user as { id: string } | undefined)?.id;
  if (!studentId) redirect("/student/login");

  return (
    <div className="space-y-6">
      <SubscriptionGate>
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-indigo-100 rounded-lg p-2">
              <BarChart2 className="h-5 w-5 text-indigo-700" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                AI Feedback Engine
              </h1>
              <p className="text-sm text-gray-500">
                Your unified AI performance dashboard
              </p>
            </div>
          </div>
        </div>

        {/* Dashboard */}
        <AIFeedbackDashboard />
      </SubscriptionGate>
    </div>
  );
}
