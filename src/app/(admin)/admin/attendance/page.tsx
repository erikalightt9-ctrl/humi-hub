import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { AdminAttendancePageClient } from "@/components/admin/AdminAttendancePage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Attendance Analytics | HUMI Hub Admin",
  description: "Course-level attendance analytics for HUMI Hub",
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
        <h1 className="text-2xl font-bold text-ds-text">Attendance Analytics</h1>
        <p className="text-ds-muted text-sm mt-1">
          Course attendance rates, check-in trends, and top students
        </p>
      </div>

      <AdminAttendancePageClient courses={courses} />
    </>
  );
}
