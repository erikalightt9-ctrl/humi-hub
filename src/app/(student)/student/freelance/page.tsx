import type { Metadata } from "next";
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FreelanceOpportunities } from "@/components/student/FreelanceOpportunities";
import { Briefcase } from "lucide-react";

export const metadata: Metadata = {
  title: "Freelance Opportunities | Humi Hub Student",
};

export default async function FreelancePage() {
  const session = await getServerSession(authOptions);
  const studentId = (session?.user as { id: string } | undefined)?.id;
  if (!studentId) redirect("/student/login");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-green-100 rounded-lg p-2">
            <Briefcase className="h-5 w-5 text-green-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Freelance Opportunities
            </h1>
            <p className="text-sm text-gray-500">
              Find freelance gigs and start building your VA career
            </p>
          </div>
        </div>
      </div>

      {/* Dashboard */}
      <FreelanceOpportunities />
    </div>
  );
}
