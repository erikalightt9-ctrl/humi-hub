import { TrendingDown, TrendingUp, Clock, Zap } from "lucide-react";

const stats = [
  {
    icon: TrendingDown,
    value: "70%",
    label: "Less Admin Work",
    description: "Automate enrollment, payments, and reports",
    color: "text-blue-600 bg-blue-50",
  },
  {
    icon: TrendingUp,
    value: "3x",
    label: "Faster Operations",
    description: "From enrollment to certification",
    color: "text-emerald-600 bg-emerald-50",
  },
  {
    icon: Clock,
    value: "90%",
    label: "Faster Support Response",
    description: "AI auto-replies handle common questions",
    color: "text-purple-600 bg-purple-50",
  },
  {
    icon: Zap,
    value: "2x",
    label: "Higher Completion",
    description: "Gamification drives student engagement",
    color: "text-amber-600 bg-amber-50",
  },
] as const;

export function RoiSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-blue-600 font-semibold text-sm uppercase tracking-wide mb-2">
            Business Impact
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Why Training Centers Choose Us
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Real results from real training businesses using the platform.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div
              key={s.label}
              className="text-center p-6 rounded-2xl bg-gray-50 border border-gray-100"
            >
              <div className={`w-14 h-14 rounded-xl ${s.color} flex items-center justify-center mx-auto mb-4`}>
                <s.icon className="h-7 w-7" />
              </div>
              <p className="text-4xl font-extrabold text-gray-900 mb-1">{s.value}</p>
              <p className="font-semibold text-gray-700 text-sm mb-1">{s.label}</p>
              <p className="text-xs text-gray-500">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
