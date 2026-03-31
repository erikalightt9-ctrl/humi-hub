import type { Metadata } from "next";
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TrainerManager } from "@/components/admin/TrainerManager";
import { getAllTierConfigs } from "@/lib/repositories/trainer-tier.repository";
import { UserCog } from "lucide-react";

export const metadata: Metadata = {
  title: "Trainers | Humi Hub Admin",
};

export default async function TrainersPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string })?.role !== "admin") {
    redirect("/portal?tab=admin");
  }

  let rawConfigs: Awaited<ReturnType<typeof getAllTierConfigs>> = [];
  try {
    rawConfigs = await getAllTierConfigs();
  } catch (err) {
    console.error("[TrainersPage] Failed to load tier configs:", err);
  }

  // Serialize Decimal fields → plain numbers so they can cross the RSC boundary
  // into the "use client" TrainerManager component.
  const tierConfigs = rawConfigs.map((c) => ({
    ...c,
    upgradeFee:       Number(c.upgradeFee),
    baseProgramPrice: Number(c.baseProgramPrice),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="bg-blue-50 rounded-xl p-2.5">
          <UserCog className="h-5 w-5 text-blue-700" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-ds-text">Trainer Management</h1>
          <p className="text-sm text-ds-muted">Manage trainers and instructor assignments</p>
        </div>
      </div>

      <TrainerManager tierConfigs={tierConfigs as never} />
    </div>
  );
}
