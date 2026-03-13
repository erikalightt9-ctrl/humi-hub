import {
  Monitor,
  Video,
  FileText,
  MessageSquare,
  BarChart3,
  Download,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const features = [
  {
    icon: Monitor,
    title: "Interactive LMS Platform",
    description:
      "Access structured lessons, track your progress, and manage assignments through our modern learning management system.",
  },
  {
    icon: Video,
    title: "Live & Recorded Sessions",
    description:
      "Attend live training sessions with expert trainers or review recorded sessions at your own pace and schedule.",
  },
  {
    icon: FileText,
    title: "Real-World Assignments",
    description:
      "Complete practical assignments modeled after actual industry tasks — build a portfolio while you learn.",
  },
  {
    icon: MessageSquare,
    title: "Trainer Mentorship",
    description:
      "Get personalized feedback and guidance from your assigned trainer throughout the entire program.",
  },
  {
    icon: BarChart3,
    title: "Progress Tracking",
    description:
      "Monitor your completion rate, quiz scores, and assignment grades with detailed analytics and dashboards.",
  },
  {
    icon: Download,
    title: "Downloadable Resources",
    description:
      "Access templates, cheat sheets, tool guides, and reference materials you can use in your career.",
  },
] as const;

/* ------------------------------------------------------------------ */
/*  LearningExperienceSection                                          */
/* ------------------------------------------------------------------ */

export function LearningExperienceSection() {
  return (
    <section className="py-20 px-4 bg-blue-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-blue-600 font-semibold text-sm uppercase tracking-wide mb-2">
            Learning Experience
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
            A Platform Built for{" "}
            <span className="text-blue-700">Professional Growth</span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Our comprehensive learning platform provides everything you need to
            succeed — from structured curriculum to hands-on practice and expert
            mentorship.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white rounded-xl p-6 shadow-sm border border-blue-100 hover:shadow-md transition-shadow"
            >
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="h-6 w-6 text-blue-700" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
