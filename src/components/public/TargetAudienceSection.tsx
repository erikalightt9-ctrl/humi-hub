import { Building2, GraduationCap, Monitor, BookOpenCheck } from "lucide-react";

const audiences = [
  {
    icon: Building2,
    title: "Corporate Training Providers",
    description: "Streamline employee development programs with centralized management and analytics.",
    color: "bg-blue-100 text-blue-700",
  },
  {
    icon: GraduationCap,
    title: "Vocational & Skills Centers",
    description: "Manage hands-on training programs with attendance tracking and certifications.",
    color: "bg-purple-100 text-purple-700",
  },
  {
    icon: Monitor,
    title: "Online Course Providers",
    description: "Deliver digital learning with built-in messaging, quizzes, and leaderboards.",
    color: "bg-emerald-100 text-emerald-700",
  },
  {
    icon: BookOpenCheck,
    title: "Review & Certification Centers",
    description: "Track student progress, manage exam prep, and issue certificates automatically.",
    color: "bg-amber-100 text-amber-700",
  },
] as const;

export function TargetAudienceSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-blue-600 font-semibold text-sm uppercase tracking-wide mb-2">
            Who it&apos;s for
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Built for Modern Training Businesses
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Designed for organizations that deliver training at scale — from
            small academies to enterprise training divisions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {audiences.map((a) => (
            <div
              key={a.title}
              className="bg-gray-50 rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 border border-gray-100"
            >
              <div className={`w-12 h-12 rounded-xl ${a.color} flex items-center justify-center mb-4`}>
                <a.icon className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{a.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{a.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
