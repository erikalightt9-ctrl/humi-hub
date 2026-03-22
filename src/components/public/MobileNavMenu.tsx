"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface NavDropdownItem {
  readonly href: string;
  readonly label: string;
  readonly description: string;
}

interface MobileNavMenuProps {
  readonly pathname: string;
  readonly programsItems: readonly NavDropdownItem[];
  readonly studentsItems: readonly NavDropdownItem[];
  readonly onClose: () => void;
}

/* ------------------------------------------------------------------ */
/*  CollapsibleGroup                                                   */
/* ------------------------------------------------------------------ */

function CollapsibleGroup({
  label,
  items,
  pathname,
  onClose,
}: {
  readonly label: string;
  readonly items: readonly NavDropdownItem[];
  readonly pathname: string;
  readonly onClose: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-gray-100 pb-2">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between py-2 text-sm font-medium text-gray-700 hover:text-blue-700 transition-colors"
      >
        {label}
        <ChevronDown
          className={cn(
            "h-4 w-4 text-gray-400 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div className="pl-3 space-y-1 pb-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "block rounded-md px-3 py-2 transition-colors hover:bg-blue-50",
                pathname === item.href ? "text-blue-700 bg-blue-50" : "text-gray-600"
              )}
            >
              <span className="text-sm font-medium">{item.label}</span>
              <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MobileNavMenu                                                      */
/* ------------------------------------------------------------------ */

export function MobileNavMenu({
  pathname,
  programsItems,
  studentsItems,
  onClose,
}: MobileNavMenuProps) {
  return (
    <div className="md:hidden border-t border-gray-200 bg-white">
      <div className="px-4 py-4 space-y-2">
        <CollapsibleGroup
          label="Programs"
          items={programsItems}
          pathname={pathname}
          onClose={onClose}
        />

        <CollapsibleGroup
          label="For Students"
          items={studentsItems}
          pathname={pathname}
          onClose={onClose}
        />

        {/* Flat links */}
        <Link
          href="/enterprise"
          onClick={onClose}
          className={cn(
            "block py-2 text-sm font-medium transition-colors hover:text-blue-700",
            pathname === "/enterprise" ? "text-blue-700" : "text-gray-600"
          )}
        >
          For Business
        </Link>

        <Link
          href="/verify"
          onClick={onClose}
          className={cn(
            "block py-2 text-sm font-medium transition-colors hover:text-blue-700",
            pathname === "/verify" ? "text-blue-700" : "text-gray-600"
          )}
        >
          Verify
        </Link>

        <div className="border-t border-gray-100 pt-3 space-y-2">
          <Link
            href="/portal"
            onClick={onClose}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-blue-700 transition-colors"
          >
            <LogIn className="h-4 w-4" />
            Login
          </Link>
          <Button asChild size="sm" className="w-full bg-blue-700 hover:bg-blue-800">
            <Link href="/enroll" onClick={onClose}>
              Enroll Now
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
