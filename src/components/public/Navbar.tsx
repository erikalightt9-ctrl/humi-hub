"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, GraduationCap, LogIn, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Nav link data                                                      */
/* ------------------------------------------------------------------ */

interface NavLink {
  readonly href: string;
  readonly label: string;
}

const NAV_LINKS: readonly NavLink[] = [
  { href: "/#features", label: "Features" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/contact", label: "Demo" },
] as const;

/* ------------------------------------------------------------------ */
/*  Navbar                                                             */
/* ------------------------------------------------------------------ */

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-blue-900">
            <GraduationCap className="h-7 w-7 text-blue-600" />
            <span>HUMI Training Center</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "inline-flex h-9 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:text-blue-700",
                  pathname === link.href ? "text-blue-700" : "text-gray-600"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            {/* Secondary: Log In */}
            <Link
              href="/portal"
              className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-blue-700 transition-colors"
            >
              <LogIn className="h-4 w-4" />
              Log In
            </Link>

            {/* Primary: Enroll Now */}
            <Link
              href="/enroll"
              className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold px-5 py-2.5 rounded-lg shadow-md shadow-amber-500/30 transition-all hover:shadow-amber-500/40 hover:-translate-y-px active:translate-y-0"
            >
              Enroll Now
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-4 space-y-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700"
              >
                {link.label}
              </Link>
            ))}

            <div className="border-t border-gray-100 pt-3 mt-3 space-y-2">
              {/* Primary mobile CTA */}
              <Link
                href="/enroll"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 w-full bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold px-4 py-3 rounded-lg shadow-md shadow-amber-500/30 transition-colors"
              >
                Enroll Now
                <ArrowRight className="h-4 w-4" />
              </Link>

              {/* Secondary mobile CTA */}
              <Link
                href="/portal"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-1.5 w-full text-sm font-medium text-gray-500 hover:text-blue-700 py-2 transition-colors"
              >
                <LogIn className="h-4 w-4" />
                Log In
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
