"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SkillTagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
  placeholder?: string;
}

export function SkillTagInput({
  value,
  onChange,
  maxTags = 20,
  placeholder = "Type a skill and press Enter or comma",
}: SkillTagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    if (value.length >= maxTags) return;
    if (value.includes(trimmed)) return;
    onChange([...value, trimmed]);
    setInputValue("");
  };

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      removeTag(value.length - 1);
    }
  };

  const handleBlur = () => {
    if (inputValue.trim()) addTag(inputValue);
  };

  return (
    <div
      className="min-h-[42px] border border-gray-300 rounded-md px-3 py-2 flex flex-wrap gap-2 cursor-text focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500"
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((tag, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-sm px-2 py-0.5 rounded-full"
        >
          {tag}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeTag(i);
            }}
            className="hover:text-blue-600"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      {value.length < maxTags && (
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value.replace(",", ""))}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] outline-none text-sm bg-transparent placeholder:text-gray-400"
        />
      )}
      {value.length >= maxTags && (
        <span className="text-xs text-gray-400 self-center">Max {maxTags} skills</span>
      )}
    </div>
  );
}
