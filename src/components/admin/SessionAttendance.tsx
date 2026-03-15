"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Save, ChevronLeft, ChevronRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface StudentRow {
  readonly id: string;
  readonly name: string;
  readonly email: string;
}

interface AttendanceState {
  [studentId: string]: boolean;
}

interface SessionAttendanceProps {
  readonly scheduleId: string;
  readonly students: ReadonlyArray<StudentRow>;
  readonly sessionDates: ReadonlyArray<string>; // ISO date strings (YYYY-MM-DD)
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function toISODate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-PH", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function SessionAttendance({
  scheduleId,
  students,
  sessionDates: initialDates,
}: SessionAttendanceProps) {
  const [sessionDates, setSessionDates] = React.useState<string[]>(() =>
    [...initialDates].sort(),
  );
  const [dateIdx, setDateIdx] = React.useState(
    Math.max(0, [...initialDates].sort().length - 1),
  );
  const [attendance, setAttendance] = React.useState<AttendanceState>({});
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [newDate, setNewDate] = React.useState("");

  const selectedDate = sessionDates[dateIdx] ?? null;

  // Load attendance for selected date
  React.useEffect(() => {
    if (!selectedDate) return;
    setAttendance({});

    fetch(
      `/api/admin/schedules/attendance?scheduleId=${scheduleId}&sessionDate=${selectedDate}`,
    )
      .then((r) => r.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          const state: AttendanceState = {};
          for (const row of json.data) {
            state[row.studentId] = row.present;
          }
          setAttendance(state);
        }
      })
      .catch(() => {/* silently ignore */});
  }, [scheduleId, selectedDate]);

  function toggleStudent(studentId: string) {
    setAttendance((prev) => ({ ...prev, [studentId]: !prev[studentId] }));
    setSaved(false);
  }

  function markAll(present: boolean) {
    const next: AttendanceState = {};
    for (const s of students) next[s.id] = present;
    setAttendance(next);
    setSaved(false);
  }

  async function handleSave() {
    if (!selectedDate) return;
    setSaving(true);
    setError(null);

    const items = students.map((s) => ({
      studentId: s.id,
      present: attendance[s.id] ?? false,
    }));

    const res = await fetch("/api/admin/schedules/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduleId, sessionDate: selectedDate, items }),
    });

    const json = await res.json();
    setSaving(false);

    if (!json.success) {
      setError(json.error ?? "Failed to save attendance");
    } else {
      setSaved(true);
    }
  }

  function handleAddDate() {
    if (!newDate || sessionDates.includes(newDate)) return;
    const updated = [...sessionDates, newDate].sort();
    setSessionDates(updated);
    setDateIdx(updated.indexOf(newDate));
    setNewDate("");
    setAttendance({});
  }

  const presentCount = students.filter((s) => attendance[s.id] === true).length;
  const absentCount = students.filter((s) => attendance[s.id] === false).length;
  const pct = students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0;

  if (students.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-sm">No students enrolled in this schedule.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Date navigation */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          variant="ghost"
          size="sm"
          disabled={dateIdx <= 0}
          onClick={() => { setDateIdx((i) => i - 1); setSaved(false); }}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex-1 text-center">
          {selectedDate ? (
            <span className="text-sm font-medium text-gray-900">
              {formatDate(selectedDate)}
            </span>
          ) : (
            <span className="text-sm text-gray-400 italic">No sessions yet</span>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          disabled={dateIdx >= sessionDates.length - 1}
          onClick={() => { setDateIdx((i) => i + 1); setSaved(false); }}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Quick-add new session date */}
        <div className="flex items-center gap-2 ml-auto">
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            max={toISODate(new Date())}
            className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <Button variant="outline" size="sm" disabled={!newDate} onClick={handleAddDate}>
            Add Session
          </Button>
        </div>
      </div>

      {selectedDate && (
        <>
          {/* Summary bar */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Present: {presentCount} / {students.length}
              </span>
              <span className="text-sm text-gray-500">{pct}%</span>
            </div>
            <Progress value={pct} className="h-2" />
            <div className="flex gap-4 mt-2 text-xs text-gray-500">
              <span className="text-green-600 font-medium">{presentCount} present</span>
              <span className="text-red-500 font-medium">{absentCount} absent</span>
              <span>{students.length - presentCount - absentCount} unmarked</span>
            </div>
          </div>

          {/* Bulk actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-green-600 border-green-300 hover:bg-green-50 gap-1"
              onClick={() => markAll(true)}
            >
              <CheckCircle2 className="h-4 w-4" /> Mark All Present
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-500 border-red-300 hover:bg-red-50 gap-1"
              onClick={() => markAll(false)}
            >
              <XCircle className="h-4 w-4" /> Mark All Absent
            </Button>
          </div>

          {/* Student roster */}
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Student</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700">Email</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-700 w-[160px]">
                    Attendance
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((student) => {
                  const present = attendance[student.id];
                  return (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {student.name}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{student.email}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => { setAttendance((p) => ({ ...p, [student.id]: true })); setSaved(false); }}
                            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                              present === true
                                ? "bg-green-100 text-green-700 ring-1 ring-green-400"
                                : "bg-gray-100 text-gray-500 hover:bg-green-50"
                            }`}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Present
                          </button>
                          <button
                            type="button"
                            onClick={() => { setAttendance((p) => ({ ...p, [student.id]: false })); setSaved(false); }}
                            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                              present === false
                                ? "bg-red-100 text-red-600 ring-1 ring-red-400"
                                : "bg-gray-100 text-gray-500 hover:bg-red-50"
                            }`}
                          >
                            <XCircle className="h-3.5 w-3.5" /> Absent
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Error & save */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-2">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3">
            {saved && (
              <span className="text-sm text-green-600 font-medium">Saved!</span>
            )}
            <Button
              onClick={handleSave}
              disabled={saving}
              className="gap-1"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving…" : "Save Attendance"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
