"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { EVENT_TYPES, EVENT_TYPE_LABELS } from "@/lib/validations/calendar.schema";
import type { CalendarEvent } from "@/components/calendar/types";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Course {
  id: string;
  title: string;
}

interface User {
  id: string;
  name: string;
}

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: CalendarEvent | null;
  /** Prefill values when drag-creating a slot */
  prefill?: { date: string; startTime: string; endTime: string } | null;
  courses: ReadonlyArray<Course>;
  users?: ReadonlyArray<User>;
  onSuccess: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function EventDialog({
  open,
  onOpenChange,
  event,
  prefill,
  courses,
  users = [],
  onSuccess,
}: EventDialogProps) {
  const isEdit = Boolean(event);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Form state
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [date, setDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [startTime, setStartTime] = React.useState("");
  const [endTime, setEndTime] = React.useState("");
  const [type, setType] = React.useState<string>("CUSTOM");
  const [courseId, setCourseId] = React.useState<string>("");
  const [assignedUserId, setAssignedUserId] = React.useState<string>("");
  const [isPublished, setIsPublished] = React.useState(true);

  // Populate form when editing or using prefill
  React.useEffect(() => {
    if (!open) return;

    if (event) {
      setTitle(event.title);
      setDescription(event.description ?? "");
      setDate(event.date.slice(0, 10));
      setEndDate(event.endDate?.slice(0, 10) ?? "");
      setStartTime(event.startTime ?? "");
      setEndTime(event.endTime ?? "");
      setType(event.type);
      setCourseId(event.courseId ?? "");
      setAssignedUserId(event.assignedUserId ?? "");
      setIsPublished(true);
    } else {
      setTitle("");
      setDescription("");
      setDate(prefill?.date ?? "");
      setEndDate("");
      setStartTime(prefill?.startTime ?? "");
      setEndTime(prefill?.endTime ?? "");
      setType("CUSTOM");
      setCourseId("");
      setAssignedUserId("");
      setIsPublished(true);
    }
    setError(null);
  }, [event, prefill, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const body = {
      title: title.trim(),
      description: description.trim() || null,
      date,
      endDate: endDate || null,
      startTime: startTime || null,
      endTime: endTime || null,
      type,
      courseId: courseId || null,
      assignedUserId: assignedUserId || null,
      isPublished,
    };

    try {
      const url = isEdit ? `/api/admin/calendar/${event!.id}` : "/api/admin/calendar";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error ?? "Something went wrong");
        return;
      }

      onSuccess();
      onOpenChange(false);
    } catch {
      setError("Failed to save event. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!event || !confirm("Delete this event?")) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/calendar/${event.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) {
        setError(data.error ?? "Failed to delete");
        return;
      }
      onSuccess();
      onOpenChange(false);
    } catch {
      setError("Failed to delete event.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Event" : "New Event"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <Label htmlFor="ev-title">Title *</Label>
            <Input
              id="ev-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Morning Class"
              maxLength={100}
              required
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="ev-desc">Description</Label>
            <Textarea
              id="ev-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details…"
              rows={2}
              maxLength={1000}
            />
          </div>

          {/* Date row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="ev-date">Date *</Label>
              <Input
                id="ev-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="ev-end-date">End Date</Label>
              <Input
                id="ev-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Time row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="ev-start-time">Start Time</Label>
              <Input
                id="ev-start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="ev-end-time">End Time</Label>
              <Input
                id="ev-end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          {/* Type */}
          <div>
            <Label htmlFor="ev-type">Type</Label>
            <select
              id="ev-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {EVENT_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>

          {/* Course */}
          <div>
            <Label htmlFor="ev-course">Course</Label>
            <select
              id="ev-course"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">All Courses (Global)</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Assigned user */}
          {users.length > 0 && (
            <div>
              <Label htmlFor="ev-user">Assigned To</Label>
              <select
                id="ev-user"
                value={assignedUserId}
                onChange={(e) => setAssignedUserId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Published */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="ev-published"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="ev-published" className="text-sm font-normal cursor-pointer">
              Published (visible to students)
            </Label>
          </div>

          <DialogFooter className="flex justify-between gap-2">
            {isEdit && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={loading}
              >
                Delete
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving…" : isEdit ? "Update" : "Create"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
