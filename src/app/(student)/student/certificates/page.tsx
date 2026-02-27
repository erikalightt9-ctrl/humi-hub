import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getStudentCertificates } from "@/lib/repositories/certificate.repository";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CertificatesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "student") {
    redirect("/student/login");
  }
  const studentId = (session.user as any).id as string;
  const certificates = await getStudentCertificates(studentId);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-700 text-white px-6 py-4">
        <Link href="/student/dashboard" className="text-blue-200 hover:text-white text-sm">← Dashboard</Link>
        <h1 className="text-xl font-bold mt-1">My Certificates</h1>
      </div>
      <div className="max-w-3xl mx-auto p-6 space-y-4">
        {certificates.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-10 text-center">
            <div className="text-5xl mb-4">🎓</div>
            <p className="text-gray-500">Complete all lessons in a course to earn a certificate!</p>
          </div>
        ) : certificates.map((cert) => (
          <div key={cert.id} className="bg-white rounded-xl shadow p-6 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎓</span>
                <h3 className="font-semibold text-gray-800">{cert.course.title}</h3>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Issued {new Date(cert.issuedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </p>
              <p className="text-xs text-gray-400">Cert #{cert.certNumber}</p>
            </div>
            <a href={`/api/student/certificates/${cert.certNumber}/download`}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition">
              Download PDF
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
