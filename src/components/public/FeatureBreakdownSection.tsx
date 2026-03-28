import {
  BookOpen,
  Users,
  GraduationCap,
  HeadphonesIcon,
  LayoutDashboard,
  Layers,
  Clock,
  BarChart3,
  Award,
  MessageSquare,
  Trophy,
  FileText,
  Bell,
  Shield,
  DollarSign,
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
    title: "Course Management",
    subtitle: "Create and manage courses effortlessly",
    description:
      "Build tiered programs (Basic, Pro, Advanced) with flexible pricing, auto-generated descriptions, and modular lesson structures.",
    icon: BookOpen,
    color: "bg-blue-600",
    highlights: [
      "Tiered programs with flexible pricing",
      "Module & lesson management",
      "Auto-generated course descriptions",
      "Resource & file attachments",
    ],
  },
  {
    title: "Trainer Dashboard",
    subtitle: "Give trainers full control",
    description:
      "Trainers manage their schedules, track student attendance in real-time, monitor performance, and communicate directly with students.",
    icon: Users,
    color: "bg-purple-600",
    highlights: [
      "Attendance tracking (auto-sync)",
      "Student performance monitoring",
      "Schedule & availability management",
      "Direct communication tools",
    ],
  },
  {
    title: "Student Experience",
    subtitle: "Modern and engaging learning",
    description:
      "Students get a polished dashboard with course progress, resume builder with photo validation, leaderboards, badges, and certificate downloads.",
    icon: GraduationCap,
    color: "bg-emerald-600",
    highlights: [
      "Resume builder with smart validation",
      "Leaderboards & badge rewards",
      "Certificate auto-generation",
      "Course progress tracking",
    ],
  },
  {
    title: "Support System",
    subtitle: "Never miss a concern",
    description:
      "Built-in ticketing with SLA tracking, AI auto-replies and categorization, file attachments, and real-time notifications.",
    icon: HeadphonesIcon,
    color: "bg-amber-600",
    highlights: [
      "Ticketing with SLA & priority",
      "AI auto-reply & categorization",
      "File attachments & notifications",
      "Role-based messaging restrictions",
    ],
  },
  {
    title: "Admin Super Dashboard",
    subtitle: "Full visibility and control",
    description:
      "A command center for your entire training operation — full analytics, revenue tracking, multi-tenant management, and role-based access control.",
    icon: LayoutDashboard,
    color: "bg-indigo-600",
    highlights: [
      "Full analytics (students, revenue, performance)",
      "Multi-tenant control",
      "Role-based access",
      "Revenue & payment management",
    ],
  },
] as const;

/* ------------------------------------------------------------------ */
/*  Feature detail icons                                               */
/* ------------------------------------------------------------------ */

const DETAIL_ICONS: Record<string, React.ElementType> = {
  "Tiered programs with flexible pricing": Layers,
  "Module & lesson management": BookOpen,
  "Auto-generated course descriptions": FileText,
  "Resource & file attachments": FileText,
  "Attendance tracking (auto-sync)": Clock,
  "Student performance monitoring": BarChart3,
  "Schedule & availability management": Clock,
  "Direct communication tools": MessageSquare,
  "Resume builder with smart validation": FileText,
  "Leaderboards & badge rewards": Trophy,
  "Certificate auto-generation": Award,
  "Course progress tracking": BarChart3,
  "Ticketing with SLA & priority": Bell,
  "AI auto-reply & categorization": MessageSquare,
  "File attachments & notifications": Bell,
  "Role-based messaging restrictions": Users,
  "Full analytics (students, revenue, performance)": BarChart3,
  "Multi-tenant control": Layers,
  "Role-based access": Shield,
  "Revenue & payment management": DollarSign,
};

/* ------------------------------------------------------------------ */
/*  FeatureBreakdownSection                                            */
/* ------------------------------------------------------------------ */

export function FeatureBreakdownSection() {
  return (
    <section id="features" className="py-20 bg-white scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-blue-600 font-semibold text-sm uppercase tracking-wide mb-2">
            Platform Features
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Everything You Need to Run a Training Center
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Four powerful modules that cover every aspect of your training
            operations.
          </p>
        </div>

        <div className="space-y-20">
          {features.map((feature, index) => {
            const isReversed = index % 2 !== 0;
            return (
              <div
                key={feature.title}
                className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${
                  isReversed ? "lg:direction-rtl" : ""
                }`}
              >
                {/* Text side */}
                <div className={isReversed ? "lg:order-2" : ""}>
                  <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-500 mb-6">{feature.description}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {feature.highlights.map((h) => {
                      const Icon = DETAIL_ICONS[h] ?? BookOpen;
                      return (
                        <div key={h} className="flex items-start gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                            <Icon className="h-3.5 w-3.5 text-gray-600" />
                          </div>
                          <span className="text-sm text-gray-700">{h}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Visual side — mockup card */}
                <div className={isReversed ? "lg:order-1" : ""}>
                  <FeatureMockup feature={feature} index={index} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Feature Mockup Cards                                               */
/* ------------------------------------------------------------------ */

function FeatureMockup({
  feature,
  index,
}: {
  readonly feature: Feature;
  readonly index: number;
}) {
  const mockups = [
    // Course Management
    <div key="courses" className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-gray-900 text-sm">Active Courses</h4>
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">12 courses</span>
      </div>
      <div className="space-y-3">
        {["Healthcare VA Training", "Real Estate VA Program", "Legal VA Specialization"].map((name) => (
          <div key={name} className="bg-white rounded-xl p-3 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{name}</p>
                <p className="text-xs text-gray-500 mt-0.5">3 tiers &middot; 24 lessons</p>
              </div>
              <div className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</div>
            </div>
            <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
              <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${60 + Math.random() * 30}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>,

    // Trainer Dashboard
    <div key="trainer" className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-gray-900 text-sm">Trainer Schedule</h4>
        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">This week</span>
      </div>
      <div className="space-y-2">
        {[
          { day: "Mon", time: "9:00 AM", batch: "Batch A — Healthcare", count: 18 },
          { day: "Tue", time: "2:00 PM", batch: "Batch B — Real Estate", count: 22 },
          { day: "Wed", time: "9:00 AM", batch: "Batch A — Healthcare", count: 18 },
          { day: "Thu", time: "10:00 AM", batch: "Batch C — Finance", count: 15 },
        ].map((s) => (
          <div key={`${s.day}-${s.batch}`} className="bg-white rounded-xl p-3 border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <span className="text-xs font-bold text-purple-700">{s.day}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{s.batch}</p>
                <p className="text-xs text-gray-500">{s.time}</p>
              </div>
            </div>
            <span className="text-xs text-gray-500">{s.count} students</span>
          </div>
        ))}
      </div>
    </div>,

    // Student Experience
    <div key="student" className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-gray-900 text-sm">Student Dashboard</h4>
        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Active</span>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: "Progress", value: "78%" },
          { label: "Rank", value: "#12" },
          { label: "Badges", value: "5" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-lg p-2.5 text-center border border-gray-100">
            <p className="text-lg font-bold text-gray-900">{s.value}</p>
            <p className="text-[10px] text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl p-3 border border-gray-100">
        <p className="text-xs text-gray-500 mb-2">Current Course</p>
        <p className="text-sm font-medium text-gray-900">Healthcare VA Training</p>
        <div className="mt-2 w-full bg-gray-100 rounded-full h-2">
          <div className="bg-emerald-500 h-2 rounded-full" style={{ width: "78%" }} />
        </div>
        <p className="text-[10px] text-gray-500 mt-1">18 of 24 lessons completed</p>
      </div>
    </div>,

    // Support System
    <div key="support" className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-gray-900 text-sm">Support Tickets</h4>
        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">3 open</span>
      </div>
      <div className="space-y-2">
        {[
          { title: "Can't access Module 3", priority: "High", status: "In Progress", statusColor: "bg-amber-100 text-amber-700" },
          { title: "Certificate not received", priority: "Medium", status: "AI Replied", statusColor: "bg-blue-100 text-blue-700" },
          { title: "Payment confirmation", priority: "Low", status: "Resolved", statusColor: "bg-green-100 text-green-700" },
        ].map((t) => (
          <div key={t.title} className="bg-white rounded-xl p-3 border border-gray-100">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-gray-900">{t.title}</p>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${t.statusColor}`}>
                {t.status}
              </span>
            </div>
            <p className="text-xs text-gray-500">Priority: {t.priority}</p>
          </div>
        ))}
      </div>
    </div>,

    // Admin Super Dashboard
    <div key="admin" className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-gray-900 text-sm">Admin Dashboard</h4>
        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">Live</span>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { label: "Total Revenue", value: "₱2.4M", change: "+12%" },
          { label: "Active Students", value: "847", change: "+8%" },
          { label: "Completion Rate", value: "94%", change: "+3%" },
          { label: "Avg. Rating", value: "4.8", change: "+0.2" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-lg p-2.5 border border-gray-100">
            <p className="text-[10px] text-gray-500">{s.label}</p>
            <div className="flex items-baseline gap-1.5">
              <p className="text-sm font-bold text-gray-900">{s.value}</p>
              <span className="text-[9px] text-green-600 font-medium">{s.change}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {[
          { label: "Organizations", count: 3, icon: "🏢" },
          { label: "Active Trainers", count: 18, icon: "👨‍🏫" },
          { label: "Pending Payments", count: 5, icon: "💳" },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-lg p-2.5 border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm">{item.icon}</span>
              <span className="text-xs text-gray-700">{item.label}</span>
            </div>
            <span className="text-xs font-bold text-gray-900">{item.count}</span>
          </div>
        ))}
      </div>
    </div>,
  ];

  return mockups[index] ?? mockups[0];
}
