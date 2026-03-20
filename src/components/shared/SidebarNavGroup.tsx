"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItem {
  readonly href: string;
  readonly label: string;
  readonly icon: React.ComponentType<{ className?: string }>;
}

interface SidebarNavGroupProps {
  readonly label: string;
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly items: ReadonlyArray<NavItem>;
  readonly onNavigate?: () => void;
}

export function SidebarNavGroup({ label, icon: GroupIcon, items, onNavigate }: SidebarNavGroupProps) {
  const pathname = usePathname();
  const hasActiveChild = items.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/")
  );
  const [isOpen, setIsOpen] = useState(hasActiveChild);

  // Auto-expand when navigating to a child
  useEffect(() => {
    if (hasActiveChild) {
      setIsOpen(true);
    }
  }, [hasActiveChild]);

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
          hasActiveChild
            ? "text-white bg-blue-900/50"
            : "text-blue-300 hover:bg-blue-800 hover:text-white"
        )}
      >
        <GroupIcon className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left">{label}</span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
            isOpen ? "rotate-180" : ""
          )}
        />
      </button>

      {isOpen && (
        <div className="ml-4 mt-1 space-y-0.5 border-l border-blue-800 pl-3">
          {items.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-colors",
                  isActive
                    ? "bg-blue-700 text-white"
                    : "text-blue-300 hover:bg-blue-800 hover:text-white"
                )}
              >
                <item.icon className="h-3.5 w-3.5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
