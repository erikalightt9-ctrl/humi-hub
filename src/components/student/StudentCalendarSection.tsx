"use client";

import * as React from "react";
import { CalendarWidget } from "@/components/calendar/CalendarWidget";
import { UpcomingEvents } from "@/components/calendar/UpcomingEvents";
import type { CalendarItem } from "@/components/calendar/CalendarWidget";

interface StudentCalendarSectionProps {
  initialItems: ReadonlyArray<CalendarItem>;
}

const EVENT_TYPES = ["CUSTOM", "DEADLINE", "ANNOUNCEMENT", "ORIENTATION", "HOLIDAY", "CLASS", "MEETING"] as const;
type EventType = (typeof EVENT_TYPES)[number];

interface FormData {
  title: string;
  description: string;
  date: string;
  endDate: string;
  startTime: string;
  endTime: string;
  type: EventType;
}

const EMPTY_FORM: FormData = {
  title: "",
  description: "",
  date: "",
  endDate: "",
  startTime: "",
  endTime: "",
  type: "CUSTOM",
};

export function StudentCalendarSection({ initialItems }: StudentCalendarSectionProps) {
  const [items, setItems] = React.useState<ReadonlyArray<CalendarItem>>(initialItems);
  const [month, setMonth] = React.useState(new Date());

  // Modal state
  const [showModal, setShowModal] = React.useState(false);
  const [editingEvent, setEditingEvent] = React.useState<CalendarItem | null>(null);
  const [formData, setFormData] = React.useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const fetchEvents = React.useCallback(async (date: Date) => {
    try {
      const year = date.getFullYear();
      const m = date.getMonth() + 1;
      const res = await fetch(`/api/student/calendar?year=${year}&month=${m}`);
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
            source: e.source as string,
          })),
        );
      }
    } catch (err) {
      console.error("[StudentCalendar] Failed to fetch events:", err);
    }
  }, []);

  function handleMonthChange(date: Date) {
    setMonth(date);
    fetchEvents(date);
  }

  function openAddModal(date?: Date) {
    setEditingEvent(null);
    setFormData({
      ...EMPTY_FORM,
      date: date ? formatDateString(date) : "",
    });
    setFormError(null);
    setShowModal(true);
  }

  function openEditModal(item: CalendarItem) {
    if (item.source !== "student") return;
    setEditingEvent(item);
    setFormData({
      title: item.title,
      description: item.description ?? "",
      date: item.date.slice(0, 10),
      endDate: item.endDate?.slice(0, 10) ?? "",
      startTime: "",
      endTime: "",
      type: (EVENT_TYPES.includes(item.type as EventType) ? item.type : "CUSTOM") as EventType,
    });
    setFormError(null);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingEvent(null);
    setFormData(EMPTY_FORM);
    setFormError(null);
  }

  function handleFieldChange(
    field: keyof FormData,
    value: string,
  ) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSaveEvent(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const isEdit = !!editingEvent?.id && editingEvent.source === "student";
      const url = isEdit
        ? `/api/student/calendar/events/${editingEvent.id}`
        : "/api/student/calendar/events";

      const payload: Record<string, string | null> = {
        title: formData.title,
        description: formData.description || null,
        date: formData.date,
        endDate: formData.endDate || null,
        startTime: formData.startTime || null,
        endTime: formData.endTime || null,
        type: formData.type,
      };

      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        closeModal();
        fetchEvents(month);
      } else {
        setFormError(data.error ?? "Failed to save event");
      }
    } catch {
      setFormError("Network error. Please try again.");
    }
    setSaving(false);
  }

  async function handleDeleteEvent(id: string) {
    if (!confirm("Delete this event?")) return;
    try {
      const res = await fetch(`/api/student/calendar/events/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchEvents(month);
      }
    } catch (err) {
      console.error("[StudentCalendar] Failed to delete event:", err);
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CalendarWidget
          items={items}
          month={month}
          onMonthChange={handleMonthChange}
          onEventClick={openEditModal}
          onAddEvent={openAddModal}
        />
        <UpcomingEvents items={items} />
      </div>

      {/* Event modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingEvent ? "Edit Event" : "Add Event"}
            </h2>

            <form onSubmit={handleSaveEvent} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => handleFieldChange("title", e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Event title"
                  maxLength={200}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleFieldChange("description", e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Optional description"
                  rows={2}
                  maxLength={1000}
                />
              </div>

              {/* Date + End Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => handleFieldChange("date", e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleFieldChange("endDate", e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Start Time + End Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => handleFieldChange("startTime", e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => handleFieldChange("endTime", e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => handleFieldChange("type", e.target.value as EventType)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="CUSTOM">Custom</option>
                  <option value="DEADLINE">Deadline</option>
                  <option value="ANNOUNCEMENT">Announcement</option>
                  <option value="ORIENTATION">Orientation</option>
                  <option value="HOLIDAY">Holiday</option>
                  <option value="CLASS">Class</option>
                  <option value="MEETING">Meeting</option>
                </select>
              </div>

              {/* Error */}
              {formError && (
                <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">
                  {formError}
                </p>
              )}

              {/* Buttons */}
              <div className="flex items-center justify-between pt-2">
                <div>
                  {editingEvent && (
                    <button
                      type="button"
                      onClick={() => {
                        closeModal();
                        handleDeleteEvent(editingEvent.id);
                      }}
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      Delete Event
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="text-sm text-gray-600 hover:text-gray-800 font-medium px-3 py-2 rounded-md hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="text-sm font-medium bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
