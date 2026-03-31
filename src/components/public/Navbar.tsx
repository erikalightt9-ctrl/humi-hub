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
  { href: "/features", label: "Features" },
  { href: "/pricing",  label: "Pricing" },
  { href: "/contact",  label: "Demo" },
] as const;

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface NavbarBranding {
  siteName: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
}

interface NavbarProps {
  branding?: NavbarBranding | null;
}

/* ------------------------------------------------------------------ */
/*  Navbar                                                             */
/* ------------------------------------------------------------------ */

export function Navbar({ branding }: NavbarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isTenant = !!branding;
  const siteName = branding?.siteName ?? "HUMI Hub";
  const logoUrl = branding?.logoUrl ?? null;
  const brandColor = branding?.primaryColor ?? "#1E3A8A";

  // On a tenant subdomain, Log In → tenant login; Enroll → tenant enroll
  const loginHref = "/login"; // middleware rewrites /login → /tenant-login?slug=... on subdomains
  const enrollHref = "/enroll";

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo / Brand */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl" style={{ color: brandColor }}>
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={siteName} className="h-8 w-auto object-contain" />
            ) : (
              <GraduationCap className="h-7 w-7" style={{ color: brandColor }} />
            )}
            <span>{siteName}</span>
          </Link>

          {/* Desktop nav — hide marketing links on tenant portals */}
          {!isTenant && (
            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "inline-flex h-9 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:text-blue-400",
                    pathname === link.href ? "text-blue-400" : "text-gray-600"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href={loginHref}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
              <LogIn className="h-4 w-4" />
              Log In
            </Link>

            {/* Tenant portals show Enroll Now; main SaaS site shows Get Started (B2B) */}
            {isTenant ? (
              <Link
                href={enrollHref}
                className="inline-flex items-center gap-1.5 text-white text-sm font-bold px-5 py-2.5 rounded-lg shadow-md transition-all hover:opacity-90 hover:-translate-y-px active:translate-y-0"
                style={{ backgroundColor: brandColor }}
              >
                Enroll Now
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link
                href="/contact"
                className="inline-flex items-center gap-1.5 text-white text-sm font-bold px-5 py-2.5 rounded-lg shadow-md transition-all hover:opacity-90 hover:-translate-y-px active:translate-y-0 bg-amber-500 hover:bg-amber-600"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
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
            {!isTenant && NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600"
              >
                {link.label}
              </Link>
            ))}

            <div className="border-t border-gray-100 pt-3 mt-3 space-y-2">
              {isTenant ? (
                <Link
                  href={enrollHref}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 w-full text-white text-sm font-bold px-4 py-3 rounded-lg shadow-md transition-colors"
                  style={{ backgroundColor: brandColor }}
                >
                  Enroll Now
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <Link
                  href="/contact"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 w-full text-white text-sm font-bold px-4 py-3 rounded-lg shadow-md bg-amber-500 hover:bg-amber-600 transition-colors"
                >
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}

              <Link
                href={loginHref}
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-1.5 w-full text-sm font-medium text-gray-500 hover:text-gray-900 py-2 transition-colors"
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
