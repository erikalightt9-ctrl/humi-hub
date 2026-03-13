import type { Metadata } from "next";
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AIInterviewSimulator } from "@/components/student/AIInterviewSimulator";
import { SubscriptionGate } from "@/components/student/SubscriptionGate";
import { Mic } from "lucide-react";

export const metadata: Metadata = {
  title: "AI Mock Interviews | HUMI Student",
};

export default async function AIInterviewsPage() {
  const session = await getServerSession(authOptions);
  const studentId = (session?.user as { id: string } | undefined)?.id;
  if (!studentId) redirect("/student/login");

  return (
    <div className="space-y-6">
      <SubscriptionGate>
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-purple-100 rounded-lg p-2">
              <Mic className="h-5 w-5 text-purple-700" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                AI Mock Interviews
              </h1>
              <p className="text-sm text-gray-500">
                Practice client interviews with AI-powered interviewers
              </p>
            </div>
          </div>
        </div>

        {/* Simulator */}
        <AIInterviewSimulator />
      </SubscriptionGate>
    </div>
  );
}
