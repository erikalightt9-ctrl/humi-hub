import type { Metadata } from "next";
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ControlTowerDashboard } from "@/components/admin/ControlTowerDashboard";
import { Rocket } from "lucide-react";

export const metadata: Metadata = {
  title: "AI Control Tower | Humi Hub Admin",
};

export default async function AdminControlTowerPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string })?.role !== "admin") {
    redirect("/portal?tab=admin");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-indigo-50 rounded-lg p-2">
            <Rocket className="h-5 w-5 text-indigo-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              AI Control Tower
            </h1>
            <p className="text-sm text-gray-500">
              Predictive analytics and intelligent automation
            </p>
          </div>
        </div>
      </div>

      {/* Dashboard */}
      <ControlTowerDashboard />
    </div>
  );
}
