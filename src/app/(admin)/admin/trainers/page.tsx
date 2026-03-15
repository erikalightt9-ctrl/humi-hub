import type { Metadata } from "next";
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TrainerManager } from "@/components/admin/TrainerManager";
import { getAllTierConfigs } from "@/lib/repositories/trainer-tier.repository";
import { UserCog } from "lucide-react";

export const metadata: Metadata = {
  title: "Trainers | HUMI Admin",
};

export default async function TrainersPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string })?.role !== "admin") {
    redirect("/portal?tab=admin");
  }

  const tierConfigs = await getAllTierConfigs();

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-blue-100 rounded-lg p-2">
            <UserCog className="h-5 w-5 text-blue-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Trainer Management
            </h1>
            <p className="text-sm text-gray-500">
              Manage trainers and instructor assignments
            </p>
          </div>
        </div>
      </div>

      <TrainerManager tierConfigs={tierConfigs} />
    </div>
  );
}
