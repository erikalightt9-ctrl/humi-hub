"use client";

import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { User, LogOut, ChevronDown } from "lucide-react";

export function AdminProfileDropdown() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const name = session?.user?.name ?? "Admin";
  const email = session?.user?.email ?? "";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-100 transition-colors"
      >
        {/* Avatar */}
        <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
          {initials}
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium text-gray-800 leading-none">{name}</p>
          <p className="text-xs text-gray-500 leading-none mt-0.5 truncate max-w-[120px]">{email}</p>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
          {/* User info header */}
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
            <p className="text-xs text-gray-500 truncate">{email}</p>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <Link
              href="/admin/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <User className="h-4 w-4 text-gray-400" />
              My Profile
            </Link>
          </div>

          <div className="border-t border-gray-100 py-1">
            <button
              onClick={() => signOut({ callbackUrl: "/portal?tab=admin" })}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
