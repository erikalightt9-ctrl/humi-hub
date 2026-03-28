import Link from "next/link";
import { GraduationCap, Mail, Phone, MapPin } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Link data                                                          */
/* ------------------------------------------------------------------ */

interface FooterLink {
  readonly href: string;
  readonly label: string;
}

const productLinks: readonly FooterLink[] = [
  { href: "/#features", label: "Features" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/contact", label: "Book a Demo" },
  { href: "/portal", label: "Login" },
] as const;

const companyLinks: readonly FooterLink[] = [
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
  { href: "/enterprise", label: "Enterprise" },
] as const;

const legalLinks: readonly FooterLink[] = [
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy", label: "Privacy Policy" },
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
          <li key={link.href + link.label}>
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
              All-in-one training management platform for modern training
              centers and academies. Manage students, trainers, courses,
              and analytics in one system.
            </p>
          </div>

          {/* Column 2: Product */}
          <LinkColumn title="Product" links={productLinks} />

          {/* Column 3: Company */}
          <LinkColumn title="Company" links={companyLinks} />

          {/* Column 4: Legal */}
          <LinkColumn title="Legal" links={legalLinks} />
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
