import type { Metadata } from "next";
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AISimulator } from "@/components/student/AISimulator";
import { SubscriptionGate } from "@/components/student/SubscriptionGate";
import { Users } from "lucide-react";

export const metadata: Metadata = {
  title: "AI VA Simulator | Humi Hub Student",
};

export default async function AISimulatorPage() {
  const session = await getServerSession(authOptions);
  const studentId = (session?.user as { id: string } | undefined)?.id;
  if (!studentId) redirect("/student/login");

  return (
    <div className="space-y-6">
      <SubscriptionGate>
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-50 rounded-lg p-2">
              <Users className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                AI VA Simulator
              </h1>
              <p className="text-sm text-gray-500">
                Practice handling realistic client scenarios with AI-powered
                virtual clients
              </p>
            </div>
          </div>
        </div>

        {/* Simulator */}
        <AISimulator />
      </SubscriptionGate>
    </div>
  );
}
