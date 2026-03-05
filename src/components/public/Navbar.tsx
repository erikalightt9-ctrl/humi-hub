"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, GraduationCap, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/courses", label: "Courses" },
  { href: "/jobs", label: "Jobs" },
  { href: "/contact", label: "Contact" },
  { href: "/verify", label: "Verify" },
];

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
            <span>VA Training Center</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-blue-700",
                  pathname === link.href
                    ? "text-blue-700 border-b-2 border-blue-700 pb-0.5"
                    : "text-gray-600"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/portal"
              className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-blue-700 transition-colors"
            >
              <LogIn className="h-4 w-4" />
              Login / Enroll
            </Link>
            <Button asChild size="sm" className="bg-blue-700 hover:bg-blue-800">
              <Link href="/portal?tab=enroll">Enroll Now</Link>
            </Button>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "block text-sm font-medium transition-colors hover:text-blue-700",
                  pathname === link.href ? "text-blue-700" : "text-gray-600"
                )}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/portal"
              className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-blue-700 transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              <LogIn className="h-4 w-4" />
              Login / Enroll
            </Link>
            <Button asChild size="sm" className="w-full bg-blue-700 hover:bg-blue-800">
              <Link href="/portal?tab=enroll" onClick={() => setMobileOpen(false)}>
                Enroll Now
              </Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
