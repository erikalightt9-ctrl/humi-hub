import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CourseManager } from "@/components/admin/CourseManager";
import { BookOpen, ChevronRight } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "All Courses | HUMI Hub Admin" };

export default async function CourseListPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string })?.role !== "admin") {
    redirect("/portal?tab=admin");
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-500">
        <Link href="/admin/courses" className="hover:text-blue-700 transition-colors">
          Courses
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-gray-900 font-medium">All Courses</span>
      </nav>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="bg-blue-50 rounded-lg p-2">
          <BookOpen className="h-5 w-5 text-blue-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Course Management</h1>
          <p className="text-sm text-gray-500">Create, customize, update, or delete courses.</p>
        </div>
      </div>

      <CourseManager />
    </div>
  );
}
