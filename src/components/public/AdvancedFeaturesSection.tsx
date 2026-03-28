import {
  Bot,
  BarChart3,
  Bell,
  Ticket,
  Mail,
  Trophy,
  FileSearch,
  Zap,
} from "lucide-react";

const advancedFeatures = [
  { icon: Bot, title: "AI Auto-Priority Detection", description: "Automatically assess and route support tickets by urgency." },
  { icon: BarChart3, title: "Full Analytics Dashboard", description: "Revenue, enrollment, attendance, and performance at a glance." },
  { icon: Bell, title: "Real-Time Notifications", description: "Instant alerts for enrollments, payments, and messages." },
  { icon: Ticket, title: "Smart Ticket Categorization", description: "AI classifies tickets so your team can focus on solutions." },
  { icon: Mail, title: "Email & SMS Alerts", description: "Automated notifications for every critical event." },
  { icon: Trophy, title: "Gamification System", description: "Leaderboards, badges, and rankings to drive engagement." },
  { icon: FileSearch, title: "CSV Report Exports", description: "Download enrollment, revenue, attendance, and grade reports." },
  { icon: Zap, title: "Automated Workflows", description: "Waitlists, certificate issuance, and payment verification on autopilot." },
] as const;

export function AdvancedFeaturesSection() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-blue-600 font-semibold text-sm uppercase tracking-wide mb-2">
            Your Competitive Edge
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Advanced Features That Set You Apart
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Go beyond basic LMS capabilities with AI automation, real-time
            analytics, and engagement tools.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {advancedFeatures.map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-xl p-5 border border-gray-200 hover:border-blue-200 hover:shadow-md transition-all duration-200 group"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
                <f.icon className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1">{f.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
