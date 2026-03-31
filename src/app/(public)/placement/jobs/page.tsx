import type { Metadata } from "next";
import { Briefcase } from "lucide-react";
import { JobMatchBoard } from "@/components/placement/JobMatchBoard";

export const metadata: Metadata = {
  title: "Job Marketplace — Placement Services | Humi Hub",
  description:
    "Browse curated job listings matched to your skills and apply directly through Humi Hub's employer network.",
};

export default function JobsPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-blue-900 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-700 flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-blue-200" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold mb-3 tracking-tight">Job Marketplace</h1>
          <p className="text-blue-100 text-base leading-relaxed">
            Discover remote opportunities with US, Australian, and UK employers. Every listing is
            curated for Humi Hub graduates with verified skills and training.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <JobMatchBoard />
        </div>
      </section>
    </div>
  );
}
