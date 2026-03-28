import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Zap } from "lucide-react";

interface PricingTier {
  readonly name: string;
  readonly tagline: string;
  readonly price: string;
  readonly period: string;
  readonly description: string;
  readonly features: readonly string[];
  readonly highlighted: boolean;
  readonly cta: string;
  readonly href: string;
  readonly badge?: string;
}

const tiers: readonly PricingTier[] = [
  {
    name: "Starter",
    tagline: "For small training centers",
    price: "₱2,999",
    period: "/ month",
    description:
      "Everything you need to run your first training programs online.",
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
    cta: "Start Free Trial",
    href: "/contact",
  },
  {
    name: "Professional",
    tagline: "For growing training businesses",
    price: "₱7,999",
    period: "/ month",
    description:
      "The full platform with AI tools, payments, and advanced reporting.",
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
    cta: "Start Free Trial",
    href: "/contact",
    badge: "Most Popular",
  },
  {
    name: "Enterprise",
    tagline: "For large organizations",
    price: "₱14,999",
    period: "/ month",
    description:
      "Custom white-label deployment with dedicated support and SLA.",
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
    cta: "Contact Sales",
    href: "/contact",
  },
] as const;

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 bg-gray-50 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-blue-600 font-semibold text-sm uppercase tracking-wide mb-2">
            Pricing
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg">
            No hidden fees. No per-student charges. Pay one monthly rate and
            scale your training center without limits.
          </p>
        </div>

        {/* Trial callout */}
        <div className="max-w-xl mx-auto mb-10">
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-3.5 text-sm text-amber-800">
            <Zap className="h-4 w-4 shrink-0 text-amber-500" />
            <span>
              <strong>30-day free trial</strong> on all plans — no credit card
              required. Cancel anytime.
            </span>
          </div>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-2xl p-7 flex flex-col ${
                tier.highlighted
                  ? "bg-blue-900 text-white ring-2 ring-blue-500 shadow-xl md:scale-[1.03]"
                  : "bg-white border border-gray-200 shadow-sm"
              }`}
            >
              {/* Badge */}
              {tier.badge && (
                <span className="inline-block text-xs font-bold bg-amber-400 text-amber-900 px-3 py-1 rounded-full mb-4 self-start">
                  {tier.badge}
                </span>
              )}

              {/* Plan name */}
              <h3
                className={`text-xl font-bold ${
                  tier.highlighted ? "text-white" : "text-gray-900"
                }`}
              >
                {tier.name}
              </h3>
              <p
                className={`text-xs font-medium mt-0.5 mb-5 uppercase tracking-wide ${
                  tier.highlighted ? "text-blue-300" : "text-blue-600"
                }`}
              >
                {tier.tagline}
              </p>

              {/* Price */}
              <div className="mb-2">
                <span
                  className={`text-4xl font-extrabold ${
                    tier.highlighted ? "text-white" : "text-gray-900"
                  }`}
                >
                  {tier.price}
                </span>
                <span
                  className={`text-sm ml-1 ${
                    tier.highlighted ? "text-blue-200" : "text-gray-500"
                  }`}
                >
                  {tier.period}
                </span>
              </div>
              <p
                className={`text-sm mb-6 ${
                  tier.highlighted ? "text-blue-200" : "text-gray-500"
                }`}
              >
                {tier.description}
              </p>

              {/* Features */}
              <ul className="space-y-2.5 mb-8 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check
                      className={`h-4 w-4 shrink-0 mt-0.5 ${
                        tier.highlighted ? "text-amber-300" : "text-blue-600"
                      }`}
                    />
                    <span
                      className={`text-sm ${
                        tier.highlighted ? "text-blue-100" : "text-gray-600"
                      }`}
                    >
                      {f}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                asChild
                className={`w-full font-semibold ${
                  tier.highlighted
                    ? "bg-white text-blue-900 hover:bg-blue-50"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                <Link href={tier.href}>
                  {tier.cta} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          ))}
        </div>

        {/* Bottom note */}
        <p className="text-center text-sm text-gray-400 mt-8">
          All plans include a 30-day free trial. Prices are in Philippine Peso
          (PHP). Need a custom quote?{" "}
          <Link href="/contact" className="text-blue-600 hover:underline">
            Contact us
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
