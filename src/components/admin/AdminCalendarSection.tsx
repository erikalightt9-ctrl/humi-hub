"use client";

import * as React from "react";
import { CalendarWidget } from "@/components/calendar/CalendarWidget";
import { UpcomingEvents } from "@/components/calendar/UpcomingEvents";
import { EventDialog } from "@/components/admin/EventDialog";
import type { CalendarItem } from "@/components/calendar/CalendarWidget";
import type { CalendarEvent } from "@/components/calendar/types";

interface Course {
  id: string;
  title: string;
}

interface AdminCalendarSectionProps {
  initialItems: ReadonlyArray<CalendarItem>;
  courses: ReadonlyArray<Course>;
}

/** Adapts old CalendarItem shape to the new CalendarEvent shape */
function toCalendarEvent(item: CalendarItem): CalendarEvent {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    date: item.date.slice(0, 10),
    endDate: item.endDate?.slice(0, 10) ?? null,
    startTime: null,
    endTime: null,
    type: item.type as CalendarEvent["type"],
    courseId: null,
    assignedUserId: null,
    creatorRole: null,
    source: item.source as "event" | "assignment" | undefined,
  };
}

export function AdminCalendarSection({
  initialItems,
  courses,
}: AdminCalendarSectionProps) {
  const [items, setItems] = React.useState<ReadonlyArray<CalendarItem>>(initialItems);
  const [month, setMonth] = React.useState(new Date());
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingEvent, setEditingEvent] = React.useState<CalendarEvent | null>(null);

  const fetchEvents = React.useCallback(async (date: Date) => {
    try {
      const year = date.getFullYear();
      const m = date.getMonth() + 1;
      const res = await fetch(`/api/admin/calendar?year=${year}&month=${m}`);
      const data = await res.json();
      if (data.success && data.data) {
        setItems(
          data.data.map((e: Record<string, unknown>) => ({
            id: e.id as string,
            title: e.title as string,
            description: e.description as string | null,
            date: e.date as string,
            endDate: e.endDate as string | null,
            type: e.type as string,
            source: "event",
          })),
        );
      }
    } catch (err) {
      console.error("[AdminCalendar] Failed to fetch events:", err);
    }
  }, []);

  function handleMonthChange(date: Date) {
    setMonth(date);
    fetchEvents(date);
  }

  function handleAddClick() {
    setEditingEvent(null);
    setDialogOpen(true);
  }

  function handleSuccess() {
    fetchEvents(month);
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CalendarWidget
          items={items}
          month={month}
          onMonthChange={handleMonthChange}
        />
        <UpcomingEvents
          items={items}
          showAddButton
          onAddClick={handleAddClick}
        />
      </div>

      <EventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        event={editingEvent}
        courses={courses}
        onSuccess={handleSuccess}
      />
    </>
  );
}
