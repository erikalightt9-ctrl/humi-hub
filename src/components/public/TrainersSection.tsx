import {
  Star,
  Award,
  Users,
  Briefcase,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const trainerTiers = [
  {
    tier: "Basic",
    description: "Foundational training with structured curriculum and group mentorship.",
    highlights: [
      "Structured lesson plans",
      "Group Q&A sessions",
      "Assignment feedback",
      "Community access",
    ],
    color: "border-gray-200 bg-white",
    badge: "bg-gray-100 text-gray-700",
    featured: false,
  },
  {
    tier: "Professional",
    description: "Advanced training with industry-experienced trainers and personalized feedback.",
    highlights: [
      "Industry practitioner trainer",
      "Personalized mentorship",
      "Portfolio review sessions",
      "Career coaching included",
    ],
    color: "border-blue-200 bg-blue-50/50",
    badge: "bg-blue-100 text-blue-700",
    featured: true,
  },
  {
    tier: "Premium",
    description: "Elite training with top-tier trainers, 1-on-1 coaching, and priority placement.",
    highlights: [
      "Top-rated expert trainers",
      "1-on-1 coaching sessions",
      "Priority job placement",
      "Extended post-training support",
    ],
    color: "border-amber-200 bg-amber-50/50",
    badge: "bg-amber-100 text-amber-700",
    featured: false,
  },
] as const;

const trainerStats = [
  { icon: Award, value: "50+", label: "Certified Trainers" },
  { icon: Star, value: "4.8/5", label: "Average Rating" },
  { icon: Users, value: "2,400+", label: "Students Trained" },
  { icon: Briefcase, value: "15+", label: "Industry Specializations" },
] as const;

/* ------------------------------------------------------------------ */
/*  TrainersSection                                                    */
/* ------------------------------------------------------------------ */

export function TrainersSection() {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-blue-600 font-semibold text-sm uppercase tracking-wide mb-2">
            Expert Trainers
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
            Learn From{" "}
            <span className="text-blue-700">Industry Leaders</span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Our trainers are active industry professionals who bring real-world
            expertise to every session. Choose the training tier that fits your
            goals and budget.
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {trainerStats.map((stat) => (
            <div
              key={stat.label}
              className="text-center p-4 rounded-xl bg-blue-50 border border-blue-100"
            >
              <stat.icon className="h-5 w-5 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-extrabold text-gray-900">
                {stat.value}
              </p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Trainer Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {trainerTiers.map((tier) => (
            <div
              key={tier.tier}
              className={`rounded-xl p-6 border-2 ${tier.color} ${
                tier.featured ? "ring-2 ring-blue-400/30 shadow-md" : "shadow-sm"
              } hover:shadow-lg transition-shadow relative`}
            >
              {tier.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-700 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Most Popular
                </span>
              )}

              <div className="mb-4">
                <span
                  className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${tier.badge}`}
                >
                  {tier.tier} Trainer
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                {tier.description}
              </p>

              <ul className="space-y-2.5">
                {tier.highlights.map((highlight) => (
                  <li
                    key={highlight}
                    className="flex items-center gap-2 text-sm text-gray-700"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
