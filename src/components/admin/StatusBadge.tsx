import { Badge } from "@/components/ui/badge";
import type { EnrollmentStatus } from "@prisma/client";

const STATUS_CONFIG: Record<EnrollmentStatus, { label: string; className: string }> = {
  PENDING: {
    label: "Pending",
    className: "bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200",
  },
  APPROVED: {
    label: "Approved",
    className: "bg-green-100 text-green-800 hover:bg-green-100 border-green-200",
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-red-100 text-red-800 hover:bg-red-100 border-red-200",
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
