import { Star } from "lucide-react";

const testimonials = [
  {
    quote:
      "Before HUMI Hub, I was waiting three days for a consolidated company report. Now I open one screen and see Finance, HR, and Sales — live. The decision-making speed alone justified the switch.",
    name: "David R.",
    title: "CEO",
    company: "Nexus Group Holdings",
    initials: "DR",
    color: "bg-blue-700",
  },
  {
    quote:
      "Our Finance team was buried in spreadsheets pulled from four different systems. HUMI Hub gives us one source of truth — payroll, expenses, and accounting records all connected. Month-end close went from a week to two days.",
    name: "Sofia M.",
    title: "Chief Financial Officer",
    company: "Meridian Enterprise Corp",
    initials: "SM",
    color: "bg-violet-600",
  },
  {
    quote:
      "As COO I need to know what every department is doing without being in every meeting. HUMI Hub's cross-department visibility is exactly that — I see blockers before they become problems.",
    name: "James K.",
    title: "Chief Operating Officer",
    company: "Fortis Solutions Group",
    initials: "JK",
    color: "bg-emerald-600",
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
            Leaders who finally have the visibility they needed.
          </h2>
          <p className="text-slate-400 text-lg max-w-lg mx-auto">
            Hear from the executives and operators who run their entire company on HUMI Hub.
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
