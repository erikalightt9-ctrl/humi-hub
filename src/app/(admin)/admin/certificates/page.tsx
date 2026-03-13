import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { Award } from "lucide-react";

export const metadata: Metadata = { title: "Certificates | HUMI Admin" };

export default async function CertificatesPage() {
  const certificates = await prisma.certificate.findMany({
    include: {
      student: { select: { name: true, email: true } },
      course: { select: { title: true } },
    },
    orderBy: { issuedAt: "desc" },
    take: 100,
  });

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Certificates</h1>
        <p className="text-gray-500 text-sm mt-1">
          All issued course completion certificates
        </p>
      </div>

      {certificates.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-amber-100 rounded-full p-4">
              <Award className="h-8 w-8 text-amber-600" />
            </div>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            No Certificates Yet
          </h2>
          <p className="text-sm text-gray-500">
            Certificates are issued automatically when students complete all lessons in a course.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Student</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Course</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Certificate #</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Issued</th>
                </tr>
              </thead>
              <tbody>
                {certificates.map((cert) => (
                  <tr key={cert.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{cert.student.name}</p>
                      <p className="text-xs text-gray-500">{cert.student.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{cert.course.title}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{cert.certNumber}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {cert.issuedAt.toLocaleDateString("en-PH", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
