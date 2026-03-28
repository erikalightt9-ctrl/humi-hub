"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FaqItem {
  readonly question: string;
  readonly answer: string;
}

const faqs: readonly FaqItem[] = [
  {
    question: "Can I white-label the platform?",
    answer:
      "Yes! Our Enterprise plan includes full white-label capability. Use your own logo, colors, and custom domain — your clients will never see our branding.",
  },
  {
    question: "Can I customize features?",
    answer:
      "Absolutely. The platform is modular — you can enable or disable features per tenant. Enterprise customers get custom integrations and workflows.",
  },
  {
    question: "Is there a free trial?",
    answer:
      "Yes. Our Basic plan is free to get started with up to 50 students and 3 courses. No credit card required. Upgrade anytime as you grow.",
  },
  {
    question: "How secure is the system?",
    answer:
      "We use enterprise-grade security with data isolation per tenant, encrypted communications, role-based access control, and regular security audits. Your data is hosted on secure cloud infrastructure with 99.9% uptime SLA.",
  },
  {
    question: "Can I migrate existing data?",
    answer:
      "Yes. Our Enterprise plan includes data migration assistance. We can import student records, course data, and payment history from spreadsheets or other LMS platforms.",
  },
  {
    question: "Do you support multiple payment methods?",
    answer:
      "Yes. The platform supports PayMongo, Stripe, bank transfers, and manual payment verification — all with automated receipt tracking.",
  },
] as const;

function FaqAccordionItem({ item }: { readonly item: FaqItem }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium text-gray-900 text-sm pr-4">{item.question}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-gray-400 shrink-0 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div className="px-5 pb-5 -mt-1">
          <p className="text-sm text-gray-600 leading-relaxed">{item.answer}</p>
        </div>
      )}
    </div>
  );
}

export function FaqSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-blue-600 font-semibold text-sm uppercase tracking-wide mb-2">
            FAQ
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq) => (
            <FaqAccordionItem key={faq.question} item={faq} />
          ))}
        </div>
      </div>
    </section>
  );
}
