import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlacementHubCards } from "@/components/placement/PlacementHubCards";
import { FileText, Mic, Briefcase, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Placement Services — HUMI Hub",
  description:
    "Comprehensive career placement support including resume building, AI interview practice, job matching, and one-on-one career coaching to help you land your dream role.",
};

const HOW_IT_WORKS = [
  {
    step: 1,
    icon: FileText,
    title: "Complete Your Resume",
    description:
      "Fill out the resume builder to create a professional profile that showcases your skills and experience to employers.",
  },
  {
    step: 2,
    icon: Mic,
    title: "Practice Your Interview",
    description:
      "Use our AI interview simulator to rehearse answers, build confidence, and get detailed feedback on your performance.",
  },
  {
    step: 3,
    icon: Briefcase,
    title: "Match to Jobs",
    description:
      "Browse job listings curated for HUMI Hub graduates and apply directly to roles that align with your skills and goals.",
  },
  {
    step: 4,
    icon: Users,
    title: "Book Career Coaching",
    description:
      "Schedule a one-on-one session with a career expert for personalized advice on salary, strategy, and job search.",
  },
] as const;

export default function PlacementPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-blue-900 text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-extrabold mb-4 tracking-tight">Placement Services</h1>
          <p className="text-blue-100 text-lg leading-relaxed">
            From building your resume to landing your first client, HUMI Hub provides
            comprehensive career placement support every step of the way.
          </p>
        </div>
      </section>

      {/* Hub Cards */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900">Placement Tools</h2>
            <p className="text-gray-500 mt-2 text-sm">
              Everything you need to launch your career as a virtual assistant.
            </p>
          </div>
          <PlacementHubCards />
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-50 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900">How It Works</h2>
            <p className="text-gray-500 mt-2 text-sm">
              Four simple steps from training to employment.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map(({ step, icon: Icon, title, description }) => (
              <div key={step} className="flex flex-col items-start gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                    {step}
                  </div>
                  <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-blue-700 text-white py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-3">Ready to Launch Your Career?</h2>
          <p className="text-blue-100 text-sm mb-6 leading-relaxed">
            Enroll in a HUMI Hub training program today and gain access to all placement services
            including resume support, AI mock interviews, job matching, and career coaching.
          </p>
          <Button asChild size="lg" className="bg-white text-blue-700 hover:bg-blue-50 font-semibold">
            <Link href="/enroll">Enroll Now</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
