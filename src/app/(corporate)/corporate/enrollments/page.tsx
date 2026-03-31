import type { Metadata } from "next";
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Enrollments | HUMI Hub Corporate",
};

export default async function CorporateEnrollmentsPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: string; organizationId?: string } | undefined;

  if (!user || user.role !== "corporate" || !user.organizationId) {
    redirect("/corporate/login");
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { organizationId: user.organizationId },
    select: {
      id: true,
      status: true,
      courseTier: true,
      createdAt: true,
      student: { select: { name: true, email: true } },
      course: { select: { title: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const statusColors: Record<string, string> = {
    APPROVED: "bg-green-100 text-green-700",
    ACTIVE: "bg-blue-50 text-blue-700",
    PENDING: "bg-yellow-100 text-yellow-600",
    REJECTED: "bg-red-50 text-red-700",
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-green-100 rounded-lg p-2">
            <ClipboardList className="h-5 w-5 text-green-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Enrollments</h1>
            <p className="text-sm text-gray-500">
              Track all employee enrollments and their status
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {enrollments.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-500">
            No enrollments found. Enroll employees from the Employees page.
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">
                  Employee
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">
                  Course
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">
                  Tier
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {enrollments.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="text-sm font-medium text-gray-900">
                      {e.student?.name ?? "Unknown"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {e.student?.email ?? "—"}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-700">
                    {e.course.title}
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-600">
                    {e.courseTier}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[e.status] ?? "bg-gray-100 text-gray-600"}`}
                    >
                      {e.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-500">
                    {new Date(e.createdAt).toLocaleDateString("en-PH", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
