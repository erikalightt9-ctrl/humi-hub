"use client";

import { useState, useCallback } from "react";
import { Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AIPracticeScenarioCardProps {
  readonly title: string;
  readonly description: string;
  readonly samplePrompt: string;
  readonly expectedOutputFormat: string;
}

export function AIPracticeScenarioCard({
  title,
  description,
  samplePrompt,
  expectedOutputFormat,
}: AIPracticeScenarioCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(samplePrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = samplePrompt;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [samplePrompt]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-5">
        <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
        <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
      </div>

      {/* Expandable Section */}
      <div className="border-t border-gray-100">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium text-blue-700 hover:bg-blue-50 transition-colors"
        >
          <span>{expanded ? "Hide Practice Prompt" : "View Practice Prompt"}</span>
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {expanded && (
          <div className="px-5 pb-5 space-y-4">
            {/* Sample Prompt */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Sample Prompt
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 text-green-600" />
                      <span className="text-green-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      Copy Prompt
                    </>
                  )}
                </Button>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 leading-relaxed border border-gray-100 whitespace-pre-wrap">
                {samplePrompt}
              </div>
            </div>

            {/* Expected Output */}
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">
                Expected Output Format
              </span>
              <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800 leading-relaxed border border-blue-100">
                {expectedOutputFormat}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
