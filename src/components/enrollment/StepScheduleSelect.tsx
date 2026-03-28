"use client";

import { useState, useEffect } from "react";
import type { UseFormReturn } from "react-hook-form";
import {
  Calendar,
  Clock,
  Users,
  Loader2,
  CheckCircle,
  UserCog,
  AlertTriangle,
  ClipboardList,
} from "lucide-react";
import type { EnrollmentFormData } from "@/lib/validations/enrollment.schema";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ScheduleOption {
  readonly id: string;
  readonly name: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly daysOfWeek: ReadonlyArray<number>;
  readonly maxCapacity: number;
  readonly enrolledCount: number;
  readonly trainerName: string | null;
}

interface StepScheduleSelectProps {
  readonly form: UseFormReturn<EnrollmentFormData>;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const DAY_LABELS: Readonly<Record<number, string>> = {
  0: "Sun",
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
};

function formatDays(days: ReadonlyArray<number>): string {
  return [...days].sort().map((d) => DAY_LABELS[d] ?? "").join(", ");
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  };
  return `${s.toLocaleDateString("en-PH", opts)} — ${e.toLocaleDateString("en-PH", opts)}`;
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${minutes} ${ampm}`;
}

/* ------------------------------------------------------------------ */
/*  ScheduleCard                                                       */
/* ------------------------------------------------------------------ */

function ScheduleCard({
  schedule,
  isSelected,
  onSelect,
}: {
  readonly schedule: ScheduleOption;
  readonly isSelected: boolean;
  readonly onSelect: () => void;
}) {
  const availableSeats = schedule.maxCapacity - schedule.enrolledCount;
  const fillPercent = (schedule.enrolledCount / schedule.maxCapacity) * 100;
  const isAlmostFull = availableSeats <= 3 && availableSeats > 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative w-full text-left rounded-xl border-2 p-4 transition-all hover:shadow-md ${
        isSelected
          ? "border-blue-300 ring-2 ring-blue-400 shadow-md"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      {isSelected && (
        <div className="absolute top-3 right-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
        </div>
      )}

      {/* Schedule name */}
      <h4 className="font-semibold text-gray-900 text-sm mb-2 pr-6">
        {schedule.name}
      </h4>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-3">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-blue-500 shrink-0" />
          <span>{formatDateRange(schedule.startDate, schedule.endDate)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-green-500 shrink-0" />
          <span>
            {formatTime(schedule.startTime)} – {formatTime(schedule.endTime)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-gray-400 shrink-0 w-3.5 text-center">
            D
          </span>
          <span>{formatDays(schedule.daysOfWeek)}</span>
        </div>
        {schedule.trainerName && (
          <div className="flex items-center gap-1.5">
            <UserCog className="h-3.5 w-3.5 text-purple-500 shrink-0" />
            <span>{schedule.trainerName}</span>
          </div>
        )}
      </div>

      {/* Seat availability bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="flex items-center gap-1 text-xs text-gray-500">
            <Users className="h-3 w-3" />
            {schedule.enrolledCount}/{schedule.maxCapacity} enrolled
          </span>
          <span
            className={`text-xs font-semibold ${
              isAlmostFull
                ? "text-amber-600"
                : availableSeats === 0
                  ? "text-red-600"
                  : "text-green-600"
            }`}
          >
            {availableSeats} seat{availableSeats !== 1 ? "s" : ""} left
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isAlmostFull
                ? "bg-amber-400"
                : fillPercent >= 100
                  ? "bg-red-400"
                  : "bg-green-400"
            }`}
            style={{ width: `${Math.min(fillPercent, 100)}%` }}
          />
        </div>
      </div>

      {/* Warning for almost full */}
      {isAlmostFull && (
        <div className="flex items-center gap-1 mt-2 text-[11px] text-amber-600">
          <AlertTriangle className="h-3 w-3" />
          Only {availableSeats} seat{availableSeats !== 1 ? "s" : ""} remaining!
        </div>
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function StepScheduleSelect({ form }: StepScheduleSelectProps) {
  const [schedules, setSchedules] = useState<ReadonlyArray<ScheduleOption>>([]);
  const [loading, setLoading] = useState(true);

  const courseId = form.watch("courseId");
  const selectedScheduleId = form.watch("scheduleId");

  useEffect(() => {
    if (!courseId) {
      setLoading(false);
      return;
    }

    async function fetchSchedules() {
      setLoading(true);
      try {
        const res = await fetch(`/api/public/schedules?courseId=${courseId}`);
        const json = await res.json();
        if (json.success) {
          setSchedules(json.data);
        }
      } catch {
        // Silently fail — schedule is optional
      } finally {
        setLoading(false);
      }
    }
    fetchSchedules();
  }, [courseId]);

  function handleSelect(scheduleId: string | null) {
    form.setValue("scheduleId", scheduleId ?? undefined, {
      shouldDirty: true,
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        <span className="ml-2 text-sm text-gray-500">
          Loading available schedules...
        </span>
      </div>
    );
  }

  const available = schedules.filter(
    (s) => s.enrolledCount < s.maxCapacity,
  );
  const full = schedules.filter(
    (s) => s.enrolledCount >= s.maxCapacity,
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">
          Select Your Training Schedule
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Choose a training session that fits your availability. Each session has
          limited seats to ensure quality mentorship.
        </p>
      </div>

      {/* Skip option */}
      <button
        type="button"
        onClick={() => handleSelect(null)}
        className={`relative w-full text-left rounded-xl border-2 p-4 transition-all hover:shadow-md ${
          !selectedScheduleId
            ? "border-green-300 ring-2 ring-green-400 shadow-md bg-green-50"
            : "border-gray-200 hover:border-gray-300"
        }`}
      >
        {!selectedScheduleId && (
          <div className="absolute top-3 right-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
        )}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <Calendar className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">
              Assign schedule later
            </p>
            <p className="text-xs text-gray-500">
              Admin will assign you to an available session after enrollment
            </p>
          </div>
        </div>
      </button>

      {/* Available schedules */}
      {available.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Available Sessions ({available.length})
          </h3>
          <div className="space-y-2">
            {available.map((s) => (
              <ScheduleCard
                key={s.id}
                schedule={s}
                isSelected={selectedScheduleId === s.id}
                onSelect={() => handleSelect(s.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Full schedules — join waitlist */}
      {full.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-400 mb-2">
            Full Sessions — Join the Waitlist
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            These sessions are full. Select one to join the waitlist — you'll be
            notified when a seat opens up.
          </p>
          <div className="space-y-2">
            {full.map((s) => {
              const isWaitlistSelected = selectedScheduleId === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSelect(isWaitlistSelected ? null : s.id)}
                  className={`relative w-full text-left rounded-xl border-2 p-4 transition-all hover:shadow-md ${
                    isWaitlistSelected
                      ? "border-amber-400 ring-2 ring-amber-300 shadow-md bg-amber-50"
                      : "border-gray-200 hover:border-amber-300 bg-gray-50/50"
                  }`}
                >
                  {isWaitlistSelected && (
                    <div className="absolute top-3 right-3">
                      <ClipboardList className="h-5 w-5 text-amber-600" />
                    </div>
                  )}

                  <h4 className={`font-semibold text-sm mb-1 pr-6 ${isWaitlistSelected ? "text-amber-800" : "text-gray-700"}`}>
                    {s.name}
                  </h4>

                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDateRange(s.startDate, s.endDate)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTime(s.startTime)} – {formatTime(s.endTime)}
                    </span>
                    {s.trainerName && (
                      <span className="flex items-center gap-1">
                        <UserCog className="h-3 w-3" />
                        {s.trainerName}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
                      <Users className="h-3 w-3" />
                      Full — {s.maxCapacity}/{s.maxCapacity} enrolled
                    </span>
                    {isWaitlistSelected ? (
                      <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        ✓ On waitlist
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-amber-600 border border-amber-300 px-2 py-0.5 rounded-full hover:bg-amber-50">
                        Join Waitlist
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {selectedScheduleId && full.some((s) => s.id === selectedScheduleId) && (
            <div className="flex items-start gap-2 mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
              <span>
                You'll be added to the waitlist for this session. We'll email you when
                a seat opens up — you'll have 48 hours to confirm.
              </span>
            </div>
          )}
        </div>
      )}

      {schedules.length === 0 && (
        <div className="text-center py-6 text-sm text-gray-500 bg-gray-50 rounded-lg">
          <Calendar className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p>No training sessions are currently scheduled for this course.</p>
          <p className="text-xs text-gray-400 mt-1">
            A schedule will be assigned after your enrollment is approved.
          </p>
        </div>
      )}
    </div>
  );
}
