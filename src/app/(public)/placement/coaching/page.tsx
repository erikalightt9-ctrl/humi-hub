import type { Metadata } from "next";
import { Users, CheckCircle } from "lucide-react";
import { CoachingForm } from "@/components/placement/CoachingForm";

export const metadata: Metadata = {
  title: "Career Coaching — Placement Services | HUMI Hub",
  description:
    "Book a one-on-one career coaching session with an expert to get personalized guidance on your resume, interview strategy, and salary negotiation.",
};

const COACHING_TOPICS = [
  {
    title: "Resume Review",
    description:
      "Get a thorough review of your resume with actionable feedback to make it stand out to hiring managers.",
  },
  {
    title: "Interview Strategy",
    description:
      "Learn proven techniques for answering tough questions, managing nerves, and presenting your best self.",
  },
  {
    title: "Salary Negotiation",
    description:
      "Understand your market value and learn how to confidently negotiate a fair compensation package.",
  },
] as const;

export default function CoachingPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-blue-900 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-700 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-200" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold mb-3 tracking-tight">Career Coaching</h1>
          <p className="text-blue-100 text-base leading-relaxed">
            Get one-on-one guidance from an experienced career coach. Whether you need help with
            your resume, interview prep, or salary strategy, our coaches are here to support you.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Sidebar */}
          <aside className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-4">What Coaching Covers</h2>
              <ul className="space-y-4">
                {COACHING_TOPICS.map((topic) => (
                  <li key={topic.title} className="flex gap-3">
                    <CheckCircle className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{topic.title}</p>
                      <p className="text-xs text-gray-500 leading-relaxed mt-0.5">
                        {topic.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl bg-teal-50 border border-teal-100 px-4 py-4">
              <p className="text-sm font-semibold text-teal-800 mb-1">Response Time</p>
              <p className="text-xs text-teal-700 leading-relaxed">
                Our coaching team will reach out within 24 hours to confirm your session and
                provide a calendar invite.
              </p>
            </div>
          </aside>

          {/* Form */}
          <div className="lg:col-span-3">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Book a Session</h2>
            <CoachingForm />
          </div>
        </div>
      </section>
    </div>
  );
}
