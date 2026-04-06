import {
  GraduationCap,
  Users,
  Settings,
  Monitor,
  TrendingUp,
  Landmark,
  BookOpen,
  Clock,
  BarChart3,
  FileText,
  DollarSign,
  Shield,
  Zap,
  UserCheck,
  PieChart,
  Briefcase,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Feature data                                                       */
/* ------------------------------------------------------------------ */

interface Feature {
  readonly title: string;
  readonly subtitle: string;
  readonly description: string;
  readonly icon: React.ElementType;
  readonly color: string;
  readonly highlights: readonly string[];
}

const features: readonly Feature[] = [
  {
    title: "Training Management",
    subtitle: "Full LMS built for results",
    description:
      "Manage courses, schedules, trainers, and participants with ease. From enrollment to certification, every step is tracked and automated.",
    icon: GraduationCap,
    color: "bg-blue-600",
    highlights: [
      "Course & curriculum builder",
      "Trainer schedule management",
      "Attendance & progress tracking",
      "Certificate auto-generation",
    ],
  },
  {
    title: "Human Resources",
    subtitle: "People management made simple",
    description:
      "Handle employee records, payroll processing, attendance, and performance tracking in one centralized HR system.",
    icon: Users,
    color: "bg-violet-600",
    highlights: [
      "Employee records & onboarding",
      "Payroll & leave management",
      "Attendance & timekeeping",
      "Performance reviews",
    ],
  },
  {
    title: "Administration",
    subtitle: "Keep operations running smoothly",
    description:
      "Streamline internal processes, documentation, and daily operations so your admin team can work faster with fewer errors.",
    icon: Settings,
    color: "bg-indigo-600",
    highlights: [
      "Document management",
      "Internal workflow automation",
      "Task assignment & tracking",
      "Company-wide announcements",
    ],
  },
  {
    title: "IT Systems & Automation",
    subtitle: "Digitize your entire workflow",
    description:
      "Manage IT assets, automate repetitive processes, and keep your systems running efficiently without heavy technical overhead.",
    icon: Monitor,
    color: "bg-cyan-600",
    highlights: [
      "IT asset & license tracking",
      "Helpdesk & ticket management",
      "Workflow digitization",
      "System health monitoring",
    ],
  },
  {
    title: "Sales Management",
    subtitle: "Track and close more deals",
    description:
      "Monitor your full sales pipeline, manage leads, and generate performance reports so your team always knows where to focus.",
    icon: TrendingUp,
    color: "bg-orange-600",
    highlights: [
      "Lead & pipeline tracking",
      "Sales performance reports",
      "Deal stage management",
      "Client history & notes",
    ],
  },
  {
    title: "Finance & Accounting",
    subtitle: "Stay on top of your numbers",
    description:
      "Organized and accurate financial reporting tools to manage invoices, expenses, and revenue — all in one place.",
    icon: Landmark,
    color: "bg-emerald-600",
    highlights: [
      "Invoice & billing management",
      "Expense tracking",
      "Revenue reporting",
      "Financial dashboards",
    ],
  },
] as const;

/* ------------------------------------------------------------------ */
/*  Detail icon map                                                    */
/* ------------------------------------------------------------------ */

const DETAIL_ICONS: Record<string, React.ElementType> = {
  "Course & curriculum builder":        BookOpen,
  "Trainer schedule management":        Clock,
  "Attendance & progress tracking":     BarChart3,
  "Certificate auto-generation":        FileText,
  "Employee records & onboarding":      UserCheck,
  "Payroll & leave management":         DollarSign,
  "Attendance & timekeeping":           Clock,
  "Performance reviews":                BarChart3,
  "Document management":                FileText,
  "Internal workflow automation":       Zap,
  "Task assignment & tracking":         Settings,
  "Company-wide announcements":         Users,
  "IT asset & license tracking":        Shield,
  "Helpdesk & ticket management":       Briefcase,
  "Workflow digitization":              Zap,
  "System health monitoring":           Monitor,
  "Lead & pipeline tracking":           TrendingUp,
  "Sales performance reports":          PieChart,
  "Deal stage management":              BarChart3,
  "Client history & notes":             FileText,
  "Invoice & billing management":       FileText,
  "Expense tracking":                   DollarSign,
  "Revenue reporting":                  PieChart,
  "Financial dashboards":               BarChart3,
};

/* ------------------------------------------------------------------ */
/*  FeatureBreakdownSection                                            */
/* ------------------------------------------------------------------ */

export function FeatureBreakdownSection() {
  return (
    <section id="features" className="py-20 bg-white scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="text-blue-400 font-semibold text-sm uppercase tracking-wide mb-2">
            Platform Features
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Comprehensive Business Solutions
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Six powerful modules that cover every department of your business —
            from training and HR to sales, finance, and IT.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-gray-100 bg-gray-50 p-6 hover:shadow-md transition-shadow"
            >
              {/* Icon + title */}
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl ${feature.color} flex items-center justify-center shrink-0`}>
                  <feature.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide leading-none mb-0.5">
                    {feature.subtitle}
                  </p>
                  <h3 className="text-sm font-bold text-gray-900">{feature.title}</h3>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-gray-500 leading-relaxed mb-4">{feature.description}</p>

              {/* Highlights */}
              <div className="space-y-2">
                {feature.highlights.map((h) => {
                  const Icon = DETAIL_ICONS[h] ?? BookOpen;
                  return (
                    <div key={h} className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-white border border-gray-200 flex items-center justify-center shrink-0">
                        <Icon className="h-3 w-3 text-gray-500" />
                      </div>
                      <span className="text-xs text-gray-600">{h}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
