import { Star } from "lucide-react";

const testimonials = [
  {
    quote:
      "We replaced four separate tools with HUMI Hub and cut our monthly software spend by more than half. The training module alone has saved us 10 hours a week in admin.",
    name: "Rachel T.",
    title: "Training Director",
    company: "Apex Learning Group",
    initials: "RT",
    color: "bg-blue-600",
  },
  {
    quote:
      "Payroll used to take our HR team an entire day. Now it's done in 20 minutes. The approval workflows and payslip generation are exactly what we needed.",
    name: "Marco L.",
    title: "Head of HR",
    company: "Meridian Corporate Services",
    initials: "ML",
    color: "bg-emerald-600",
  },
  {
    quote:
      "As a small business owner, I needed something powerful but not overwhelming. HUMI Hub gives me the visibility of an enterprise system without the enterprise complexity.",
    name: "Priya S.",
    title: "Founder & CEO",
    company: "Fortis Enterprise Solutions",
    initials: "PS",
    color: "bg-violet-600",
  },
] as const;

function Stars() {
  return (
    <div className="flex gap-0.5 mb-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
      ))}
    </div>
  );
}

export function LandingTestimonialsSection() {
  return (
    <section className="bg-slate-950 py-20 overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-14">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-400 mb-2">
            Real results
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Teams that switched. Never looked back.
          </h2>
          <p className="text-slate-400 text-lg max-w-lg mx-auto">
            Hear from the people who run their entire operation on HUMI Hub.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="bg-slate-900 border border-white/10 rounded-2xl p-7 flex flex-col hover:border-white/20 transition-colors"
            >
              <Stars />
              <blockquote className="text-slate-300 text-sm leading-relaxed flex-1 mb-6">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full ${t.color} flex items-center justify-center shrink-0`}>
                  <span className="text-white text-xs font-bold">{t.initials}</span>
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{t.name}</p>
                  <p className="text-slate-400 text-xs">{t.title}, {t.company}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-8 text-slate-500 text-sm">
          {["500+ companies onboarded", "4.9 / 5 average rating", "98% customer satisfaction"].map((item) => (
            <span key={item} className="flex items-center gap-2">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {item}
            </span>
          ))}
        </div>

      </div>
    </section>
  );
}
