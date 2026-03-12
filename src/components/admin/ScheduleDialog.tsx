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
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { TIER_MAX_CAPACITY, TRAINER_TIER_LABELS } from "@/lib/constants/pricing";
import type { TrainerTier } from "@prisma/client";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Course {
  readonly id: string;
  readonly title: string;
}

interface TrainerOption {
  readonly id: string;
  readonly name: string;
  readonly tier: TrainerTier;
}

interface ScheduleItem {
  readonly id: string;
  readonly name: string;
  readonly courseId: string;
  readonly trainerId?: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly daysOfWeek: number[];
  readonly startTime: string;
  readonly endTime: string;
  readonly maxCapacity: number;
  readonly enrollmentCutOffDays: number;
  readonly status: string;
}

interface ScheduleDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly schedule?: ScheduleItem | null;
  readonly courses: ReadonlyArray<Course>;
  readonly onSuccess: () => void;
}

/* ------------------------------------------------------------------ */
/*  Presets                                                            */
/* ------------------------------------------------------------------ */

const TIME_PRESETS = [
  { label: "Morning MWF", days: [1, 3, 5], start: "09:00", end: "11:30" },
  { label: "Afternoon MWF", days: [1, 3, 5], start: "13:00", end: "15:30" },
  { label: "Evening TuTh", days: [2, 4], start: "18:30", end: "21:30" },
  { label: "Weekend Sat", days: [6], start: "09:00", end: "15:00" },
] as const;

const DAY_OPTIONS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" },
] as const;

const TIER_BADGE_CLASSES: Readonly<Record<TrainerTier, string>> = {
  BASIC: "bg-gray-100 text-gray-700",
  PROFESSIONAL: "bg-blue-100 text-blue-700",
  PREMIUM: "bg-amber-100 text-amber-700",
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ScheduleDialog({
  open,
  onOpenChange,
  schedule,
  courses,
  onSuccess,
}: ScheduleDialogProps) {
  const isEdit = Boolean(schedule);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Trainer list
  const [trainers, setTrainers] = React.useState<ReadonlyArray<TrainerOption>>([]);
  const [trainersLoading, setTrainersLoading] = React.useState(false);

  // Form state
  const [name, setName] = React.useState("");
  const [courseId, setCourseId] = React.useState("");
  const [trainerId, setTrainerId] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [daysOfWeek, setDaysOfWeek] = React.useState<number[]>([]);
  const [startTime, setStartTime] = React.useState("09:00");
  const [endTime, setEndTime] = React.useState("11:30");
  const [maxCapacity, setMaxCapacity] = React.useState(25);
  const [cutOffDays, setCutOffDays] = React.useState(2);
  const [capacityManuallySet, setCapacityManuallySet] = React.useState(false);

  // Fetch trainers on mount
  React.useEffect(() => {
    async function fetchTrainers() {
      setTrainersLoading(true);
      try {
        const res = await fetch("/api/public/trainers");
        const json = await res.json();
        if (json.success) {
          setTrainers(
            (json.data as ReadonlyArray<{ id: string; name: string; tier: TrainerTier }>).map(
              (t) => ({ id: t.id, name: t.name, tier: t.tier })
            )
          );
        }
      } catch {
        /* silent */
      } finally {
        setTrainersLoading(false);
      }
    }
    if (open) fetchTrainers();
  }, [open]);

  // Populate form when editing
  React.useEffect(() => {
    if (schedule) {
      setName(schedule.name);
      setCourseId(schedule.courseId);
      setTrainerId(schedule.trainerId ?? "");
      setStartDate(schedule.startDate.slice(0, 10));
      setEndDate(schedule.endDate.slice(0, 10));
      setDaysOfWeek([...schedule.daysOfWeek]);
      setStartTime(schedule.startTime);
      setEndTime(schedule.endTime);
      setMaxCapacity(schedule.maxCapacity);
      setCutOffDays(schedule.enrollmentCutOffDays);
      setCapacityManuallySet(true);
    } else {
      setName("");
      setCourseId("");
      setTrainerId("");
      setStartDate("");
      setEndDate("");
      setDaysOfWeek([]);
      setStartTime("09:00");
      setEndTime("11:30");
      setMaxCapacity(25);
      setCutOffDays(2);
      setCapacityManuallySet(false);
    }
    setError(null);
  }, [schedule, open]);

  function handleTrainerChange(newTrainerId: string) {
    setTrainerId(newTrainerId);

    if (!capacityManuallySet && newTrainerId) {
      const selected = trainers.find((t) => t.id === newTrainerId);
      if (selected) {
        setMaxCapacity(TIER_MAX_CAPACITY[selected.tier]);
      }
    }
  }

  function handleCapacityChange(value: number) {
    setMaxCapacity(value);
    setCapacityManuallySet(true);
  }

  const selectedTrainer = trainers.find((t) => t.id === trainerId);

  function toggleDay(day: number) {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function applyPreset(preset: (typeof TIME_PRESETS)[number]) {
    setDaysOfWeek([...preset.days]);
    setStartTime(preset.start);
    setEndTime(preset.end);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const body = {
      name: name.trim(),
      courseId,
      trainerId: trainerId || null,
      startDate,
      endDate,
      daysOfWeek,
      startTime,
      endTime,
      maxCapacity,
      enrollmentCutOffDays: cutOffDays,
    };

    try {
      const url = isEdit
        ? `/api/admin/schedules/${schedule!.id}`
        : "/api/admin/schedules";
      const method = isEdit ? "PATCH" : "POST";

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
      setError("Failed to save schedule. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!schedule || !confirm("Delete this schedule?")) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/schedules/${schedule.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error ?? "Failed to delete");
        return;
      }

      onSuccess();
      onOpenChange(false);
    } catch {
      setError("Failed to delete schedule.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Schedule" : "New Training Schedule"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <Label htmlFor="sched-name">Schedule Name *</Label>
            <Input
              id="sched-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Medical VA – Morning Batch A (Mar 2026)"
              maxLength={200}
              required
            />
          </div>

          {/* Course */}
          <div>
            <Label htmlFor="sched-course">Program *</Label>
            <select
              id="sched-course"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              required
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Select a program</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Trainer */}
          <div>
            <Label htmlFor="sched-trainer">Assigned Trainer</Label>
            <select
              id="sched-trainer"
              value={trainerId}
              onChange={(e) => handleTrainerChange(e.target.value)}
              disabled={trainersLoading}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">No trainer assigned</option>
              {trainers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({TRAINER_TIER_LABELS[t.tier]})
                </option>
              ))}
            </select>
            {selectedTrainer && (
              <p className="text-xs mt-1 text-gray-500">
                <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${TIER_BADGE_CLASSES[selectedTrainer.tier]}`}>
                  {TRAINER_TIER_LABELS[selectedTrainer.tier]}
                </span>
                {" "}— Recommended capacity: {TIER_MAX_CAPACITY[selectedTrainer.tier]} students
              </p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="sched-start">Start Date *</Label>
              <Input
                id="sched-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="sched-end">End Date *</Label>
              <Input
                id="sched-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Time Presets */}
          <div>
            <Label className="mb-2 block">Quick Time Slots</Label>
            <div className="flex flex-wrap gap-2">
              {TIME_PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => applyPreset(preset)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Days of Week */}
          <div>
            <Label className="mb-2 block">Training Days *</Label>
            <div className="flex flex-wrap gap-3">
              {DAY_OPTIONS.map((day) => (
                <label
                  key={day.value}
                  className="flex items-center gap-1.5 text-sm cursor-pointer"
                >
                  <Checkbox
                    checked={daysOfWeek.includes(day.value)}
                    onCheckedChange={() => toggleDay(day.value)}
                  />
                  {day.label}
                </label>
              ))}
            </div>
          </div>

          {/* Times */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="sched-start-time">Start Time *</Label>
              <Input
                id="sched-start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="sched-end-time">End Time *</Label>
              <Input
                id="sched-end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Capacity & Cut-off */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="sched-capacity">Max Capacity</Label>
              <Input
                id="sched-capacity"
                type="number"
                min={1}
                max={100}
                value={maxCapacity}
                onChange={(e) => handleCapacityChange(parseInt(e.target.value, 10) || 25)}
              />
            </div>
            <div>
              <Label htmlFor="sched-cutoff">Cut-off (days before start)</Label>
              <Input
                id="sched-cutoff"
                type="number"
                min={0}
                max={30}
                value={cutOffDays}
                onChange={(e) => setCutOffDays(parseInt(e.target.value, 10) || 2)}
              />
            </div>
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
                {loading ? "Saving..." : isEdit ? "Update" : "Create"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
