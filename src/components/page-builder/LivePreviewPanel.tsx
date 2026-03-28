"use client";

import SectionRenderer from "./SectionRenderer";
import type { PageSection } from "./SectionEditor";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface LivePreviewPanelProps {
  readonly sections: readonly PageSection[];
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function LivePreviewPanel({ sections }: LivePreviewPanelProps) {
  const visibleSections = sections.filter((s) => s.isVisible !== false);

  return (
    <div className="flex flex-col h-full bg-gray-100 overflow-hidden">
      {/* Mock browser chrome */}
      <div className="shrink-0 bg-gray-200 border-b border-gray-300 px-3 py-2 flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-400 block" />
          <span className="w-3 h-3 rounded-full bg-yellow-400 block" />
          <span className="w-3 h-3 rounded-full bg-green-400 block" />
        </div>
        <div className="flex-1 bg-white rounded px-2 py-0.5 text-xs text-gray-400 font-mono truncate ml-2">
          preview
        </div>
      </div>

      {/* Scrollable preview area */}
      <div className="flex-1 overflow-y-auto p-4">
        <div
          className="bg-white shadow-sm rounded overflow-hidden origin-top"
          style={{ transform: "scale(0.75)", transformOrigin: "top center", width: "133.33%", marginLeft: "-16.67%" }}
        >
          {visibleSections.length === 0 ? (
            <div className="flex items-center justify-center py-24 text-center">
              <div>
                <p className="text-sm font-medium text-gray-400">No sections yet</p>
                <p className="text-xs text-gray-300 mt-1">Add sections from the left panel</p>
              </div>
            </div>
          ) : (
            visibleSections.map((section) => (
              <SectionRenderer
                key={section.id}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                section={section as any}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
