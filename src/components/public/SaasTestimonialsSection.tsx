import { Star } from "lucide-react";

interface Testimonial {
  readonly quote: string;
  readonly name: string;
  readonly role: string;
  readonly company: string;
  readonly industry: string;
  readonly rating: number;
}

const testimonials: readonly Testimonial[] = [
  {
    quote: "HUMI Hub replaced 5 separate tools we were running. HR, training, finance, and messaging — everything is now centralized. Our team spends more time on actual work, not admin.",
    name: "Francess Ann Flosa",
    role: "Operations Director",
    company: "PhilTrain Academy",
    industry: "Training & Education",
    rating: 5,
  },
  {
    quote: "We used HUMI Hub to manage our entire HR and sales pipeline. Onboarding new staff, tracking performance, and generating reports used to take days — now it takes minutes.",
    name: "Prinze Lee",
    role: "CEO",
    company: "Nexus Business Solutions",
    industry: "Business Consulting",
    rating: 5,
  },
  {
    quote: "Managing IT assets, helpdesk tickets, and staff training from one dashboard is a game changer. The multi-tenant setup lets us oversee 3 offices with full data isolation.",
    name: "Berly Abaigar",
    role: "IT & Operations Manager",
    company: "TechReady Solutions",
    industry: "IT Services",
    rating: 5,
  },
] as const;

export function SaasTestimonialsSection() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-blue-500 font-semibold text-sm uppercase tracking-widest mb-2">
            Testimonials
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Trusted by Businesses Across Industries
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-sm">
            From training centers and HR teams to IT firms and corporate operations — here&apos;s what our clients say.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="bg-white rounded-2xl p-6 border border-gray-200 flex flex-col hover:shadow-md transition-shadow"
            >
              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-amber-400 fill-amber-400" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-gray-700 text-sm leading-relaxed mb-6 flex-1">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <div className="w-10 h-10 rounded-full bg-blue-900/40 flex items-center justify-center">
                  <span className="text-blue-700 font-bold text-sm">
                    {t.name.split(" ").map((n) => n[0]).join("")}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-500">
                    {t.role}, {t.company}
                  </p>
                  <span className="inline-block text-xs text-blue-600 font-medium mt-0.5">
                    {t.industry}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
