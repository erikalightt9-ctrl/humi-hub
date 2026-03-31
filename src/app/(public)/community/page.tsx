import type { Metadata } from "next";
import Link from "next/link";
import {
  Users,
  MessageCircle,
  GraduationCap,
  Calendar,
  Facebook,
  Linkedin,
  Youtube,
} from "lucide-react";
import { NewsletterSignup } from "@/components/public/NewsletterSignup";

export const metadata: Metadata = {
  title: "Community",
  description:
    "Join the HUMI Hub community. Connect with fellow students, access mentorship, and grow your VA career together.",
};

const features = [
  {
    icon: MessageCircle,
    title: "Discussion Forums",
    description:
      "Connect with fellow students, share tips, ask questions, and learn together in course-specific forums.",
  },
  {
    icon: Users,
    title: "Peer Learning Groups",
    description:
      "Collaborate with classmates on projects, practice scenarios, and hold each other accountable.",
  },
  {
    icon: GraduationCap,
    title: "Mentorship Program",
    description:
      "Get guidance from experienced VAs and industry professionals who have walked the path before you.",
  },
  {
    icon: Calendar,
    title: "Events & Workshops",
    description:
      "Join regular workshops, webinars, and community events to sharpen your skills and expand your network.",
  },
] as const;

const stats = [
  { value: "2,400+", label: "Active Members" },
  { value: "500+", label: "Forum Discussions" },
  { value: "50+", label: "Monthly Events" },
  { value: "15+", label: "Countries Represented" },
] as const;

const socialLinks = [
  { icon: Facebook, label: "Facebook", href: "#" },
  { icon: Linkedin, label: "LinkedIn", href: "#" },
  { icon: Youtube, label: "YouTube", href: "#" },
] as const;

export default function CommunityPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-blue-900 text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-amber-300" />
          <h1 className="text-4xl font-extrabold mb-4">Join Our Community</h1>
          <p className="text-blue-100 text-lg leading-relaxed">
            Be part of a growing network of Filipino virtual assistants who
            support, inspire, and learn from each other every day.
          </p>
        </div>
      </section>

      {/* Community Features */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">
              What You Get
            </h2>
            <p className="text-gray-600">
              Everything you need to learn, grow, and thrive alongside your
              peers.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm text-center"
              >
                <div className="bg-blue-100 w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center">
                  <feature.icon className="h-6 w-6 text-blue-700" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Stats */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4">
              By the Numbers
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900">
              A Growing Community
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm text-center"
              >
                <p className="text-3xl font-extrabold text-blue-700 mb-1">
                  {stat.value}
                </p>
                <p className="text-sm text-gray-600 font-medium">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social & Newsletter */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-3">
              Stay Connected
            </h2>
            <p className="text-gray-600">
              Follow us on social media and subscribe to our newsletter for the
              latest updates.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            {/* Social Media Links */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">
                Follow Us
              </h3>
              <div className="flex gap-4">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="bg-blue-100 w-12 h-12 rounded-xl flex items-center justify-center hover:bg-blue-200 transition-colors"
                  >
                    <social.icon className="h-5 w-5 text-blue-700" />
                  </a>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-3">
                Join the conversation on our social channels for daily tips, VA
                job leads, and community highlights.
              </p>
            </div>

            {/* Newsletter Signup */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">
                Newsletter
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Get weekly VA tips, AI tool guides, and community updates
                delivered straight to your inbox.
              </p>
              <NewsletterSignup />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-blue-700 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold mb-4">
            Become Part of Our Community
          </h2>
          <p className="text-blue-100 mb-8">
            Enroll in a program to get full access to discussion forums, peer
            groups, mentorship, and all community events.
          </p>
          <Link
            href="/enroll"
            className="inline-flex items-center justify-center rounded-md bg-amber-300 text-gray-900 font-semibold px-8 py-3 hover:bg-amber-400 transition-colors"
          >
            Enroll Now
          </Link>
        </div>
      </section>
    </div>
  );
}
