/**
 * Plan-gating utilities for the multi-tenant SaaS platform.
 *
 * Usage (server-side):
 *   const gate = planGate(org.plan);
 *   if (!gate.canUseAiFeatures) redirect("/corporate/upgrade");
 *
 * Usage (client-side component):
 *   <PlanGate plan={plan} feature="customDomain" fallback={<UpgradeBanner />}>
 *     <CustomDomainSettings />
 *   </PlanGate>
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TenantPlan = "TRIAL" | "STARTER" | "PROFESSIONAL" | "ENTERPRISE";

export interface PlanFeatures {
  /** Maximum employee seats */
  readonly maxSeats: number;
  /** AI-powered learning features (AI Lab, AI insights) */
  readonly canUseAiFeatures: boolean;
  /** Custom domain mapping */
  readonly canUseCustomDomain: boolean;
  /** White-label branding (custom logo, colors, tagline) */
  readonly canUseBranding: boolean;
  /** Advanced analytics & reports export */
  readonly canUseAdvancedReports: boolean;
  /** API access for integrations */
  readonly canUseApi: boolean;
  /** Priority support SLA */
  readonly hasPrioritySupport: boolean;
  /** SSO / SAML integration */
  readonly canUseSso: boolean;
  /** Dedicated account manager */
  readonly hasDedicatedManager: boolean;
}

// ---------------------------------------------------------------------------
// Feature matrix
// ---------------------------------------------------------------------------

const PLAN_FEATURES: Record<TenantPlan, PlanFeatures> = {
  TRIAL: {
    maxSeats: 10,
    canUseAiFeatures: false,
    canUseCustomDomain: false,
    canUseBranding: false,
    canUseAdvancedReports: false,
    canUseApi: false,
    hasPrioritySupport: false,
    canUseSso: false,
    hasDedicatedManager: false,
  },
  STARTER: {
    maxSeats: 25,
    canUseAiFeatures: false,
    canUseCustomDomain: false,
    canUseBranding: true,
    canUseAdvancedReports: false,
    canUseApi: false,
    hasPrioritySupport: false,
    canUseSso: false,
    hasDedicatedManager: false,
  },
  PROFESSIONAL: {
    maxSeats: 100,
    canUseAiFeatures: true,
    canUseCustomDomain: true,
    canUseBranding: true,
    canUseAdvancedReports: true,
    canUseApi: true,
    hasPrioritySupport: true,
    canUseSso: false,
    hasDedicatedManager: false,
  },
  ENTERPRISE: {
    maxSeats: Infinity,
    canUseAiFeatures: true,
    canUseCustomDomain: true,
    canUseBranding: true,
    canUseAdvancedReports: true,
    canUseApi: true,
    hasPrioritySupport: true,
    canUseSso: true,
    hasDedicatedManager: true,
  },
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns the feature set for a given plan.
 * Defaults to TRIAL capabilities if an unknown plan string is supplied.
 */
export function planGate(plan: string): PlanFeatures {
  return PLAN_FEATURES[plan as TenantPlan] ?? PLAN_FEATURES.TRIAL;
}

/** Returns true if `plan` meets or exceeds the `required` tier. */
export function meetsMinimumPlan(plan: string, required: TenantPlan): boolean {
  const order: TenantPlan[] = ["TRIAL", "STARTER", "PROFESSIONAL", "ENTERPRISE"];
  const planIdx = order.indexOf(plan as TenantPlan);
  const reqIdx = order.indexOf(required);
  if (planIdx === -1) return false;
  return planIdx >= reqIdx;
}

/**
 * Convenience type-guard for a specific feature key.
 * Returns the feature value for the given plan.
 */
export function hasFeature(plan: string, feature: keyof PlanFeatures): boolean {
  const features = planGate(plan);
  const value = features[feature];
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  return false;
}
