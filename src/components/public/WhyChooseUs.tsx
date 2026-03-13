import { Bot, Award, Users, Briefcase, Wrench, HeartHandshake } from "lucide-react";

const reasons = [
  {
    icon: Bot,
    title: "AI-Enhanced Curriculum",
    description:
      "Learn to use AI assistants, automation tools, and smart workflows in every course module. Graduate ready to work smarter from day one.",
  },
  {
    icon: Award,
    title: "Industry Certification",
    description:
      "Earn a VA + AI Proficiency Certificate recognized by international employers in the US, Australia, and UK.",
  },
  {
    icon: Users,
    title: "Expert Instructors",
    description:
      "Learn from practicing VAs who use AI tools daily with real international clients — not just textbook theory.",
  },
  {
    icon: Briefcase,
    title: "Job Placement Support",
    description:
      "85% of graduates land their first client within 30 days through our network of 150+ hiring partners worldwide.",
  },
  {
    icon: Wrench,
    title: "Hands-On AI Training",
    description:
      "Practice with real AI tools in every lesson — applied workflows for drafting, summarizing, automating, and more.",
  },
  {
    icon: HeartHandshake,
    title: "Lifetime Community",
    description:
      "Join 2,400+ AI-powered VAs sharing tools, tips, job leads, and networking opportunities for life.",
  },
];

export function WhyChooseUs() {
  return (
    <section className="py-16 bg-gray-50 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Why Choose HUMI Training Center?</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            We don&apos;t just teach VA skills — we train you to combine human expertise with AI tools,
            giving you the edge to earn more and deliver faster.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {reasons.map((reason) => (
            <div
              key={reason.title}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <reason.icon className="h-6 w-6 text-blue-700" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{reason.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{reason.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
