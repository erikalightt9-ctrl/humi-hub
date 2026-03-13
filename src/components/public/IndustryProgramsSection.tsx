import Link from "next/link";
import {
  Stethoscope,
  Home,
  Calculator,
  Scale,
  Monitor,
  ShoppingCart,
  Building2,
  Headphones,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const industries = [
  {
    icon: Stethoscope,
    title: "Healthcare & Medical",
    description: "Medical administration, billing, telehealth support, and clinical documentation.",
    color: "bg-red-50 text-red-700 border-red-100",
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
  },
  {
    icon: Home,
    title: "Real Estate",
    description: "Transaction coordination, listing management, CRM operations, and lead generation.",
    color: "bg-emerald-50 text-emerald-700 border-emerald-100",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
  },
  {
    icon: Calculator,
    title: "Finance & Bookkeeping",
    description: "QuickBooks mastery, payroll processing, financial reporting, and tax preparation support.",
    color: "bg-blue-50 text-blue-700 border-blue-100",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    icon: Scale,
    title: "Legal & Compliance",
    description: "Legal research, contract management, paralegal assistance, and compliance documentation.",
    color: "bg-purple-50 text-purple-700 border-purple-100",
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
  },
  {
    icon: Monitor,
    title: "Technology & IT",
    description: "Technical support, project management, software documentation, and SaaS operations.",
    color: "bg-cyan-50 text-cyan-700 border-cyan-100",
    iconBg: "bg-cyan-100",
    iconColor: "text-cyan-600",
  },
  {
    icon: ShoppingCart,
    title: "E-Commerce & Retail",
    description: "Product listing management, customer service, inventory, and marketplace operations.",
    color: "bg-amber-50 text-amber-700 border-amber-100",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  {
    icon: Building2,
    title: "Executive & Business",
    description: "C-suite support, project coordination, business operations, and strategic planning.",
    color: "bg-slate-50 text-slate-700 border-slate-100",
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
  },
  {
    icon: Headphones,
    title: "Customer Success",
    description: "Customer onboarding, relationship management, retention strategies, and support excellence.",
    color: "bg-pink-50 text-pink-700 border-pink-100",
    iconBg: "bg-pink-100",
    iconColor: "text-pink-600",
  },
] as const;

/* ------------------------------------------------------------------ */
/*  IndustryProgramsSection                                            */
/* ------------------------------------------------------------------ */

export function IndustryProgramsSection() {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-blue-600 font-semibold text-sm uppercase tracking-wide mb-2">
            Industry-Specific Training
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
            Programs Designed for{" "}
            <span className="text-blue-700">Every Industry</span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Choose from specialized training programs aligned with global
            industry standards. Each program combines technical expertise with
            practical, hands-on experience.
          </p>
        </div>

        {/* Industry Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {industries.map((industry) => (
            <div
              key={industry.title}
              className={`rounded-xl p-6 border ${industry.color} hover:shadow-md transition-shadow group`}
            >
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${industry.iconBg}`}
              >
                <industry.icon className={`h-6 w-6 ${industry.iconColor}`} />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{industry.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {industry.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Button asChild variant="outline" size="lg" className="font-semibold">
            <Link href="/programs">
              View All Programs <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
