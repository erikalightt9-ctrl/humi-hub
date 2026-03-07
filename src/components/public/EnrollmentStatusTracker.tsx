"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Loader2,
  Clock,
  Lock,
  RefreshCw,
  AlertOctagon,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EnrollmentData {
  readonly id: string;
  readonly fullName: string;
  readonly courseTitle: string;
  readonly status: string;
  readonly paymentStatus: string;
  readonly emailConfirmedAt: string | null;
  readonly createdAt: string;
  readonly statusUpdatedAt: string | null;
}

interface EnrollmentStatusTrackerProps {
  readonly enrollment: EnrollmentData;
}

type StepState = "completed" | "active" | "waiting" | "locked" | "rejected";

interface StepDefinition {
  readonly key: string;
  readonly label: string;
  readonly description: string;
}

interface ResolvedStep {
  readonly key: string;
  readonly label: string;
  readonly description: string;
  readonly state: StepState;
  readonly timestamp: string | null;
}

interface StepBadgeConfig {
  readonly label: string;
  readonly className: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_ORDER: readonly string[] = [
  "PENDING",
  "PAYMENT_SUBMITTED",
  "PAYMENT_VERIFIED",
  "ENROLLED",
] as const;

const STEPS: readonly StepDefinition[] = [
  {
    key: "PENDING",
    label: "Application Submitted",
    description: "Your enrollment application has been received",
  },
  {
    key: "PAYMENT_SUBMITTED",
    label: "Payment Submitted",
    description: "Your payment proof has been submitted for verification",
  },
  {
    key: "PAYMENT_VERIFIED",
    label: "Payment Verified",
    description: "Your payment has been confirmed by our team",
  },
  {
    key: "ENROLLED",
    label: "Active Student",
    description: "Your student account is active — check your email for login credentials",
  },
] as const;

const STEP_BADGE_CONFIGS: Record<StepState, StepBadgeConfig> = {
  completed: {
    label: "Completed",
    className: "bg-green-100 text-green-700",
  },
  active: {
    label: "In Progress",
    className: "bg-blue-100 text-blue-700",
  },
  waiting: {
    label: "Waiting",
    className: "bg-amber-100 text-amber-700",
  },
  locked: {
    label: "Pending",
    className: "bg-gray-100 text-gray-500",
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-100 text-red-700",
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStatusIndex(status: string): number {
  const idx = STATUS_ORDER.indexOf(status);
  return idx === -1 ? 0 : idx;
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function resolveSteps(enrollment: EnrollmentData): readonly ResolvedStep[] {
  const isRejected = enrollment.status === "REJECTED";
  const currentIndex = getStatusIndex(enrollment.status);

  return STEPS.map((step, index) => {
    let state: StepState;

    if (isRejected) {
      // Everything up to and including the step before rejection is completed
      // The step that would be "current" shows as rejected
      if (index < currentIndex) {
        state = "completed";
      } else if (index === currentIndex) {
        state = "rejected";
      } else {
        state = "locked";
      }
    } else if (index < currentIndex) {
      state = "completed";
    } else if (index === currentIndex) {
      // First step (PENDING) is always completed if enrollment exists
      state = index === 0 ? "completed" : "active";
    } else if (index === currentIndex + 1) {
      state = "waiting";
    } else {
      state = "locked";
    }

    // If status is PENDING, mark step 0 as completed and step 1 as active
    if (enrollment.status === "PENDING" && index === 0) {
      state = "completed";
    }
    if (enrollment.status === "PENDING" && index === 1) {
      state = "active";
    }

    // Determine timestamp
    let timestamp: string | null = null;
    if (state === "completed" || state === "active" || state === "rejected") {
      if (index === 0) {
        timestamp = enrollment.createdAt;
      } else if (enrollment.statusUpdatedAt && index <= currentIndex) {
        timestamp = enrollment.statusUpdatedAt;
      }
    }

    return {
      key: step.key,
      label: step.label,
      description: step.description,
      state,
      timestamp,
    };
  });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StepIcon({ state }: { readonly state: StepState }) {
  switch (state) {
    case "completed":
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 ring-4 ring-green-50">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
        </div>
      );
    case "active":
      return (
        <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 ring-4 ring-blue-50">
          <div className="absolute inset-0 rounded-full bg-blue-400/20 animate-ping" />
          <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
        </div>
      );
    case "waiting":
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 ring-4 ring-amber-50">
          <Clock className="h-5 w-5 text-amber-600" />
        </div>
      );
    case "rejected":
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 ring-4 ring-red-50">
          <AlertOctagon className="h-5 w-5 text-red-600" />
        </div>
      );
    case "locked":
    default:
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 ring-4 ring-gray-50">
          <Lock className="h-4 w-4 text-gray-400" />
        </div>
      );
  }
}

function StepBadge({ state }: { readonly state: StepState }) {
  const config = STEP_BADGE_CONFIGS[state];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}

function ConnectorLine({
  topState,
  bottomState,
}: {
  readonly topState: StepState;
  readonly bottomState: StepState;
}) {
  const isTopDone = topState === "completed";
  const isBottomActive = bottomState === "active";

  let colorClass = "bg-gray-200";
  if (isTopDone && (bottomState === "completed" || isBottomActive)) {
    colorClass = "bg-green-300";
  } else if (isTopDone && bottomState === "waiting") {
    colorClass = "bg-gradient-to-b from-green-300 to-amber-200";
  } else if (topState === "rejected") {
    colorClass = "bg-gray-200";
  }

  return (
    <div
      className={`absolute left-5 top-10 h-full w-0.5 -translate-x-px ${colorClass}`}
    />
  );
}

function TimelineStep({
  step,
  isLast,
  nextState,
}: {
  readonly step: ResolvedStep;
  readonly isLast: boolean;
  readonly nextState: StepState | null;
}) {
  return (
    <div className="relative flex gap-4 pb-8 last:pb-0">
      {/* Connector line */}
      {!isLast && nextState !== null && (
        <ConnectorLine topState={step.state} bottomState={nextState} />
      )}

      {/* Icon */}
      <div className="relative z-10 shrink-0">
        <StepIcon state={step.state} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3
            className={`text-sm font-semibold ${
              step.state === "locked" ? "text-gray-400" : "text-gray-900"
            }`}
          >
            {step.label}
          </h3>
          <StepBadge state={step.state} />
        </div>
        <p
          className={`text-xs mt-0.5 ${
            step.state === "locked" ? "text-gray-300" : "text-gray-500"
          }`}
        >
          {step.description}
        </p>
        {step.timestamp && (
          <p className="text-xs text-gray-400 mt-1">
            {formatDate(step.timestamp)}
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function EnrollmentStatusTracker({
  enrollment,
}: EnrollmentStatusTrackerProps) {
  const router = useRouter();
  const steps = useMemo(() => resolveSteps(enrollment), [enrollment]);
  const isRejected = enrollment.status === "REJECTED";
  const isEnrolled = enrollment.status === "ENROLLED";

  const handleRefresh = useCallback(() => {
    router.refresh();
  }, [router]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 px-6 py-5 text-white">
        <h2 className="text-lg font-bold">{enrollment.fullName}</h2>
        <p className="text-blue-200 text-sm mt-0.5">{enrollment.courseTitle}</p>
        <p className="text-blue-300/70 text-xs mt-1 font-mono">
          ID: {enrollment.id.slice(0, 8).toUpperCase()}
        </p>
      </div>

      {/* Rejection notice */}
      {isRejected && (
        <div className="mx-6 mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <div className="flex items-start gap-2">
            <AlertOctagon className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">
                Application Not Approved
              </p>
              <p className="text-xs text-red-600 mt-0.5">
                Unfortunately, your application was not approved at this time.
                Please contact support for more information.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Enrolled success notice */}
      {isEnrolled && (
        <div className="mx-6 mt-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-800">
                Enrollment Complete
              </p>
              <p className="text-xs text-green-600 mt-0.5">
                Your account is active. You can now log in to access your course
                materials.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="px-6 py-6">
        {steps.map((step, index) => (
          <TimelineStep
            key={step.key}
            step={step}
            isLast={index === steps.length - 1}
            nextState={index < steps.length - 1 ? steps[index + 1].state : null}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 px-6 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Mail className="h-3.5 w-3.5" />
            <span>info@vatrainingcenter.com</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh Status
          </Button>
        </div>
      </div>
    </div>
  );
}
