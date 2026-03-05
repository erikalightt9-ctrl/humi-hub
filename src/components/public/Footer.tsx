import Link from "next/link";
import { GraduationCap, Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-blue-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 font-bold text-xl mb-3">
              <GraduationCap className="h-6 w-6 text-blue-400" />
              <span>VA Training Center</span>
            </div>
            <p className="text-blue-200 text-sm leading-relaxed">
              Training AI-powered Filipino Virtual Assistants for the global market.
              Human expertise + AI tools = unstoppable productivity.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-white mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm text-blue-200">
              {[
                { href: "/", label: "Home" },
                { href: "/about", label: "About Us" },
                { href: "/courses", label: "Courses" },
                { href: "/enroll", label: "Enroll Now" },
                { href: "/contact", label: "Contact" },
                { href: "/verify", label: "Verify Certificate" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-white mb-3">Contact Us</h3>
            <ul className="space-y-2 text-sm text-blue-200">
              <li className="flex items-start gap-2">
                <Mail className="h-4 w-4 mt-0.5 shrink-0 text-blue-400" />
                <span>info@vatrainingcenter.com</span>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="h-4 w-4 mt-0.5 shrink-0 text-blue-400" />
                <span>+63 912 345 6789</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-blue-400" />
                <span>Manila, Philippines</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-blue-800 mt-10 pt-6 text-center text-sm text-blue-300">
          <p>© {new Date().getFullYear()} VA Training Center. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
