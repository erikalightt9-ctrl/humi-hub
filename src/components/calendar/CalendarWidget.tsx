"use client";

import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import { isSameDay, format } from "date-fns";

// ── Types ──────────────────────────────────────────────────────────
export interface CalendarItem {
  id: string;
  title: string;
  description: string | null;
  date: string;
  endDate: string | null;
  type: string;
  source?: string;
}

interface CalendarWidgetProps {
  items: ReadonlyArray<CalendarItem>;
  month: Date;
  onMonthChange: (date: Date) => void;
  onEventClick?: (item: CalendarItem) => void;
  onAddEvent?: (date?: Date) => void;
}

// ── Color map ──────────────────────────────────────────────────────
const TYPE_COLORS: Record<string, string> = {
  ANNOUNCEMENT: "bg-blue-500",
  DEADLINE: "bg-red-500",
  ORIENTATION: "bg-green-500",
  HOLIDAY: "bg-amber-500",
  CUSTOM: "bg-gray-500",
  ASSIGNMENT: "bg-purple-500",
};

// ── Component ──────────────────────────────────────────────────────
export function CalendarWidget({ items, month, onMonthChange, onEventClick, onAddEvent }: CalendarWidgetProps) {
  const [selectedDay, setSelectedDay] = React.useState<Date | undefined>(undefined);

  // Group items by date string for quick lookup
  const itemsByDate = React.useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    for (const item of items) {
      const key = item.date.slice(0, 10); // YYYY-MM-DD
      const existing = map.get(key) ?? [];
      map.set(key, [...existing, item]);
    }
    return map;
  }, [items]);

  // Dates that have events (for dot indicators)
  const eventDates = React.useMemo(
    () => Array.from(itemsByDate.keys()).map((d) => new Date(d)),
    [itemsByDate],
  );

  // Events for selected day
  const selectedDayItems = React.useMemo(() => {
    if (!selectedDay) return [];
    const key = format(selectedDay, "yyyy-MM-dd");
    return itemsByDate.get(key) ?? [];
  }, [selectedDay, itemsByDate]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-gray-900">Calendar</h2>
        {onAddEvent && (
          <button
            type="button"
            onClick={() => onAddEvent()}
            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md px-2 py-1 transition-colors"
          >
            <span className="text-base leading-none">+</span> Add Event
          </button>
        )}
      </div>
      <Calendar
        mode="single"
        selected={selectedDay}
        onSelect={setSelectedDay}
        month={month}
        onMonthChange={onMonthChange}
        showOutsideDays={false}
        modifiers={{ hasEvent: eventDates }}
        modifiersClassNames={{
          hasEvent: "has-event",
        }}
        className="w-full"
        classNames={{
          months: "flex flex-col gap-2 w-full",
          month: "flex flex-col gap-3 w-full",
          month_caption: "flex justify-center pt-1 relative items-center w-full",
          caption_label: "text-sm font-medium",
          nav: "absolute inset-x-1 top-0 flex items-center justify-between pointer-events-none",
          button_previous:
            "h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100 hover:bg-gray-100 rounded-md flex items-center justify-center cursor-pointer border border-gray-200 pointer-events-auto",
          button_next:
            "h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100 hover:bg-gray-100 rounded-md flex items-center justify-center cursor-pointer border border-gray-200 pointer-events-auto",
          month_grid: "w-full border-collapse",
          weekdays: "flex w-full",
          weekday: "text-muted-foreground flex-1 text-center font-normal text-[0.75rem]",
          week: "flex w-full mt-1",
          day: "relative p-0 text-center text-sm flex-1 [&:has([aria-selected])]:bg-accent [&:has([aria-selected])]:rounded-md",
          day_button:
            "h-8 w-full p-0 font-normal aria-selected:opacity-100 hover:bg-gray-100 rounded-md text-sm",
          selected:
            "bg-blue-600 text-white hover:bg-blue-700 hover:text-white focus:bg-blue-600 focus:text-white",
          today: "bg-gray-100 font-semibold",
          outside: "text-muted-foreground opacity-40",
        }}
        components={{
          DayButton: ({ day, modifiers, ...buttonProps }) => {
            const dateKey = format(day.date, "yyyy-MM-dd");
            const dayItems = itemsByDate.get(dateKey) ?? [];
            const hasEvents = dayItems.length > 0;
            // Get unique event types for dots
            const types = [...new Set(dayItems.map((i) => i.type))].slice(0, 3);

            return (
              <button {...buttonProps} className={`${buttonProps.className ?? ""} relative`}>
                {day.date.getDate()}
                {hasEvents && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                    {types.map((t) => (
                      <span
                        key={t}
                        className={`w-1 h-1 rounded-full ${TYPE_COLORS[t] ?? "bg-gray-400"}`}
                      />
                    ))}
                  </span>
                )}
              </button>
            );
          },
        }}
      />

      {/* Selected day events */}
      {selectedDay && (
        <div className="mt-3 border-t border-gray-100 pt-3">
          <p className="text-xs font-medium text-gray-500 mb-2">
            {format(selectedDay, "MMMM d, yyyy")}
          </p>
          {selectedDayItems.length > 0 ? (
            <div className="space-y-2">
              {selectedDayItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-2 text-sm"
                >
                  <span
                    className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${TYPE_COLORS[item.type] ?? "bg-gray-400"}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-800 truncate">{item.title}</p>
                    {item.description && (
                      <p className="text-xs text-gray-500 truncate">{item.description}</p>
                    )}
                  </div>
                  {item.source === "student" && onEventClick && (
                    <button
                      type="button"
                      onClick={() => onEventClick(item)}
                      className="text-xs text-blue-500 hover:text-blue-700 shrink-0"
                    >
                      Edit
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400">No events on this day</p>
          )}
        </div>
      )}
    </div>
  );
}
