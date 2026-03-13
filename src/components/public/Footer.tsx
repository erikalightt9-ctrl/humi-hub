import Link from "next/link";
import { GraduationCap, Mail, Phone, MapPin } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Link data                                                          */
/* ------------------------------------------------------------------ */

interface FooterLink {
  readonly href: string;
  readonly label: string;
}

const programsLinks: readonly FooterLink[] = [
  { href: "/programs", label: "All Programs" },
  { href: "/learning-paths", label: "Learning Paths" },
  { href: "/certifications", label: "Certifications" },
] as const;

const studentsLinks: readonly FooterLink[] = [
  { href: "/career-placement", label: "Career Placement" },
  { href: "/student-success", label: "Student Success" },
  { href: "/community", label: "Community" },
  { href: "/resources", label: "Resources" },
] as const;

const companyLinks: readonly FooterLink[] = [
  { href: "/about", label: "About Us" },
  { href: "/enterprise", label: "Enterprise Training" },
  { href: "/contact", label: "Contact" },
  { href: "/verify", label: "Verify Certificate" },
] as const;

/* ------------------------------------------------------------------ */
/*  LinkColumn                                                         */
/* ------------------------------------------------------------------ */

function LinkColumn({
  title,
  links,
}: {
  readonly title: string;
  readonly links: readonly FooterLink[];
}) {
  return (
    <div>
      <h3 className="font-semibold text-white mb-3">{title}</h3>
      <ul className="space-y-2 text-sm text-blue-200">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="hover:text-white transition-colors">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Footer                                                             */
/* ------------------------------------------------------------------ */

export function Footer() {
  return (
    <footer className="bg-blue-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 4-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Column 1: Brand */}
          <div>
            <div className="flex items-center gap-2 font-bold text-xl mb-3">
              <GraduationCap className="h-6 w-6 text-blue-400" />
              <span>HUMI Training Center</span>
            </div>
            <p className="text-blue-200 text-sm leading-relaxed">
              Training AI-powered Filipino Virtual Assistants for the global market.
              Human expertise + AI tools = unstoppable productivity.
            </p>
          </div>

          {/* Column 2: Programs */}
          <LinkColumn title="Programs" links={programsLinks} />

          {/* Column 3: Students & Community */}
          <LinkColumn title="Students & Community" links={studentsLinks} />

          {/* Column 4: Company */}
          <LinkColumn title="Company" links={companyLinks} />
        </div>

        {/* Contact info bar */}
        <div className="border-t border-blue-800 mt-10 pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-blue-200 mb-6">
            <span className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-blue-400 shrink-0" />
              info@vatrainingcenter.com
            </span>
            <span className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-blue-400 shrink-0" />
              +63 912 345 6789
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-400 shrink-0" />
              Manila, Philippines
            </span>
          </div>

          {/* Copyright */}
          <p className="text-center text-sm text-blue-300">
            &copy; {new Date().getFullYear()} HUMI Training Center. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
