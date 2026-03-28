import type { Metadata } from "next";
import { Mic } from "lucide-react";
import { InterviewPanel } from "@/components/placement/InterviewPanel";

export const metadata: Metadata = {
  title: "AI Interview Practice — Placement Services | HUMI Training Center",
  description:
    "Practice job interviews with AI-generated questions tailored to your role. Get scored feedback on communication, knowledge, problem solving, and professionalism.",
};

export default function InterviewPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-blue-900 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-700 flex items-center justify-center">
              <Mic className="w-6 h-6 text-blue-200" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold mb-3 tracking-tight">AI Interview Practice</h1>
          <p className="text-blue-100 text-base leading-relaxed">
            Practice job interviews with AI-generated questions tailored to your role. Build
            confidence and receive detailed performance feedback before the real interview.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Start Your Practice Session</h2>
            <InterviewPanel />
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "5 Questions", detail: "Per session, role-specific" },
              { label: "Instant Feedback", detail: "AI-generated scores and tips" },
              { label: "5 Score Categories", detail: "Communication, knowledge, and more" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-4 text-center"
              >
                <p className="text-sm font-bold text-blue-800">{item.label}</p>
                <p className="text-xs text-blue-600 mt-1">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
