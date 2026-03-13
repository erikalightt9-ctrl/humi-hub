import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CourseManager } from "@/components/admin/CourseManager";
import { BookOpen } from "lucide-react";

export const metadata: Metadata = { title: "Courses | HUMI Admin" };

export default async function CoursesPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string })?.role !== "admin") {
    redirect("/portal?tab=admin");
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-blue-100 rounded-lg p-2">
            <BookOpen className="h-5 w-5 text-blue-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Course Management
            </h1>
            <p className="text-sm text-gray-500">
              Create, customize, update, or delete courses
            </p>
          </div>
        </div>
      </div>
      <CourseManager />
    </div>
  );
}
