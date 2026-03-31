import type { Metadata } from "next";
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AIInsightsDashboard } from "@/components/admin/AIInsightsDashboard";
import { Brain } from "lucide-react";

export const metadata: Metadata = {
  title: "AI Insights | Humi Hub Admin",
};

export default async function AdminAIInsightsPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string })?.role !== "admin") {
    redirect("/portal?tab=admin");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-blue-50 rounded-lg p-2">
            <Brain className="h-5 w-5 text-blue-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              AI Performance Insights
            </h1>
            <p className="text-sm text-gray-500">
              AI-powered analytics and recommendations for your platform
            </p>
          </div>
        </div>
      </div>

      {/* Dashboard */}
      <AIInsightsDashboard />
    </div>
  );
}
