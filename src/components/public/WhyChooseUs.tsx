import { Award, Users, Briefcase, HeartHandshake } from "lucide-react";

const reasons = [
  {
    icon: Award,
    title: "Industry-Recognized Certification",
    description:
      "Earn certificates that are recognized by top US, Australian, and UK employers. Stand out in a competitive market.",
  },
  {
    icon: Users,
    title: "Expert Instructors",
    description:
      "Learn from practicing professionals with years of real-world experience in their respective VA specializations.",
  },
  {
    icon: Briefcase,
    title: "Job Placement Support",
    description:
      "We connect our graduates with our network of 150+ hiring partners. 85% of our graduates land their first client within 30 days.",
  },
  {
    icon: HeartHandshake,
    title: "Lifetime Community Access",
    description:
      "Join an active community of VA professionals. Get ongoing support, job leads, and networking opportunities for life.",
  },
];

export function WhyChooseUs() {
  return (
    <section className="py-16 bg-gray-50 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Why Choose VA Training Center?</h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            We are committed to giving you the skills, certifications, and connections you need to
            build a successful remote career.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {reasons.map((reason) => (
            <div
              key={reason.title}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <reason.icon className="h-6 w-6 text-blue-700" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{reason.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{reason.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
