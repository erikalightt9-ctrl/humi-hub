import type { Metadata } from "next";
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { StudentForum } from "@/components/student/StudentForum";
import { MessageCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Student Forum | HUMI Student",
};

export default async function ForumPage() {
  const session = await getServerSession(authOptions);
  const studentId = (session?.user as { id: string } | undefined)?.id;
  if (!studentId) redirect("/student/login");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-indigo-100 rounded-lg p-2">
            <MessageCircle className="h-5 w-5 text-indigo-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Student Forum</h1>
            <p className="text-sm text-gray-500">
              Discuss topics, share ideas, and connect with fellow students
            </p>
          </div>
        </div>
      </div>

      {/* Forum Component */}
      <StudentForum />
    </div>
  );
}
