import { Star } from "lucide-react";

interface Testimonial {
  readonly quote: string;
  readonly name: string;
  readonly role: string;
  readonly company: string;
  readonly rating: number;
}

const testimonials: readonly Testimonial[] = [
  {
    quote: "This platform replaced 5 tools we were using. Everything is now in one place — enrollment, payments, analytics, and messaging.",
    name: "Maria Santos",
    role: "Operations Director",
    company: "PhilTrain Academy",
    rating: 5,
  },
  {
    quote: "Our training operations became 10x faster. The AI ticketing alone saved us 20 hours per week on student support.",
    name: "James Reyes",
    role: "CEO",
    company: "Global Skills Institute",
    rating: 5,
  },
  {
    quote: "The multi-tenant setup is perfect. We manage 3 training centers from one admin panel with complete data isolation.",
    name: "Angela Cruz",
    role: "IT Manager",
    company: "TechReady Solutions",
    rating: 5,
  },
] as const;

export function SaasTestimonialsSection() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-blue-600 font-semibold text-sm uppercase tracking-wide mb-2">
            Testimonials
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Trusted by Training Centers
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="bg-white rounded-2xl p-6 border border-gray-200 flex flex-col"
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
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-700 font-bold text-sm">
                    {t.name.split(" ").map((n) => n[0]).join("")}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-500">
                    {t.role}, {t.company}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
