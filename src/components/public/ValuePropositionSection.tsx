import { LayoutDashboard, Bot, MessageCircle, BarChart3 } from "lucide-react";

const values = [
  {
    icon: LayoutDashboard,
    title: "Centralized Management",
    description: "Replace spreadsheets with a single platform for students, trainers, courses, and payments.",
    color: "bg-blue-600",
  },
  {
    icon: Bot,
    title: "AI-Powered Automation",
    description: "Auto-categorize tickets, generate smart replies, and detect priority issues instantly.",
    color: "bg-purple-600",
  },
  {
    icon: MessageCircle,
    title: "Built-in Messaging & Support",
    description: "Real-time messaging, ticketing with SLA tracking, and file attachments — all in one place.",
    color: "bg-emerald-600",
  },
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    description: "Track enrollment trends, revenue, attendance, and student performance in a live dashboard.",
    color: "bg-amber-600",
  },
] as const;

export function ValuePropositionSection() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-blue-600 font-semibold text-sm uppercase tracking-wide mb-2">
            Why choose us
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Run Your Entire Training Business in One Platform
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Stop juggling multiple tools. Our all-in-one platform handles
            everything from enrollment to certification.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((v) => (
            <div
              key={v.title}
              className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
            >
              <div className={`w-12 h-12 rounded-xl ${v.color} flex items-center justify-center mb-4`}>
                <v.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{v.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{v.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
