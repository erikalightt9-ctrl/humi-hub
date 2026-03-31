import type { Metadata } from "next";
import { JobBoard } from "@/components/public/JobBoard";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Job Board — HUMI Hub",
  description: "Browse job opportunities for Virtual Assistants.",
};

export default function JobBoardPage() {
  return (
    <div className="bg-white">
      {/* Hero Header */}
      <section className="bg-blue-900 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-extrabold mb-4">VA Job Board</h1>
          <p className="text-blue-100 text-lg leading-relaxed">
            Browse the latest job opportunities for trained Virtual Assistants.
            Filter by specialization and find your perfect role.
          </p>
        </div>
      </section>

      {/* Job Board */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <JobBoard />
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-blue-700 text-white py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold mb-4">Want These Opportunities?</h2>
          <p className="text-blue-100 mb-8 text-lg">
            Get trained as an AI-powered Virtual Assistant and unlock access to
            high-paying remote jobs worldwide.
          </p>
          <Button asChild size="lg" className="bg-white text-blue-700 font-bold hover:bg-blue-50">
            <Link href="/enroll">Enroll Now</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
