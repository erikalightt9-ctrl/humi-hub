"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "./StatusBadge";
import { ChevronDown, Loader2 } from "lucide-react";
import type { EnrollmentStatus } from "@prisma/client";

const STATUSES: EnrollmentStatus[] = ["PENDING", "APPROVED", "REJECTED"];

interface StatusDropdownProps {
  enrollmentId: string;
  currentStatus: EnrollmentStatus;
}

export function StatusDropdown({ enrollmentId, currentStatus }: StatusDropdownProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] = useState<EnrollmentStatus>(currentStatus);

  const handleStatusChange = async (newStatus: EnrollmentStatus) => {
    if (newStatus === optimisticStatus) return;

    // Optimistic update
    setOptimisticStatus(newStatus);

    try {
      const res = await fetch(`/api/admin/enrollments/${enrollmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        // Revert on error
        setOptimisticStatus(currentStatus);
        return;
      }

      startTransition(() => {
        router.refresh();
      });
    } catch {
      setOptimisticStatus(currentStatus);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1 rounded focus:outline-none">
        <StatusBadge status={optimisticStatus} />
        {isPending ? (
          <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
        ) : (
          <ChevronDown className="h-3 w-3 text-gray-400" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {STATUSES.map((s) => (
          <DropdownMenuItem
            key={s}
            onClick={() => handleStatusChange(s)}
            className={s === optimisticStatus ? "font-semibold" : ""}
          >
            <StatusBadge status={s} />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
