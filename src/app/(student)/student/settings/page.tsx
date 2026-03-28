import type { Metadata } from "next";
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Settings } from "lucide-react";
import { SettingsPanel } from "@/components/student/SettingsPanel";

export const metadata: Metadata = { title: "Settings | HUMI Student" };

export default async function StudentSettingsPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id: string; role: string } | undefined;

  if (!user || user.role !== "student") {
    redirect("/student/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-blue-900/40 rounded-lg p-2">
            <Settings className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-ds-text">Settings</h1>
            <p className="text-sm text-ds-muted">
              Manage your account preferences
            </p>
          </div>
        </div>
      </div>

      <SettingsPanel />
    </div>
  );
}
