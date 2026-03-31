import Link from "next/link";
import { Check, Zap, ArrowRight, HelpCircle, Building2, Users, Rocket } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const PLANS = [
  {
    name: "Starter",
    tagline: "Launch your first training platform",
    price: "₱2,999",
    period: "/month",
    description: "Everything you need to start running training programs online.",
    highlighted: false,
    badge: null,
    cta: "Start Free Trial",
    href: "/start-trial",
    icon: Rocket,
    color: "text-blue-600",
    features: [
      "Up to 100 students",
      "5 active courses",
      "Student & trainer portals",
      "Certificate generation",
      "Basic analytics dashboard",
      "Email support",
      "Community & forum",
      "Gamification & badges",
      "Custom subdomain",
    ],
  },
  {
    name: "Professional",
    tagline: "Scale your training operations",
    price: "₱7,999",
    period: "/month",
    description: "Full platform with AI tools, payments, and advanced reporting.",
    highlighted: true,
    badge: "Most Popular",
    cta: "Start Free Trial",
    href: "/start-trial",
    icon: Users,
    color: "text-white",
    features: [
      "Unlimited students",
      "Unlimited courses",
      "Everything in Starter",
      "AI session summaries",
      "Grammar checker",
      "Quiz generation",
      "Corporate portal",
      "File management",
      "Advanced analytics",
      "Job board integration",
      "Priority support",
      "White-label branding",
    ],
  },
  {
    name: "Enterprise",
    tagline: "For large organizations",
    price: "₱14,999",
    period: "/month",
    description: "Custom white-label deployment with dedicated support and SLA.",
    highlighted: false,
    badge: null,
    cta: "Contact Sales",
    href: "/contact",
    icon: Building2,
    color: "text-purple-600",
    features: [
      "Everything in Professional",
      "Custom domain",
      "Dedicated account manager",
      "Multi-tenant management",
      "Feature flags per tenant",
      "Custom API integrations",
      "SSO / SAML",
      "SLA guarantee",
      "Onboarding support",
      "Unlimited seats",
    ],
  },
] as const;

const FAQS = [
  {
    q: "Can I try before I buy?",
    a: "Yes — every plan starts with a 30-day free trial, no credit card required. Your platform is live and fully functional from day one.",
  },
  {
    q: "What happens when my trial ends?",
    a: "We'll notify you 7 days before your trial expires. You can choose a plan or your platform will be paused (data is preserved for 30 days).",
  },
  {
    q: "Can I switch plans later?",
    a: "Absolutely. Upgrade or downgrade anytime from your settings dashboard. Changes take effect at the next billing cycle.",
  },
  {
    q: "Is my data isolated from other tenants?",
    a: "Yes. Every organization gets fully isolated data — students, courses, files, and settings are scoped exclusively to your tenant.",
  },
  {
    q: "Do you support custom domains?",
    a: "Custom domains are available on Professional and Enterprise plans. Starter tenants get a branded subdomain (yourname.humitraining.com).",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept GCash, Maya, credit/debit cards (Visa/Mastercard), and bank transfer via PayMongo and Stripe.",
  },
];

const COMPARE = [
  { feature: "Students",           starter: "100",      pro: "Unlimited", enterprise: "Unlimited" },
  { feature: "Courses",            starter: "5",        pro: "Unlimited", enterprise: "Unlimited" },
  { feature: "Custom subdomain",   starter: true,       pro: true,        enterprise: true },
  { feature: "Custom domain",      starter: false,      pro: false,       enterprise: true },
  { feature: "White-label",        starter: false,      pro: true,        enterprise: true },
  { feature: "AI Tools",           starter: false,      pro: true,        enterprise: true },
  { feature: "Corporate portal",   starter: false,      pro: true,        enterprise: true },
  { feature: "File management",    starter: false,      pro: true,        enterprise: true },
  { feature: "Feature flags",      starter: false,      pro: false,       enterprise: true },
  { feature: "SSO / SAML",         starter: false,      pro: false,       enterprise: true },
  { feature: "API access",         starter: false,      pro: false,       enterprise: true },
  { feature: "Dedicated manager",  starter: false,      pro: false,       enterprise: true },
  { feature: "SLA",                starter: false,      pro: false,       enterprise: true },
  { feature: "Support",            starter: "Email",    pro: "Priority",  enterprise: "Dedicated" },
];

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function Cell({ value }: { readonly value: boolean | string }) {
  if (typeof value === "boolean") {
    return value ? (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600">
        <Check className="h-3 w-3" />
      </span>
    ) : (
      <span className="text-gray-300">—</span>
    );
  }
  return <span className="text-sm font-medium text-gray-700">{value}</span>;
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function PricingPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 pt-20 pb-28 text-center px-4">
        <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <Zap className="h-3 w-3" />
          30-day free trial · No credit card needed
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
          Simple, transparent pricing
        </h1>
        <p className="text-lg text-blue-200 max-w-xl mx-auto">
          Launch your own training platform today. Scale as your business grows. Cancel anytime.
        </p>
      </section>

      {/* Plan cards */}
      <section className="max-w-6xl mx-auto px-4 -mt-16 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-2xl p-8 shadow-lg border ${
                  plan.highlighted
                    ? "bg-blue-600 border-blue-500 text-white"
                    : "bg-white border-gray-200"
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full">
                    {plan.badge}
                  </span>
                )}

                <div className={`inline-flex p-2.5 rounded-xl mb-4 w-fit ${plan.highlighted ? "bg-white/10" : "bg-blue-50"}`}>
                  <Icon className={`h-5 w-5 ${plan.highlighted ? "text-white" : plan.color}`} />
                </div>

                <h2 className={`text-xl font-bold mb-0.5 ${plan.highlighted ? "text-white" : "text-gray-900"}`}>
                  {plan.name}
                </h2>
                <p className={`text-xs font-semibold uppercase tracking-wide mb-4 ${plan.highlighted ? "text-blue-200" : "text-blue-600"}`}>
                  {plan.tagline}
                </p>

                <div className="mb-2">
                  <span className={`text-4xl font-extrabold ${plan.highlighted ? "text-white" : "text-gray-900"}`}>
                    {plan.price}
                  </span>
                  <span className={`text-sm ml-1 ${plan.highlighted ? "text-blue-200" : "text-gray-400"}`}>
                    {plan.period}
                  </span>
                </div>
                <p className={`text-sm mb-6 ${plan.highlighted ? "text-blue-200" : "text-gray-500"}`}>
                  {plan.description}
                </p>

                <ul className="space-y-2.5 flex-1 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check className={`h-4 w-4 shrink-0 mt-0.5 ${plan.highlighted ? "text-amber-300" : "text-blue-600"}`} />
                      <span className={`text-sm ${plan.highlighted ? "text-blue-100" : "text-gray-600"}`}>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-colors ${
                    plan.highlighted
                      ? "bg-white text-blue-700 hover:bg-blue-50"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {plan.cta} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            );
          })}
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          All prices in Philippine Peso (PHP) · VAT not included ·{" "}
          <Link href="/contact" className="text-blue-600 hover:underline">Need a custom quote?</Link>
        </p>
      </section>

      {/* Feature comparison table */}
      <section className="bg-gray-50 py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
            Compare plans
          </h2>
          <p className="text-gray-500 text-center text-sm mb-10">
            Everything side-by-side so you can choose with confidence.
          </p>

          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left px-6 py-4 text-gray-500 font-medium w-1/3">Feature</th>
                  {["Starter", "Professional", "Enterprise"].map((p) => (
                    <th key={p} className="text-center px-4 py-4 font-bold text-gray-900">{p}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARE.map((row, i) => (
                  <tr key={row.feature} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                    <td className="px-6 py-3 text-gray-700">{row.feature}</td>
                    <td className="px-4 py-3 text-center"><Cell value={row.starter} /></td>
                    <td className="px-4 py-3 text-center"><Cell value={row.pro} /></td>
                    <td className="px-4 py-3 text-center"><Cell value={row.enterprise} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 py-20">
        <div className="flex items-center gap-2 justify-center mb-2">
          <HelpCircle className="h-5 w-5 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900 text-center">Frequently asked questions</h2>
        </div>
        <p className="text-center text-gray-500 text-sm mb-10">Can&apos;t find the answer? <Link href="/contact" className="text-blue-600 hover:underline">Contact us</Link>.</p>

        <div className="space-y-4">
          {FAQS.map((faq) => (
            <div key={faq.q} className="border border-gray-200 rounded-xl p-5">
              <p className="font-semibold text-gray-900 mb-1.5">{faq.q}</p>
              <p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section className="bg-blue-600 py-16 px-4 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
          Ready to launch your training platform?
        </h2>
        <p className="text-blue-200 mb-8 text-sm">
          Join hundreds of training centers already running on Humi Hub.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/start-trial"
            className="inline-flex items-center gap-2 bg-white text-blue-700 font-semibold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors"
          >
            Create Your Training Platform <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 border border-blue-400 text-white font-medium px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
          >
            Talk to Sales
          </Link>
        </div>
      </section>
    </div>
  );
}
