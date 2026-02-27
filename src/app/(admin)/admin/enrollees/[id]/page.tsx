import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { StatusDropdown } from "@/components/admin/StatusDropdown";
import { findEnrollmentById } from "@/lib/repositories/enrollment.repository";
import {
  EMPLOYMENT_STATUS_LABELS,
  TOOL_FAMILIARITY_LABELS,
} from "@/lib/validations/enrollment.schema";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export const metadata: Metadata = { title: "Enrollee Detail | VA Admin" };

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-4 py-3 border-b border-gray-100 last:border-0">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="col-span-2 text-sm text-gray-900 break-words">{value ?? "—"}</dd>
    </div>
  );
}

export default async function EnrolleeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const enrollment = await findEnrollmentById(id);
  if (!enrollment) return notFound();

  return (
    <AdminLayout>
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm" className="gap-1 mb-4 text-gray-600">
          <Link href="/admin/enrollees">
            <ChevronLeft className="h-4 w-4" /> Back to Enrollees
          </Link>
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{enrollment.fullName}</h1>
            <p className="text-gray-500 text-sm">{enrollment.email}</p>
          </div>
          <StatusDropdown enrollmentId={enrollment.id} currentStatus={enrollment.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Personal Information</h2>
            <dl>
              <Field label="Full Name" value={enrollment.fullName} />
              <Field
                label="Date of Birth"
                value={enrollment.dateOfBirth.toLocaleDateString("en-PH", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              />
              <Field label="Contact Number" value={enrollment.contactNumber} />
              <Field label="Address" value={enrollment.address} />
            </dl>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Professional Background</h2>
            <dl>
              <Field label="Education" value={enrollment.educationalBackground} />
              <Field label="Work Experience" value={enrollment.workExperience || "Not provided"} />
              <Field
                label="Employment Status"
                value={
                  EMPLOYMENT_STATUS_LABELS[
                    enrollment.employmentStatus as keyof typeof EMPLOYMENT_STATUS_LABELS
                  ]
                }
              />
              <Field
                label="Technical Skills"
                value={enrollment.technicalSkills.join(", ") || "None"}
              />
              <Field
                label="Tools Familiarity"
                value={
                  enrollment.toolsFamiliarity.length
                    ? enrollment.toolsFamiliarity
                        .map(
                          (t) =>
                            TOOL_FAMILIARITY_LABELS[t as keyof typeof TOOL_FAMILIARITY_LABELS]
                        )
                        .join(", ")
                    : "None"
                }
              />
            </dl>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-3">Personal Statement</h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {enrollment.whyEnroll}
            </p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Application Details</h2>
            <dl className="space-y-3">
              <Field label="Application ID" value={<code className="text-xs">{enrollment.id}</code>} />
              <Field label="Course" value={enrollment.course.title} />
              <Field
                label="Submitted"
                value={enrollment.createdAt.toLocaleDateString("en-PH", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              />
              {enrollment.statusUpdatedAt && (
                <Field
                  label="Status Updated"
                  value={enrollment.statusUpdatedAt.toLocaleDateString("en-PH", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                />
              )}
              <Field label="IP Address" value={enrollment.ipAddress ?? "Unknown"} />
            </dl>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
