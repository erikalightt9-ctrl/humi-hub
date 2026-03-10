"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/*  TagInput — reusable tag chip input                                 */
/* ------------------------------------------------------------------ */

interface TagInputProps {
  readonly tags: ReadonlyArray<string>;
  readonly onAdd: (tag: string) => void;
  readonly onRemove: (index: number) => void;
  readonly placeholder?: string;
  readonly chipColor?: string;
  readonly chipTextColor?: string;
}

export function TagInput({
  tags,
  onAdd,
  onRemove,
  placeholder = "Type and press Enter to add",
  chipColor = "bg-blue-50",
  chipTextColor = "text-blue-700",
}: TagInputProps) {
  const [input, setInput] = useState("");

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const trimmed = input.trim();
      if (trimmed && !tags.includes(trimmed)) {
        onAdd(trimmed);
        setInput("");
      }
    }
  }

  function handleAddClick() {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onAdd(trimmed);
      setInput("");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map((tag, idx) => (
          <span
            key={tag}
            className={`${chipColor} ${chipTextColor} px-2 py-0.5 rounded-full text-xs inline-flex items-center gap-1`}
          >
            {tag}
            <button
              type="button"
              onClick={() => onRemove(idx)}
              className="opacity-60 hover:opacity-100 ml-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddClick}
          disabled={!input.trim()}
        >
          Add
        </Button>
      </div>
    </div>
  );
}
