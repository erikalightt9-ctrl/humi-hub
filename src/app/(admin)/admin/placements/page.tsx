import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { PlacementManager } from "@/components/admin/PlacementManager";
import { Briefcase } from "lucide-react";

export const metadata: Metadata = {
  title: "Placements | HUMI Hub Admin",
};

export default async function PlacementsPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string })?.role !== "admin") {
    redirect("/portal?tab=admin");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-green-100 rounded-xl p-2.5">
            <Briefcase className="h-6 w-6 text-green-700" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Job Placements</h1>
            <p className="text-sm text-gray-500">
              Track graduates who have been placed in jobs and measure your placement success rate
            </p>
          </div>
        </div>
      </div>

      <PlacementManager />
    </div>
  );
}
