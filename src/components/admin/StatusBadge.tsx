import { Badge } from "@/components/ui/badge";
import type { EnrollmentStatus } from "@prisma/client";

const STATUS_CONFIG: Record<EnrollmentStatus, { label: string; className: string }> = {
  PENDING: {
    label: "Pending",
    className: "bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200",
  },
  PAYMENT_SUBMITTED: {
    label: "Payment Submitted",
    className: "bg-orange-100 text-orange-800 hover:bg-orange-100 border-orange-200",
  },
  PAYMENT_VERIFIED: {
    label: "Payment Verified",
    className: "bg-teal-100 text-teal-800 hover:bg-teal-100 border-teal-200",
  },
  EMAIL_VERIFIED: {
    label: "Email Verified",
    className: "bg-cyan-100 text-cyan-800 hover:bg-cyan-100 border-cyan-200",
  },
  APPROVED: {
    label: "Approved",
    className: "bg-green-100 text-green-800 hover:bg-green-100 border-green-200",
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-red-100 text-red-800 hover:bg-red-100 border-red-200",
  },
  ENROLLED: {
    label: "Enrolled",
    className: "bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200",
  },
};

export function StatusBadge({ status }: { status: EnrollmentStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
