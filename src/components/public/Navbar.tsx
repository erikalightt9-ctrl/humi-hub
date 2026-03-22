"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, GraduationCap, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { MobileNavMenu } from "./MobileNavMenu";

/* ------------------------------------------------------------------ */
/*  Navigation data                                                    */
/* ------------------------------------------------------------------ */

interface NavDropdownItem {
  readonly href: string;
  readonly label: string;
  readonly description: string;
}

const programsItems: readonly NavDropdownItem[] = [
  { href: "/programs", label: "All Programs", description: "Browse our VA training specializations" },
  { href: "/learning-paths", label: "Learning Paths", description: "See your training roadmap" },
  { href: "/certifications", label: "Certifications", description: "Credentials you'll earn" },
] as const;

const studentsItems: readonly NavDropdownItem[] = [
  { href: "/career-placement", label: "Career Placement", description: "Jobs & placement support" },
  { href: "/employer-dashboard", label: "Hire Our VAs", description: "Browse top graduates" },
  { href: "/student-ranking", label: "Student Ranking", description: "Top-performing students" },
  { href: "/student-success", label: "Student Success", description: "Graduate stories & outcomes" },
  { href: "/community", label: "Community", description: "Connect with fellow VAs" },
  { href: "/resources", label: "Resources", description: "Free tools & guides" },
] as const;

/* ------------------------------------------------------------------ */
/*  DropdownLink — reusable item inside a dropdown                     */
/* ------------------------------------------------------------------ */

function DropdownLink({
  href,
  label,
  description,
  pathname,
}: NavDropdownItem & { readonly pathname: string }) {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          href={href}
          className={cn(
            "block select-none rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-blue-50 focus:bg-blue-50",
            pathname === href && "bg-blue-50"
          )}
        >
          <div className="text-sm font-medium text-gray-900">{label}</div>
          <p className="mt-1 text-xs leading-snug text-gray-500">{description}</p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
}

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
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              {/* Programs dropdown */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-sm font-medium text-gray-600 hover:text-blue-700 bg-transparent hover:bg-transparent data-[state=open]:bg-transparent">
                  Programs
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[320px] gap-1 p-2">
                    {programsItems.map((item) => (
                      <DropdownLink key={item.href} {...item} pathname={pathname} />
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* For Students dropdown */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-sm font-medium text-gray-600 hover:text-blue-700 bg-transparent hover:bg-transparent data-[state=open]:bg-transparent">
                  For Students
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[340px] gap-1 p-2">
                    {studentsItems.map((item) => (
                      <DropdownLink key={item.href} {...item} pathname={pathname} />
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Flat links */}
              <NavigationMenuItem>
                <Link
                  href="/enterprise"
                  className={cn(
                    "inline-flex h-9 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:text-blue-700",
                    pathname === "/enterprise" ? "text-blue-700" : "text-gray-600"
                  )}
                >
                  For Business
                </Link>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link
                  href="/verify"
                  className={cn(
                    "inline-flex h-9 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:text-blue-700",
                    pathname === "/verify" ? "text-blue-700" : "text-gray-600"
                  )}
                >
                  Verify
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {/* CTA area */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/portal"
              className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-blue-700 transition-colors"
            >
              <LogIn className="h-4 w-4" />
              Login
            </Link>
            <Button asChild size="sm" className="bg-blue-700 hover:bg-blue-800">
              <Link href="/enroll">Enroll Now</Link>
            </Button>
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
        <MobileNavMenu
          pathname={pathname}
          programsItems={programsItems}
          studentsItems={studentsItems}
          onClose={() => setMobileOpen(false)}
        />
      )}
    </header>
  );
}
