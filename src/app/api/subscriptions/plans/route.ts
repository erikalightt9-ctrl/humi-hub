/**
 * GET /api/subscriptions/plans
 *
 * Public endpoint — returns available SaaS subscription plans with pricing.
 * No authentication required. Used by the landing page pricing section
 * and tenant onboarding flow.
 */

import { NextResponse } from "next/server";
import { PLAN_PRICES_CENTAVOS } from "@/lib/services/paymongo-saas.service";

const PLANS = [
  {
    id: "STARTER",
    name: "Starter",
    tagline: "For small training centers",
    amountCents: PLAN_PRICES_CENTAVOS.STARTER,
    amountFormatted: "₱2,999",
    period: "month",
    features: [
      "Up to 100 students",
      "5 active courses",
      "Student & trainer portals",
      "Certificate generation",
      "Forum & community",
      "Basic analytics",
      "Email support",
      "Gamification & badges",
    ],
    highlighted: false,
  },
  {
    id: "PROFESSIONAL",
    name: "Professional",
    tagline: "For growing training businesses",
    amountCents: PLAN_PRICES_CENTAVOS.PROFESSIONAL,
    amountFormatted: "₱7,999",
    period: "month",
    features: [
      "Unlimited students",
      "Unlimited courses",
      "Everything in Starter",
      "AI interview simulations",
      "AI email practice",
      "Job board integration",
      "Career readiness scores",
      "Attendance tracking",
      "Corporate portal",
      "Advanced analytics",
      "Priority support",
    ],
    highlighted: true,
    badge: "Most Popular",
  },
  {
    id: "ENTERPRISE",
    name: "Enterprise",
    tagline: "For large organizations",
    amountCents: PLAN_PRICES_CENTAVOS.ENTERPRISE,
    amountFormatted: "₱14,999",
    period: "month",
    features: [
      "Everything in Professional",
      "White-label branding",
      "Custom domain",
      "AI mock interviews (unlimited)",
      "Mentorship matching",
      "Multi-tenant management",
      "Dedicated account manager",
      "Custom integrations & API",
      "99.9% uptime SLA",
      "Data migration assistance",
    ],
    highlighted: false,
  },
] as const;

export async function GET() {
  return NextResponse.json({
    success: true,
    data: { plans: PLANS, currency: "PHP", trialDays: 30 },
    error: null,
  });
}
