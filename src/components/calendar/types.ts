// Shared calendar types used across all calendar components

export type EventTypeKey =
  | "ANNOUNCEMENT"
  | "DEADLINE"
  | "ORIENTATION"
  | "HOLIDAY"
  | "CUSTOM"
  | "CLASS"
  | "MEETING"
  | "ASSIGNMENT";

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  /** ISO date string "YYYY-MM-DD" */
  date: string;
  endDate: string | null;
  /** "HH:MM" 24-hour */
  startTime: string | null;
  /** "HH:MM" 24-hour */
  endTime: string | null;
  type: EventTypeKey;
  courseId: string | null;
  assignedUserId: string | null;
  creatorRole: string | null;
  source?: "event" | "assignment";
}

export type CalendarView = "day" | "week" | "month";

/** Minutes since midnight (08:00 → 480) */
export function toMinutes(t: string | null | undefined): number {
  if (!t) return -1;
  const [h, m] = t.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** Format minutes-since-midnight as "8:00 AM" */
export function formatMinutes(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

export const TYPE_COLORS: Record<EventTypeKey, { bg: string; border: string; text: string }> = {
  ANNOUNCEMENT: { bg: "bg-blue-100",   border: "border-blue-400",   text: "text-blue-800" },
  DEADLINE:     { bg: "bg-red-100",    border: "border-red-400",    text: "text-red-800" },
  ORIENTATION:  { bg: "bg-purple-100", border: "border-purple-400", text: "text-purple-800" },
  HOLIDAY:      { bg: "bg-green-100",  border: "border-green-400",  text: "text-green-800" },
  CUSTOM:       { bg: "bg-gray-100",   border: "border-gray-400",   text: "text-gray-800" },
  CLASS:        { bg: "bg-indigo-100", border: "border-indigo-400", text: "text-indigo-800" },
  MEETING:      { bg: "bg-orange-100", border: "border-orange-400", text: "text-orange-800" },
  ASSIGNMENT:   { bg: "bg-yellow-100", border: "border-yellow-400", text: "text-yellow-800" },
};

export const TYPE_LABELS: Record<EventTypeKey, string> = {
  ANNOUNCEMENT: "Announcement",
  DEADLINE: "Deadline",
  ORIENTATION: "Orientation",
  HOLIDAY: "Holiday",
  CUSTOM: "Custom",
  CLASS: "Class",
  MEETING: "Meeting",
  ASSIGNMENT: "Assignment",
};

/** Add/subtract days from a Date, returning a new Date (immutable) */
export function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

/** Format date as "Mon, Mar 22" */
export function fmtDayHeader(date: Date): { day: string; num: number } {
  return {
    day: date.toLocaleDateString("en-US", { weekday: "short" }),
    num: date.getDate(),
  };
}

/** Returns 7 dates starting from the Monday of the week containing `date` */
export function getWeekDates(date: Date): Date[] {
  const d = new Date(date);
  const dow = d.getDay(); // 0=Sun
  const mon = new Date(d);
  mon.setDate(d.getDate() - ((dow + 6) % 7)); // roll back to Monday
  return Array.from({ length: 7 }, (_, i) => addDays(mon, i));
}

/** YYYY-MM-DD from a Date (local) */
export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
