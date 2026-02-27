import type { Metadata } from "next";
import { Target, Eye, Heart, Zap, Users, Globe } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about VA Training Center — our mission, values, and the team behind the Philippines' premier virtual assistant training programs.",
};

const values = [
  {
    icon: Target,
    title: "Excellence",
    description: "We hold our curriculum and instructors to the highest standards of quality.",
  },
  {
    icon: Heart,
    title: "Student-First",
    description: "Every decision we make centers on the success and well-being of our students.",
  },
  {
    icon: Globe,
    title: "Global Mindset",
    description: "We prepare Filipino VAs to serve and thrive in global markets.",
  },
  {
    icon: Zap,
    title: "Innovation",
    description: "Our curriculum evolves with industry trends to keep you ahead of the curve.",
  },
  {
    icon: Users,
    title: "Community",
    description: "We foster a supportive, collaborative community of VA professionals.",
  },
  {
    icon: Eye,
    title: "Transparency",
    description: "Honest pricing, clear expectations, and open communication in everything we do.",
  },
];

const team = [
  {
    name: "Maria Santos",
    role: "Founder & CEO",
    bio: "10+ years in healthcare administration. Built VA Training Center to bridge the gap between Filipino talent and global opportunity.",
  },
  {
    name: "Jose Reyes",
    role: "Head of Curriculum",
    bio: "Former US-based bookkeeper and CPA. Designed our US Bookkeeping VA program from the ground up.",
  },
  {
    name: "Ana Dela Cruz",
    role: "Lead Instructor — Real Estate VA",
    bio: "Licensed real estate broker with 7 years of experience working with top US real estate teams remotely.",
  },
  {
    name: "Dr. Ramon Cruz",
    role: "Lead Instructor — Medical VA",
    bio: "Registered nurse and certified medical coder. Expert in HIPAA compliance and clinical documentation.",
  },
];

export default function AboutPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-blue-900 text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-extrabold mb-4">About VA Training Center</h1>
          <p className="text-blue-100 text-lg leading-relaxed">
            We are a Philippine-based virtual assistant training school dedicated to empowering
            Filipinos with the skills, certifications, and network to build thriving remote careers
            with US, Australian, and UK clients.
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
              Building World-Class Filipino Virtual Assistants
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Our mission is to equip Filipino professionals with specialized, industry-relevant
              virtual assistant skills that meet the demands of the modern global workplace.
            </p>
            <p className="text-gray-600 leading-relaxed">
              We believe that with the right training and support, every Filipino professional has
              the potential to deliver exceptional value to clients anywhere in the world.
            </p>
          </div>
          <div className="bg-blue-50 rounded-2xl p-8">
            <div className="inline-block bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4">
              Our Vision
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              The #1 VA Training School in Southeast Asia
            </h3>
            <p className="text-gray-600 leading-relaxed">
              We envision a future where VA Training Center graduates are the first choice for
              discerning employers worldwide — known for their professionalism, competence, and
              integrity.
            </p>
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
              Experienced professionals committed to your success.
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
