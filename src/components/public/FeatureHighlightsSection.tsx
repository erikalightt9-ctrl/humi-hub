import {
  LayoutDashboard,
  Users,
  Landmark,
  TrendingUp,
  Monitor,
  GraduationCap,
  Check,
} from "lucide-react";

const features = [
  {
    icon: LayoutDashboard,
    title: "Executive Command Center",
    tagline: "Company-wide visibility in one screen",
    color: "bg-blue-700",
    text: "text-blue-700",
    points: [
      "Cross-department KPIs updated in real time",
      "AI-generated operational narratives for leadership",
      "Pending tasks and approvals across all teams",
      "Role-based views — executives see everything",
    ],
  },
  {
    icon: Users,
    title: "HR & People Operations",
    tagline: "Every people process, fully connected",
    color: "bg-emerald-600",
    text: "text-emerald-600",
    points: [
      "Leave, attendance, and payroll in one place",
      "Employee profiles, documents, and onboarding",
      "Approval workflows that route automatically",
      "Workforce analytics with AI insights",
    ],
  },
  {
    icon: Landmark,
    title: "Finance & Accounting",
    tagline: "Full financial visibility for leadership",
    color: "bg-violet-600",
    text: "text-violet-600",
    points: [
      "Assets, liabilities, and bank account records",
      "Accounting data accessible to finance users",
      "Payroll integration with financial reporting",
      "Revenue and expense tracking by period",
    ],
    badge: "Coming soon",
  },
  {
    icon: TrendingUp,
    title: "Sales & Revenue",
    tagline: "Pipeline and performance, always visible",
    color: "bg-amber-500",
    text: "text-amber-600",
    points: [
      "Sales pipeline tracking by team and rep",
      "Revenue performance vs. targets",
      "Deal history and activity logs",
      "Leadership revenue dashboard",
    ],
    badge: "Coming soon",
  },
  {
    icon: Monitor,
    title: "IT & Infrastructure",
    tagline: "Systems and technical workflows, managed",
    color: "bg-rose-600",
    text: "text-rose-600",
    points: [
      "IT asset and inventory management",
      "Repair and maintenance request tracking",
      "Infrastructure status visible to executives",
      "Technical workflow assignment and resolution",
    ],
    badge: "Coming soon",
  },
  {
    icon: GraduationCap,
    title: "Training & Learning",
    tagline: "Structured development for every role",
    color: "bg-cyan-600",
    text: "text-cyan-700",
    points: [
      "Build and assign courses by department or role",
      "Quizzes, certificates, and completion tracking",
      "White-label portals for clients and partners",
      "Learning progress feeds executive dashboard",
    ],
  },
] as const;

/* ------------------------------------------------------------------ */
/*  FeatureHighlightsSection                                           */
/* ------------------------------------------------------------------ */

export function FeatureHighlightsSection() {
  return (
    <section className="bg-gray-50 py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-600 mb-2">
            One platform. Every department.
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
            Built for your whole company — not just one team.
          </h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            Six integrated modules, each purpose-built for its department,
            all feeding into a single executive view.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="relative border rounded-2xl p-6 bg-white hover:shadow-md transition-shadow"
            >
              {"badge" in f && f.badge && (
                <span className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-widest bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full">
                  {f.badge}
                </span>
              )}

              <div className={`h-11 w-11 rounded-xl ${f.color} flex items-center justify-center mb-4`}>
                <f.icon className="h-5 w-5 text-white" />
              </div>

              <h3 className="text-lg font-bold text-slate-900 mb-1">{f.title}</h3>
              <p className={`text-sm font-medium ${f.text} mb-4`}>{f.tagline}</p>

              <ul className="space-y-2">
                {f.points.map((pt) => (
                  <li key={pt} className="flex items-start gap-2 text-sm text-slate-600">
                    <Check className={`h-4 w-4 ${f.text} shrink-0 mt-0.5`} />
                    {pt}
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
