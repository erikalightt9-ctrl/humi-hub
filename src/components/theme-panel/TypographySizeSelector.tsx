"use client";

import { Label } from "@/components/ui/label";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SizeOption {
  readonly value: string;
  readonly label: string;
}

interface TypographySizeSelectorProps {
  readonly label: string;
  readonly value: string;
  readonly options: ReadonlyArray<SizeOption>;
  readonly onChange: (value: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function TypographySizeSelector({
  label,
  value,
  options,
  onChange,
}: TypographySizeSelectorProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm font-medium text-gray-700">{label}</Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Preset option sets                                                 */
/* ------------------------------------------------------------------ */

export const HEADING_SIZE_OPTIONS: ReadonlyArray<SizeOption> = [
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
  { value: "xl", label: "Extra Large" },
];

export const BODY_SIZE_OPTIONS: ReadonlyArray<SizeOption> = [
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
];
