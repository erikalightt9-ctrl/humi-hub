export const PAGE_LIMITS: Record<string, number> = {
  TRIAL: 3,
  BASIC: 3,
  STARTER: 3,
  PROFESSIONAL: 10,
  PRO: 10,
  ENTERPRISE: Infinity,
};

export function getPlanPageLimit(plan: string): number {
  return PAGE_LIMITS[plan?.toUpperCase()] ?? 3;
}

export function getPlanLabel(plan: string): string {
  const labels: Record<string, string> = {
    TRIAL: "Trial",
    BASIC: "Basic",
    STARTER: "Starter",
    PROFESSIONAL: "Professional",
    PRO: "Pro",
    ENTERPRISE: "Enterprise",
  };
  return labels[plan?.toUpperCase()] ?? plan;
}
