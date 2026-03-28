import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { AdminAttendancePageClient } from "@/components/admin/AdminAttendancePage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Attendance Analytics | HUMI Admin",
  description: "Course-level attendance analytics for HUMI Training Center",
};

export default async function AdminAttendancePage() {
  const courses = await prisma.course.findMany({
    where: { isActive: true },
    select: { id: true, title: true },
    orderBy: { title: "asc" },
  });

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Attendance Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">
          Course attendance rates, check-in trends, and top students
        </p>
      </div>

      <AdminAttendancePageClient courses={courses} />
    </>
  );
}
