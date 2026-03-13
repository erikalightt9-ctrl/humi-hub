import {
  TrendingUp,
  DollarSign,
  Clock,
  MapPin,
  Globe,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const outcomes = [
  {
    icon: DollarSign,
    value: "$800 - $1,500/mo",
    label: "Average Graduate Salary",
    description: "Competitive compensation working with international clients.",
  },
  {
    icon: Clock,
    value: "30 Days",
    label: "Average Time to Placement",
    description: "85% of graduates secure positions within a month.",
  },
  {
    icon: MapPin,
    value: "100% Remote",
    label: "Work From Anywhere",
    description: "Flexible remote work opportunities with global employers.",
  },
  {
    icon: Globe,
    value: "150+",
    label: "Hiring Partners",
    description: "Network of employers across US, UK, AU, and more.",
  },
] as const;

const careerPaths = [
  {
    role: "Medical Virtual Assistant",
    salary: "$900 - $1,400/mo",
    demand: "High Demand",
  },
  {
    role: "Real Estate Transaction Coordinator",
    salary: "$800 - $1,200/mo",
    demand: "Growing",
  },
  {
    role: "Bookkeeping Specialist",
    salary: "$1,000 - $1,500/mo",
    demand: "High Demand",
  },
  {
    role: "Legal Administrative Assistant",
    salary: "$900 - $1,300/mo",
    demand: "Growing",
  },
  {
    role: "Executive Virtual Assistant",
    salary: "$1,000 - $1,800/mo",
    demand: "Very High",
  },
  {
    role: "E-Commerce Operations Specialist",
    salary: "$800 - $1,200/mo",
    demand: "Growing",
  },
] as const;

/* ------------------------------------------------------------------ */
/*  CareerPathwaysSection                                              */
/* ------------------------------------------------------------------ */

export function CareerPathwaysSection() {
  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-blue-600 font-semibold text-sm uppercase tracking-wide mb-2">
            Career Outcomes
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
            Where Your Training{" "}
            <span className="text-blue-700">Takes You</span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Our graduates work with top companies worldwide, earning competitive
            salaries while enjoying the flexibility of remote work.
          </p>
        </div>

        {/* Outcome Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
          {outcomes.map((outcome) => (
            <div
              key={outcome.label}
              className="bg-white rounded-xl p-5 border border-gray-200 text-center hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mx-auto mb-3">
                <outcome.icon className="h-5 w-5 text-blue-700" />
              </div>
              <p className="text-xl font-extrabold text-gray-900">
                {outcome.value}
              </p>
              <p className="text-sm font-medium text-blue-700 mt-1">
                {outcome.label}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {outcome.description}
              </p>
            </div>
          ))}
        </div>

        {/* Career Paths Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-700" />
              <h3 className="font-bold text-gray-900">
                Popular Career Paths for Graduates
              </h3>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {careerPaths.map((path) => (
              <div
                key={path.role}
                className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900">{path.role}</p>
                  <p className="text-sm text-gray-500">{path.salary}</p>
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    path.demand === "Very High"
                      ? "bg-green-100 text-green-700"
                      : path.demand === "High Demand"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {path.demand}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
