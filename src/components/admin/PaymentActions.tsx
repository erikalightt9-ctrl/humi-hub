"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { XCircle, Loader2, ShieldCheck, Check } from "lucide-react";

interface PaymentActionsProps {
  paymentId: string;
  status: string;
}

export function PaymentActions({ paymentId, status }: PaymentActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  if (status !== "PENDING_PAYMENT") return null;

  const handleVerify = async (approved: boolean) => {
    setActionType(approved ? "approve" : "reject");
    setShowConfirm(false);

    try {
      const res = await fetch(`/api/admin/payments/${paymentId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved }),
      });

      if (res.ok) {
        startTransition(() => {
          router.refresh();
        });
      }
    } catch {
      // silent — page refresh will reflect updated state
    } finally {
      setActionType(null);
    }
  };

  // ── Inline confirmation (no floating/absolute element) ──────────────────
  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 whitespace-nowrap">
          Confirm activation?
        </span>
        <Button
          size="sm"
          className="bg-green-600 hover:bg-green-700 text-white gap-1"
          onClick={() => handleVerify(true)}
          disabled={isPending}
        >
          {isPending && actionType === "approve" ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Check className="h-3 w-3" />
          )}
          Yes
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowConfirm(false)}
          disabled={isPending}
        >
          No
        </Button>
      </div>
    );
  }

  // ── Default: Verify & Reject buttons ────────────────────────────────────
  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        className="bg-green-600 hover:bg-green-700 text-white gap-1"
        onClick={() => setShowConfirm(true)}
        disabled={isPending}
      >
        {actionType === "approve" ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <ShieldCheck className="h-3 w-3" />
        )}
        Verify &amp; Activate
      </Button>
      <Button
        size="sm"
        variant="destructive"
        className="gap-1"
        onClick={() => handleVerify(false)}
        disabled={isPending}
      >
        {actionType === "reject" ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <XCircle className="h-3 w-3" />
        )}
        Reject
      </Button>
    </div>
  );
}
