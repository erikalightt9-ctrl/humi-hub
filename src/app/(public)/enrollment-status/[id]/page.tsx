import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findEnrollmentById } from "@/lib/repositories/enrollment.repository";
import { EnrollmentStatusTracker } from "@/components/public/EnrollmentStatusTracker";

export const metadata: Metadata = {
  title: "Enrollment Status | VA Training Center",
};

export default async function EnrollmentStatusPage({
  params,
}: {
  readonly params: Promise<{ readonly id: string }>;
}) {
  const { id } = await params;
  const enrollment = await findEnrollmentById(id);

  if (!enrollment) return notFound();

  const serialized = {
    id: enrollment.id,
    fullName: enrollment.fullName,
    courseTitle: enrollment.course.title,
    status: enrollment.status,
    paymentStatus: enrollment.paymentStatus,
    emailConfirmedAt: enrollment.emailConfirmedAt?.toISOString() ?? null,
    createdAt: enrollment.createdAt.toISOString(),
    statusUpdatedAt: enrollment.statusUpdatedAt?.toISOString() ?? null,
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            VA Training Center
          </h1>
          <p className="text-gray-500 mt-1">Enrollment Status</p>
        </div>

        <EnrollmentStatusTracker enrollment={serialized} />

        <p className="text-center text-xs text-gray-400 mt-6">
          Need help?{" "}
          <Link href="/contact" className="text-blue-600 hover:underline">
            Contact us
          </Link>{" "}
          at info@vatrainingcenter.com
        </p>
      </div>
    </div>
  );
}
