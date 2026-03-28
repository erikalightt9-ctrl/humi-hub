"use client";

import { useEffect, useId } from "react";
import { Label } from "@/components/ui/label";
import { GOOGLE_FONTS } from "@/lib/constants/page-builder";
import type { GoogleFont } from "@/lib/constants/page-builder";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface FontSelectorProps {
  readonly label?: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Helper: inject / update <link> for Google Fonts                   */
/* ------------------------------------------------------------------ */

const LINK_ELEMENT_ID = "theme-panel-google-fonts";

function loadGoogleFont(font: string): void {
  const existing = document.getElementById(LINK_ELEMENT_ID) as HTMLLinkElement | null;
  const encoded = encodeURIComponent(font);
  const href = `https://fonts.googleapis.com/css2?family=${encoded}:wght@400;600;700&display=swap`;

  if (existing) {
    existing.href = href;
  } else {
    const link = document.createElement("link");
    link.id = LINK_ELEMENT_ID;
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function FontSelector({ label = "Font Family", value, onChange }: FontSelectorProps) {
  const selectId = useId();

  // Load the current font on mount and whenever it changes
  useEffect(() => {
    if (value) loadGoogleFont(value);
  }, [value]);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const selected = e.target.value;
    loadGoogleFont(selected);
    onChange(selected);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={selectId} className="text-sm font-medium text-gray-700">
        {label}
      </Label>
      <select
        id={selectId}
        value={value}
        onChange={handleChange}
        className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        aria-label={label}
      >
        {GOOGLE_FONTS.map((font: GoogleFont) => (
          <option key={font} value={font} style={{ fontFamily: font }}>
            {font}
          </option>
        ))}
      </select>

      {/* Live font preview */}
      <p
        className="text-sm text-gray-500 mt-0.5 truncate"
        style={{ fontFamily: value }}
        aria-hidden="true"
      >
        The quick brown fox jumps over the lazy dog
      </p>
    </div>
  );
}
