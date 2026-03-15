"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Save, Check } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

const TIME_OPTIONS: string[] = [];
for (let h = 6; h <= 22; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:00`);
  if (h < 22) TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:30`);
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Slot {
  id: string; // local temp id
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface TrainerAvailabilityEditorProps {
  readonly trainerId: string;
  readonly initialSlots: ReadonlyArray<{
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function TrainerAvailabilityEditor({
  trainerId,
  initialSlots,
}: TrainerAvailabilityEditorProps) {
  const [slots, setSlots] = React.useState<Slot[]>(() =>
    initialSlots.map((s) => ({ ...s })),
  );
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function addSlot(dayOfWeek: number) {
    setSlots((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}-${dayOfWeek}`,
        dayOfWeek,
        startTime: "09:00",
        endTime: "12:00",
      },
    ]);
    setSaved(false);
  }

  function removeSlot(id: string) {
    setSlots((prev) => prev.filter((s) => s.id !== id));
    setSaved(false);
  }

  function updateSlot(id: string, field: "startTime" | "endTime", value: string) {
    setSlots((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
    );
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    const res = await fetch(`/api/admin/trainers/${trainerId}/availability`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slots: slots.map(({ dayOfWeek, startTime, endTime }) => ({
          dayOfWeek,
          startTime,
          endTime,
        })),
      }),
    });

    const json = await res.json();
    setSaving(false);

    if (!json.success) {
      setError(json.error ?? "Failed to save");
      return;
    }

    // Refresh IDs from server response
    setSlots(json.data.map((s: Slot) => ({ ...s })));
    setSaved(true);
  }

  const slotsByDay = DAYS.map((_, dayOfWeek) =>
    slots.filter((s) => s.dayOfWeek === dayOfWeek),
  );

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">
        Set the days and time windows when this trainer is available to run sessions.
        Scheduling a batch outside these windows will show a conflict warning.
      </p>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Day grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {DAYS.map((dayName, dayOfWeek) => {
          const daySlots = slotsByDay[dayOfWeek];
          return (
            <div
              key={dayOfWeek}
              className="rounded-xl border border-gray-200 bg-white overflow-hidden"
            >
              {/* Day header */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                <span className="text-sm font-semibold text-gray-800">{dayName}</span>
                <button
                  type="button"
                  onClick={() => addSlot(dayOfWeek)}
                  className="text-indigo-600 hover:text-indigo-800 transition-colors"
                  title="Add slot"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Slots */}
              <div className="p-3 space-y-2 min-h-[60px]">
                {daySlots.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-2">
                    No slots — unavailable
                  </p>
                ) : (
                  daySlots.map((slot) => (
                    <div key={slot.id} className="flex items-center gap-1.5">
                      <select
                        value={slot.startTime}
                        onChange={(e) => updateSlot(slot.id, "startTime", e.target.value)}
                        className="flex-1 text-xs border border-gray-300 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        {TIME_OPTIONS.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <span className="text-xs text-gray-400">–</span>
                      <select
                        value={slot.endTime}
                        onChange={(e) => updateSlot(slot.id, "endTime", e.target.value)}
                        className="flex-1 text-xs border border-gray-300 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        {TIME_OPTIONS.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => removeSlot(slot.id)}
                        className="text-red-400 hover:text-red-600 flex-shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Save */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {saved && (
          <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
            <Check className="h-4 w-4" /> Saved
          </span>
        )}
        <Button onClick={handleSave} disabled={saving} className="gap-1.5">
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : "Save Availability"}
        </Button>
      </div>
    </div>
  );
}
