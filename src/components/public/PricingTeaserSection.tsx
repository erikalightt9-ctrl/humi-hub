import Link from "next/link";
import { Check, ArrowRight, Star } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Tiers                                                              */
/* ------------------------------------------------------------------ */

const tiers = [
  {
    name: "Starter",
    price: "Free",
    period: "forever",
    tagline: "Perfect for small teams getting started",
    highlight: false,
    cta: { label: "Start Free", href: "/register" },
    points: [
      "Up to 10 employees",
      "Core HR & leave management",
      "1 course portal",
      "Basic reporting",
    ],
  },
  {
    name: "Growth",
    price: "$49",
    period: "/ month",
    tagline: "Everything you need to scale confidently",
    highlight: true,
    badge: "Most popular",
    cta: { label: "Start Free Trial", href: "/register" },
    points: [
      "Up to 100 employees",
      "Full HR + payroll suite",
      "Unlimited course portals",
      "AI insights & analytics",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "pricing",
    tagline: "For large orgs with complex requirements",
    highlight: false,
    cta: { label: "Book a Demo", href: "/contact" },
    points: [
      "Unlimited employees",
      "Multi-tenant management",
      "White-label branding",
      "Dedicated onboarding",
      "SLA & compliance support",
    ],
  },
] as const;

/* ------------------------------------------------------------------ */
/*  PricingTeaserSection                                               */
/* ------------------------------------------------------------------ */

export function PricingTeaserSection() {
  return (
    <section className="bg-gray-50 border-y border-gray-200 py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-600 mb-2">
            Simple pricing
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
            Plans that grow with you
          </h2>
          <p className="text-slate-500 text-lg max-w-lg mx-auto">
            Start free, upgrade when you&apos;re ready. No contracts. No hidden fees.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-start">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-2xl p-7 flex flex-col ${
                tier.highlight
                  ? "bg-gradient-to-b from-blue-700 to-indigo-800 text-white shadow-2xl shadow-blue-900/40 scale-[1.03]"
                  : "bg-white border border-gray-200 text-slate-900"
              }`}
            >
              {/* Badge */}
              {"badge" in tier && tier.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full shadow">
                  <Star className="h-3 w-3" />
                  {tier.badge}
                </div>
              )}

              {/* Name + price */}
              <p className={`text-sm font-bold uppercase tracking-widest mb-3 ${tier.highlight ? "text-blue-200" : "text-blue-600"}`}>
                {tier.name}
              </p>
              <div className="flex items-end gap-1 mb-1">
                <span className={`text-4xl font-extrabold ${tier.highlight ? "text-white" : "text-slate-900"}`}>
                  {tier.price}
                </span>
                <span className={`text-sm pb-1 ${tier.highlight ? "text-blue-300" : "text-slate-400"}`}>
                  {tier.period}
                </span>
              </div>
              <p className={`text-sm mb-6 ${tier.highlight ? "text-blue-200" : "text-slate-500"}`}>
                {tier.tagline}
              </p>

              {/* Feature list */}
              <ul className="space-y-2.5 mb-8 flex-1">
                {tier.points.map((pt) => (
                  <li key={pt} className="flex items-start gap-2 text-sm">
                    <Check className={`h-4 w-4 shrink-0 mt-0.5 ${tier.highlight ? "text-blue-300" : "text-emerald-500"}`} />
                    <span className={tier.highlight ? "text-blue-100" : "text-slate-600"}>{pt}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href={tier.cta.href}
                className={`inline-flex items-center justify-center gap-2 w-full font-bold text-sm py-3 rounded-xl transition-colors ${
                  tier.highlight
                    ? "bg-white text-blue-800 hover:bg-blue-50"
                    : "border border-blue-200 text-blue-700 hover:bg-blue-50"
                }`}
              >
                {tier.cta.label}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>

        {/* Full pricing link */}
        <p className="text-center text-sm text-slate-400 mt-8">
          Need to compare in detail?{" "}
          <Link href="/pricing" className="text-blue-600 font-semibold hover:underline">
            See full pricing →
          </Link>
        </p>

      </div>
    </section>
  );
}
