import type { Metadata } from "next";
import { Bot, ShieldCheck, Globe, Zap, Users, Wrench } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about HUMI Hub — pioneering the VA + AI model for Filipino Virtual Assistants serving global clients.",
};

const values = [
  {
    icon: Bot,
    title: "Human-First Technology",
    description:
      "We believe AI is a tool, not a replacement. Every course teaches VAs to use AI while maintaining judgment and accountability.",
  },
  {
    icon: Zap,
    title: "Excellence Through Innovation",
    description:
      "We continuously update our curriculum with the latest AI tools and VA best practices to keep you ahead of the curve.",
  },
  {
    icon: Globe,
    title: "Filipino Global Talent",
    description:
      "We believe Filipino VAs are world-class — and when equipped with AI tools, they become unstoppable in the global market.",
  },
  {
    icon: Wrench,
    title: "Practical Application",
    description:
      "Theory without practice is useless. Every lesson includes hands-on AI tool exercises with real-world scenarios.",
  },
  {
    icon: Users,
    title: "Community & Growth",
    description:
      "Learning doesn't stop at graduation. Our community of 2,400+ VAs supports lifelong growth, job leads, and collaboration.",
  },
  {
    icon: ShieldCheck,
    title: "Integrity & Accountability",
    description:
      "VAs are trusted with business-critical tasks. We train for responsibility and quality — not shortcuts.",
  },
];

const team = [
  {
    name: "Maria Santos",
    role: "Founder & CEO",
    bio: "10+ years in healthcare administration. Pioneer of the VA + AI training model. Built HUMI Hub to bridge Filipino talent and global opportunity.",
  },
  {
    name: "Jose Reyes",
    role: "Head of Curriculum & AI Integration",
    bio: "Former US-based bookkeeper and CPA. Designed our AI-enhanced Bookkeeping VA program, integrating tools like QuickBooks AI and automated reconciliation.",
  },
  {
    name: "Ana Dela Cruz",
    role: "Lead Instructor — Real Estate VA",
    bio: "Licensed real estate broker with 7 years of remote experience. Teaches AI-powered listing management, CRM automation, and smart transaction coordination.",
  },
  {
    name: "Dr. Ramon Cruz",
    role: "Lead Instructor — Medical VA",
    bio: "Registered nurse and certified medical coder. Expert in AI-assisted clinical documentation, HIPAA compliance, and EHR workflow optimization.",
  },
];

export default function AboutPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-blue-900 text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-extrabold mb-4">About HUMI Hub</h1>
          <p className="text-blue-100 text-lg leading-relaxed">
            We are a Philippine-based training institution pioneering the{" "}
            <strong className="text-white">VA + AI collaboration model</strong> —
            equipping Filipino professionals with both specialized VA skills and AI proficiency
            to build thriving remote careers with US, Australian, and UK clients.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-block bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4">
              Our Mission
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
              Building AI-Powered Filipino Virtual Assistants
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Our mission is to equip Filipino professionals with specialized VA skills{" "}
              <strong className="text-gray-900">AND</strong> AI proficiency, creating the most
              productive virtual assistants in the global market.
            </p>
            <p className="text-gray-600 leading-relaxed">
              We teach that AI is a speed and automation tool — while human VAs provide the judgment,
              accountability, and communication that no AI can replace. The combination makes our
              graduates 3x more productive than traditional VAs.
            </p>
          </div>
          <div className="bg-blue-50 rounded-2xl p-8">
            <div className="inline-block bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4">
              Our Vision
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              The Leading VA + AI Training Institution in Southeast Asia
            </h3>
            <p className="text-gray-600 leading-relaxed">
              We envision a future where HUMI Hub graduates are the first choice for
              employers worldwide — known for combining human expertise with AI efficiency to
              deliver faster, smarter, and more accountable results.
            </p>
          </div>
        </div>
      </section>

      {/* Our Approach */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-block bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4">
              Our Approach
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
              Human VA + AI = The Future
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-3">What AI Handles</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <Bot className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                  First drafts of emails, proposals, and documents
                </li>
                <li className="flex items-start gap-2">
                  <Bot className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                  Information sorting, summarizing, and formatting
                </li>
                <li className="flex items-start gap-2">
                  <Bot className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                  Templates, checklists, and routine automation
                </li>
                <li className="flex items-start gap-2">
                  <Bot className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                  Data entry, categorization, and report generation
                </li>
              </ul>
            </div>
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
              <h3 className="font-bold text-gray-900 mb-3">What Our VAs Handle</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                  Decision-making, prioritization, and judgment calls
                </li>
                <li className="flex items-start gap-2">
                  <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                  Client communication and relationship management
                </li>
                <li className="flex items-start gap-2">
                  <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                  Verification, quality assurance, and final delivery
                </li>
                <li className="flex items-start gap-2">
                  <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                  End-to-end process ownership and accountability
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Our Core Values</h2>
            <p className="text-gray-600">The principles that guide everything we do.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((value) => (
              <div
                key={value.title}
                className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm"
              >
                <value.icon className="h-8 w-8 text-blue-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">{value.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Meet Our Team</h2>
            <p className="text-gray-600">
              Experienced professionals who use AI tools daily — teaching you to do the same.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member) => (
              <div
                key={member.name}
                className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm text-center"
              >
                <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-blue-700">
                    {member.name.charAt(0)}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900">{member.name}</h3>
                <p className="text-xs text-blue-600 font-medium mb-2">{member.role}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
