"use client";

import { useId } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ColorPickerProps {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Normalise any hex string to 6-digit uppercase form for the color input */
function toSixDigitHex(hex: string): string {
  const trimmed = hex.trim();
  // Expand shorthand #RGB → #RRGGBB
  if (/^#[0-9A-Fa-f]{3}$/.test(trimmed)) {
    const r = trimmed[1];
    const g = trimmed[2];
    const b = trimmed[3];
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) {
    return trimmed.toUpperCase();
  }
  return "#000000";
}

/** Return true if the string is a valid 3- or 6-digit hex color */
function isValidHex(value: string): boolean {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value.trim());
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  const colorInputId = useId();
  const textInputId = useId();

  function handleColorInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(e.target.value.toUpperCase());
  }

  function handleTextInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    // Always propagate text input changes so the user can type freely;
    // the color swatch only updates once the value is valid
    onChange(raw);
  }

  const safeHex = isValidHex(value) ? toSixDigitHex(value) : "#000000";

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={textInputId} className="text-sm font-medium text-gray-700">
        {label}
      </Label>
      <div className="flex items-center gap-2">
        {/* Native color swatch */}
        <label
          htmlFor={colorInputId}
          className="relative flex-shrink-0 w-9 h-9 rounded-lg border border-gray-300 overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-shadow"
          style={{ backgroundColor: safeHex }}
          title="Open color picker"
        >
          <input
            id={colorInputId}
            type="color"
            value={safeHex}
            onChange={handleColorInputChange}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            aria-label={`${label} color picker`}
          />
        </label>

        {/* Hex text field */}
        <Input
          id={textInputId}
          type="text"
          value={value}
          onChange={handleTextInputChange}
          maxLength={7}
          placeholder="#000000"
          className={`w-28 font-mono text-sm uppercase ${
            isValidHex(value) ? "" : "border-red-400 focus-visible:ring-red-400"
          }`}
          aria-label={`${label} hex value`}
        />
      </div>
    </div>
  );
}
