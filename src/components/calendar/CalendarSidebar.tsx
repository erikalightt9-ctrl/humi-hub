"use client";

import { CalendarDays, Filter } from "lucide-react";
import { TYPE_COLORS, TYPE_LABELS, CalendarEvent, EventTypeKey } from "./types";
import { EVENT_TYPES } from "@/lib/validations/calendar.schema";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Course {
  id: string;
  title: string;
}

export interface SidebarFilters {
  courseId: string;
  typeFilters: Set<EventTypeKey>;
}

interface CalendarSidebarProps {
  courses: ReadonlyArray<Course>;
  filters: SidebarFilters;
  onFiltersChange: (filters: SidebarFilters) => void;
  upcomingEvents: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onAddClick: () => void;
}

// ── Upcoming event row ────────────────────────────────────────────────────────

function UpcomingRow({
  event,
  onClick,
}: {
  event: CalendarEvent;
  onClick: () => void;
}) {
  const colors = TYPE_COLORS[event.type] ?? TYPE_COLORS.CUSTOM;
  const dateObj = new Date(event.date + "T00:00:00");
  const dateLabel = dateObj.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-lg p-2.5 border-l-4 ${colors.bg} ${colors.border} hover:opacity-80 transition-opacity`}
    >
      <p className={`text-xs font-semibold truncate ${colors.text}`}>{event.title}</p>
      <p className="text-[10px] text-gray-500 mt-0.5">
        {dateLabel}
        {event.startTime && ` · ${event.startTime}`}
        {event.endTime && `–${event.endTime}`}
      </p>
    </button>
  );
}

// ── CalendarSidebar ───────────────────────────────────────────────────────────

export function CalendarSidebar({
  courses,
  filters,
  onFiltersChange,
  upcomingEvents,
  onEventClick,
  onAddClick,
}: CalendarSidebarProps) {
  function toggleType(type: EventTypeKey) {
    const next = new Set(filters.typeFilters);
    if (next.has(type)) {
      next.delete(type);
    } else {
      next.add(type);
    }
    onFiltersChange({ ...filters, typeFilters: next });
  }

  function setCourse(courseId: string) {
    onFiltersChange({ ...filters, courseId });
  }

  return (
    <div className="flex flex-col gap-5 h-full overflow-y-auto pr-1">
      {/* Add Event */}
      <button
        onClick={onAddClick}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-colors"
      >
        <span className="text-lg leading-none">+</span>
        Add Event
      </button>

      {/* Filters */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Filter className="h-3.5 w-3.5 text-gray-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Filters
          </h3>
        </div>

        {/* Course filter */}
        <div className="mb-3">
          <label className="text-xs text-gray-500 mb-1 block">Course</label>
          <select
            value={filters.courseId}
            onChange={(e) => setCourse(e.target.value)}
            className="w-full h-8 rounded-lg border border-gray-200 bg-white px-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        {/* Type toggles */}
        <div className="space-y-1">
          {EVENT_TYPES.map((t) => {
            const colors = TYPE_COLORS[t];
            const active = filters.typeFilters.size === 0 || filters.typeFilters.has(t);
            return (
              <button
                key={t}
                onClick={() => toggleType(t)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-opacity
                  ${active ? "opacity-100" : "opacity-35"}
                  ${colors.bg} ${colors.text}`}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full border-2 ${colors.border} shrink-0`}
                />
                {TYPE_LABELS[t]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Upcoming events */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Upcoming
          </h3>
        </div>

        {upcomingEvents.length === 0 ? (
          <p className="text-xs text-gray-400">No upcoming events.</p>
        ) : (
          <div className="space-y-1.5">
            {upcomingEvents.map((ev) => (
              <UpcomingRow key={ev.id} event={ev} onClick={() => onEventClick(ev)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
