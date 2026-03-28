"use client";

import { X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPlanLabel } from "@/lib/constants/plan-limits";

interface UpgradeBannerProps {
  readonly plan: string;
  readonly limit: number;
  readonly onDismiss: () => void;
}

export function UpgradeBanner({ plan, limit, onDismiss }: UpgradeBannerProps) {
  const planLabel = getPlanLabel(plan);

  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-amber-800"
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" aria-hidden="true" />

      <div className="flex-1 text-sm">
        <span className="font-medium">Page limit reached. </span>
        You&apos;ve reached the{" "}
        <span className="font-semibold">{limit} page</span> limit on the{" "}
        <span className="font-semibold">{planLabel}</span> plan.{" "}
        <Button
          asChild
          variant="link"
          className="h-auto p-0 text-sm font-semibold text-amber-700 underline underline-offset-2 hover:text-amber-900"
        >
          <a href="/corporate/settings">Upgrade your plan</a>
        </Button>{" "}
        to create more pages.
      </div>

      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss upgrade banner"
        className="ml-auto shrink-0 rounded p-0.5 text-amber-600 transition-colors hover:bg-amber-100 hover:text-amber-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
