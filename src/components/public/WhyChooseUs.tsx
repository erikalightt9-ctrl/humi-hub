import {
  Award,
  Users,
  Briefcase,
  Zap,
  Globe,
  HeartHandshake,
  BookOpen,
  ShieldCheck,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const advantages = [
  {
    icon: Award,
    title: "Industry-Recognized Certifications",
    description:
      "Earn credentials validated by global employers across healthcare, real estate, finance, and technology sectors.",
  },
  {
    icon: Users,
    title: "Expert-Led Training",
    description:
      "Learn from industry practitioners with real-world experience — not just textbook instructors.",
  },
  {
    icon: Zap,
    title: "AI-Enhanced Curriculum",
    description:
      "Every program integrates AI tools and automation workflows, making graduates 3x more productive from day one.",
  },
  {
    icon: Briefcase,
    title: "Career Placement Support",
    description:
      "85% of graduates secure positions within 30 days through our network of 150+ hiring partners worldwide.",
  },
  {
    icon: Globe,
    title: "Global Standard Programs",
    description:
      "Curriculum designed to meet international standards for US, UK, AU, and global market requirements.",
  },
  {
    icon: BookOpen,
    title: "Practical, Hands-On Learning",
    description:
      "Real-world projects, case studies, and simulations — not passive lectures. Apply skills from day one.",
  },
  {
    icon: ShieldCheck,
    title: "Quality Assurance",
    description:
      "Rigorous assessment framework with competency benchmarks that ensure job-ready graduates.",
  },
  {
    icon: HeartHandshake,
    title: "Lifetime Alumni Network",
    description:
      "Join a thriving community of trained professionals sharing opportunities, mentorship, and industry insights.",
  },
] as const;

/* ------------------------------------------------------------------ */
/*  WhyChooseUs (Platform Advantages)                                  */
/* ------------------------------------------------------------------ */

export function WhyChooseUs() {
  return (
    <section className="py-20 bg-gray-50 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-blue-600 font-semibold text-sm uppercase tracking-wide mb-2">
            Why HUMI
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
            The HUMI <span className="text-blue-700">Advantage</span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            We don&apos;t just teach skills — we build careers. Our platform
            combines expert instruction, cutting-edge technology, and real-world
            application to produce industry-ready professionals.
          </p>
        </div>

        {/* Advantages Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {advantages.map((advantage) => (
            <div
              key={advantage.title}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group"
            >
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                <advantage.icon className="h-6 w-6 text-blue-700" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                {advantage.title}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {advantage.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
