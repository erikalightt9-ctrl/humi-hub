import type { Metadata } from "next";
import { FileText, Info } from "lucide-react";
import { ResumeForm } from "@/components/placement/ResumeForm";

export const metadata: Metadata = {
  title: "Resume Builder — Placement Services | HUMI Training Center",
  description:
    "Build and save your professional resume to your HUMI profile. Used to match you with the best job opportunities.",
};

export default function ResumePage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-blue-900 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-700 flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-200" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold mb-3 tracking-tight">Resume Builder</h1>
          <p className="text-blue-100 text-base leading-relaxed">
            Create a polished, professional resume that highlights your training, skills, and
            experience to attract top international employers.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 px-4">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Info Box */}
          <div className="flex gap-3 rounded-xl bg-blue-50 border border-blue-100 px-5 py-4">
            <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800 leading-relaxed">
              Your resume is saved to your profile and used to match you with the best job
              opportunities available through HUMI&apos;s employer network. Keeping it up to date
              improves your chances of being discovered by hiring companies.
            </p>
          </div>

          {/* Form */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-6">Your Resume Details</h2>
            <ResumeForm />
          </div>
        </div>
      </section>
    </div>
  );
}
