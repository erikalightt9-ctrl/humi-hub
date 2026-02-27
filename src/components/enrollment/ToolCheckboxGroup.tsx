"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  TOOL_FAMILIARITY_LABELS,
  type ToolFamiliarityValue,
} from "@/lib/validations/enrollment.schema";

interface ToolCheckboxGroupProps {
  value: ToolFamiliarityValue[];
  onChange: (tools: ToolFamiliarityValue[]) => void;
}

const ALL_TOOLS = Object.keys(TOOL_FAMILIARITY_LABELS) as ToolFamiliarityValue[];

export function ToolCheckboxGroup({ value, onChange }: ToolCheckboxGroupProps) {
  const toggle = (tool: ToolFamiliarityValue) => {
    if (value.includes(tool)) {
      onChange(value.filter((t) => t !== tool));
    } else {
      onChange([...value, tool]);
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {ALL_TOOLS.map((tool) => (
        <div key={tool} className="flex items-center gap-2">
          <Checkbox
            id={`tool-${tool}`}
            checked={value.includes(tool)}
            onCheckedChange={() => toggle(tool)}
          />
          <Label htmlFor={`tool-${tool}`} className="text-sm cursor-pointer">
            {TOOL_FAMILIARITY_LABELS[tool]}
          </Label>
        </div>
      ))}
    </div>
  );
}
