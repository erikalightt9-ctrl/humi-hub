import type { Metadata } from "next";
export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import Link from "next/link";
import { findEnrolleeById, getEnrolleeActivityLog } from "@/lib/repositories/enrollee.repository";
import { EnrolleeProfileSections } from "@/components/admin/EnrolleeProfileSections";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export const metadata: Metadata = { title: "Enrollee Profile | HUMI Hub Admin" };

export default async function EnrolleeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [enrollee, activityLog] = await Promise.all([
    findEnrolleeById(id),
    getEnrolleeActivityLog(id),
  ]);

  if (!enrollee) return notFound();

  // Serialize for client component (Dates → ISO strings, Decimals → strings)
  const serialized = {
    id: enrollee.id,
    name: enrollee.name,
    email: enrollee.email,
    batch: enrollee.batch,
    scheduleId: enrollee.scheduleId,
    schedule: enrollee.schedule
      ? {
          id: enrollee.schedule.id,
          name: enrollee.schedule.name,
          startDate: enrollee.schedule.startDate.toISOString(),
          endDate: enrollee.schedule.endDate.toISOString(),
          startTime: enrollee.schedule.startTime,
          endTime: enrollee.schedule.endTime,
          daysOfWeek: enrollee.schedule.daysOfWeek,
        }
      : null,
    paymentStatus: enrollee.paymentStatus,
    amountPaid: enrollee.amountPaid.toString(),
    accessGranted: enrollee.accessGranted,
    accessExpiry: enrollee.accessExpiry?.toISOString() ?? null,
    notes: enrollee.notes,
    createdAt: enrollee.createdAt.toISOString(),
    enrollment: {
      fullName: enrollee.enrollment.fullName,
      email: enrollee.enrollment.email,
      contactNumber: enrollee.enrollment.contactNumber,
      address: enrollee.enrollment.address,
      educationalBackground: enrollee.enrollment.educationalBackground,
      workExperience: enrollee.enrollment.workExperience,
      employmentStatus: enrollee.enrollment.employmentStatus,
      technicalSkills: enrollee.enrollment.technicalSkills,
      whyEnroll: enrollee.enrollment.whyEnroll,
      status: enrollee.enrollment.status,
      statusUpdatedAt: enrollee.enrollment.statusUpdatedAt?.toISOString() ?? null,
      statusUpdatedBy: enrollee.enrollment.statusUpdatedBy,
      referenceCode: enrollee.enrollment.referenceCode,
      paymentStatus: enrollee.enrollment.paymentStatus,
      createdAt: enrollee.enrollment.createdAt.toISOString(),
      course: {
        id: enrollee.enrollment.course.id,
        title: enrollee.enrollment.course.title,
        price: enrollee.enrollment.course.price.toString(),
      },
      payments: enrollee.enrollment.payments.map((p) => ({
        id: p.id,
        amount: p.amount.toString(),
        method: p.method,
        status: p.status,
        referenceNumber: p.referenceNumber,
        notes: p.notes,
        paidAt: p.paidAt?.toISOString() ?? null,
        verifiedAt: p.verifiedAt?.toISOString() ?? null,
        verifiedBy: p.verifiedBy,
        proofFilePath: p.proofFilePath,
        createdAt: p.createdAt.toISOString(),
      })),
    },
    activityLog: activityLog.map((a) => ({
      id: a.id,
      type: a.type,
      title: a.title,
      detail: a.detail,
      timestamp: a.timestamp.toISOString(),
    })),
  };

  return (
    <>
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm" className="gap-1 mb-4 text-gray-600">
          <Link href="/admin/enrollees">
            <ChevronLeft className="h-4 w-4" /> Back to Enrollees
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{enrollee.name}</h1>
          <p className="text-gray-500 text-sm">{enrollee.email}</p>
          {enrollee.batch && (
            <p className="text-gray-400 text-xs mt-1">Batch: {enrollee.batch}</p>
          )}
        </div>
      </div>

      <EnrolleeProfileSections enrollee={serialized} />
    </>
  );
}
