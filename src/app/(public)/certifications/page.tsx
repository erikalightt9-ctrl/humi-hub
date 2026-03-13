import type { Metadata } from "next";
import Link from "next/link";
import {
  Award,
  BookOpen,
  CheckCircle,
  ClipboardCheck,
  FileCheck,
  Shield,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Certifications & Credentials — HUMI Training Center",
  description:
    "Earn industry-recognized VA certifications in Medical, Real Estate, or US Bookkeeping. Verifiable credentials that prove your expertise.",
};

/* ------------------------------------------------------------------ */
/*  Static data                                                        */
/* ------------------------------------------------------------------ */

interface CertificationBullet {
  readonly text: string;
}

interface Certification {
  readonly name: string;
  readonly slug: string;
  readonly duration: string;
  readonly bullets: readonly CertificationBullet[];
}

const CERTIFICATIONS: readonly Certification[] = [
  {
    name: "Certified Medical Virtual Assistant",
    slug: "medical-va",
    duration: "8 weeks",
    bullets: [
      { text: "HIPAA compliance and patient data handling" },
      { text: "Medical terminology and clinical workflows" },
      { text: "EHR system navigation and documentation" },
      { text: "AI-assisted scheduling and insurance verification" },
    ],
  },
  {
    name: "Certified Real Estate Virtual Assistant",
    slug: "real-estate-va",
    duration: "8 weeks",
    bullets: [
      { text: "MLS listing management and market research" },
      { text: "CRM automation and lead management" },
      { text: "Transaction coordination and document processing" },
      { text: "AI-powered marketing and content creation" },
    ],
  },
  {
    name: "Certified US Bookkeeping Virtual Assistant",
    slug: "us-bookkeeping-va",
    duration: "8 weeks",
    bullets: [
      { text: "QuickBooks Online setup and management" },
      { text: "Accounts payable/receivable processing" },
      { text: "Bank reconciliation and financial reporting" },
      { text: "AI-assisted data entry and categorization" },
    ],
  },
] as const;

interface RequirementStep {
  readonly step: number;
  readonly title: string;
  readonly description: string;
  readonly icon: React.ComponentType<{ readonly className?: string }>;
}

const REQUIREMENTS: readonly RequirementStep[] = [
  {
    step: 1,
    title: "Complete All Course Lessons",
    description:
      "Work through every module and lesson in your chosen specialization program.",
    icon: BookOpen,
  },
  {
    step: 2,
    title: "Pass Quizzes with 70%+ Score",
    description:
      "Demonstrate your knowledge by passing all module quizzes with at least a 70% score.",
    icon: ClipboardCheck,
  },
  {
    step: 3,
    title: "Submit All Assignments",
    description:
      "Complete and submit every hands-on assignment to prove real-world application skills.",
    icon: FileCheck,
  },
  {
    step: 4,
    title: "Complete AI Practice Assessments",
    description:
      "Pass AI-powered practice scenarios that simulate real client interactions and tasks.",
    icon: Zap,
  },
] as const;

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function CertificationsPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-blue-900 text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <Award className="h-12 w-12 text-amber-300 mx-auto mb-4" />
          <h1 className="text-4xl font-extrabold mb-4">
            Certifications & Credentials
          </h1>
          <p className="text-blue-100 text-lg leading-relaxed">
            Earn industry-recognized certifications that validate your
            expertise, boost your credibility, and open doors to higher-paying
            VA roles worldwide.
          </p>
        </div>
      </section>

      {/* Certification Types */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">
              Our Certifications
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Each certification is earned by completing our rigorous training
              program and demonstrating mastery of essential skills.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {CERTIFICATIONS.map((cert) => (
              <div
                key={cert.slug}
                className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col"
              >
                {/* Card Header */}
                <div className="bg-blue-50 p-6 border-b border-blue-100">
                  <div className="bg-amber-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                    <Award className="h-6 w-6 text-amber-700" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg">
                    {cert.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Duration: {cert.duration}
                  </p>
                </div>

                {/* Card Body */}
                <div className="p-6 flex-1 flex flex-col">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                    What it validates
                  </p>
                  <ul className="space-y-2 mb-6 flex-1">
                    {cert.bullets.map((bullet) => (
                      <li
                        key={bullet.text}
                        className="flex items-start gap-2 text-sm text-gray-600"
                      >
                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                        {bullet.text}
                      </li>
                    ))}
                  </ul>

                  <Button asChild className="w-full">
                    <Link href={`/programs/${cert.slug}`}>Enroll to Earn</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">
              How to Earn Your Certificate
            </h2>
            <p className="text-gray-600">
              Follow these four steps to earn your official HUMI Training Center
              certification.
            </p>
          </div>

          <div className="space-y-6">
            {REQUIREMENTS.map((req) => (
              <div
                key={req.step}
                className="flex items-start gap-4 bg-white rounded-xl p-6 border border-gray-100 shadow-sm"
              >
                {/* Step Number */}
                <div className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm">
                  {req.step}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <req.icon className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">{req.title}</h3>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {req.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Verification */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <Shield className="h-10 w-10 text-blue-600 mx-auto mb-4" />
          <h2 className="text-3xl font-extrabold text-gray-900 mb-3">
            Verify a Certificate
          </h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            All HUMI Training Center certificates come with a unique verification
            code. Employers and clients can verify the authenticity and validity
            of any certificate online.
          </p>
          <Button asChild variant="outline" size="lg">
            <Link href="/verify">Verify a Certificate</Link>
          </Button>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-blue-700 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold mb-4">
            Earn Your Certification
          </h2>
          <p className="text-blue-100 mb-8 text-lg">
            Stand out from the competition with a verified HUMI Training Center
            certification. Enroll in your chosen specialization today.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-white text-blue-700 font-bold hover:bg-blue-50"
          >
            <Link href="/enroll">Enroll Now</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
