"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Loader2, Save, Check, AlertTriangle, Award,
  Users, CalendarDays, Clock, ChevronDown, CheckSquare, Square,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

type AttendanceStatus = "P" | "A" | "L" | "E" | null;

type CellData = { present: boolean; notes: string | null };

type GridData = {
  schedule: {
    id: string; name: string; status: string;
    course: { id: string; title: string };
    trainer: { id: string; name: string } | null;
    startDate: string; endDate: string;
    startTime: string; endTime: string;
    daysOfWeek: number[];
    maxCapacity: number;
  };
  sessionDates: string[];
  students: Array<{ id: string; name: string; email: string }>;
  attendance: Record<string, Record<string, CellData>>;
  summaries: Array<{
    studentId: string;
    presentCount: number;
    totalSessions: number;
    attendancePct: number;
    isEligible: boolean;
    hasCert: boolean;
  }>;
  certThreshold: number;
};

type LocalAttendance = Record<string, Record<string, AttendanceStatus>>;

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function cellToStatus(cell: CellData | undefined): AttendanceStatus {
  if (!cell) return null;
  if (cell.present && cell.notes?.toLowerCase() === "late") return "L";
  if (!cell.present && cell.notes?.toLowerCase() === "excused") return "E";
  return cell.present ? "P" : "A";
}

function statusToCell(s: AttendanceStatus): CellData {
  if (s === "P") return { present: true, notes: null };
  if (s === "L") return { present: true, notes: "late" };
  if (s === "E") return { present: false, notes: "excused" };
  return { present: false, notes: null };
}

function cycleStatus(current: AttendanceStatus): AttendanceStatus {
  const cycle: AttendanceStatus[] = ["P", "A", "L", "E"];
  const idx = cycle.indexOf(current ?? "A");
  return cycle[(idx + 1) % cycle.length];
}

const STATUS_STYLE: Record<NonNullable<AttendanceStatus>, string> = {
  P: "bg-emerald-100 text-emerald-800 hover:bg-emerald-200",
  A: "bg-red-100 text-red-700 hover:bg-red-200",
  L: "bg-amber-100 text-amber-700 hover:bg-amber-200",
  E: "bg-slate-100 text-slate-600 hover:bg-slate-200",
};

const STATUS_LABEL: Record<NonNullable<AttendanceStatus>, string> = {
  P: "Present",
  A: "Absent",
  L: "Late",
  E: "Excused",
};

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default function BatchAttendanceGridPage() {
  const { id } = useParams<{ id: string }>();
  const [gridData, setGridData] = useState<GridData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Local edits: localAtt[studentId][dateStr] = status
  const [localAtt, setLocalAtt] = useState<LocalAttendance>({});
  const [dirty, setDirty] = useState<Set<string>>(new Set()); // dirty dateStrs
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const saveMsgTimer = useRef<NodeJS.Timeout | null>(null);

  const loadGrid = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/training-center/schedules/${id}/grid`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed to load");
      const data: GridData = json.data;

      // Hydrate local attendance from DB data
      const local: LocalAttendance = {};
      for (const student of data.students) {
        local[student.id] = {};
        for (const date of data.sessionDates) {
          const cell = data.attendance[student.id]?.[date];
          local[student.id][date] = cellToStatus(cell);
        }
      }
      setLocalAtt(local);
      setDirty(new Set());
      setGridData(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void loadGrid(); }, [loadGrid]);

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const toggleCell = (studentId: string, dateStr: string) => {
    if (new Date(dateStr) > today) return; // future dates locked
    setLocalAtt((prev) => {
      const current = prev[studentId]?.[dateStr] ?? null;
      const next = cycleStatus(current);
      return { ...prev, [studentId]: { ...(prev[studentId] ?? {}), [dateStr]: next } };
    });
    setDirty((prev) => new Set(prev).add(dateStr));
  };

  const markAllPresent = (dateStr: string) => {
    if (!gridData) return;
    setLocalAtt((prev) => {
      const updated = { ...prev };
      for (const student of gridData.students) {
        updated[student.id] = { ...(updated[student.id] ?? {}), [dateStr]: "P" };
      }
      return updated;
    });
    setDirty((prev) => new Set(prev).add(dateStr));
  };

  const markAllAbsent = (dateStr: string) => {
    if (!gridData) return;
    setLocalAtt((prev) => {
      const updated = { ...prev };
      for (const student of gridData.students) {
        updated[student.id] = { ...(updated[student.id] ?? {}), [dateStr]: "A" };
      }
      return updated;
    });
    setDirty((prev) => new Set(prev).add(dateStr));
  };

  const saveChanges = async () => {
    if (!gridData || dirty.size === 0) return;
    setSaving(true);
    try {
      await Promise.all(
        Array.from(dirty).map(async (dateStr) => {
          const items = gridData.students.map((st) => {
            const status = localAtt[st.id]?.[dateStr] ?? null;
            const cell = statusToCell(status);
            return { studentId: st.id, present: cell.present, notes: cell.notes };
          });
          const res = await fetch("/api/admin/schedules/attendance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ scheduleId: id, sessionDate: dateStr, items }),
          });
          if (!res.ok) throw new Error(`Failed to save ${dateStr}`);
        })
      );
      setDirty(new Set());
      if (saveMsgTimer.current) clearTimeout(saveMsgTimer.current);
      setSaveMsg("Saved successfully");
      saveMsgTimer.current = setTimeout(() => setSaveMsg(null), 3000);
      await loadGrid();
    } catch (e) {
      setSaveMsg(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !gridData) {
    return <div className="text-sm text-red-600 p-4">{error ?? "No data"}</div>;
  }

  const { schedule, sessionDates, students, summaries, certThreshold } = gridData;
  const summaryMap = Object.fromEntries(summaries.map((s) => [s.studentId, s]));

  // Only show past + today dates for grading
  const gradableDates = sessionDates.filter((d) => new Date(d) <= today);
  const futureDates = sessionDates.filter((d) => new Date(d) > today);

  // Column-level present counts
  const columnTotals = sessionDates.reduce<Record<string, number>>((acc, d) => {
    acc[d] = students.filter((st) => localAtt[st.id]?.[d] === "P" || localAtt[st.id]?.[d] === "L").length;
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      {/* Back + header */}
      <div className="flex items-start gap-3 flex-wrap">
        <Link
          href="/admin/training-center/schedules"
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors pt-0.5"
        >
          <ArrowLeft className="h-4 w-4" /> Schedules
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900">{schedule.name}</h1>
          <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              {new Date(schedule.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              {" – "}
              {new Date(schedule.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {schedule.startTime} – {schedule.endTime}
            </span>
            <span>{schedule.daysOfWeek.map((d) => DAY_LABELS[d]).join(", ")}</span>
            {schedule.trainer && <span>Trainer: {schedule.trainer.name}</span>}
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {students.length}/{schedule.maxCapacity} students
            </span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Sessions",  value: sessionDates.length },
          { label: "Past Sessions",   value: gradableDates.length },
          { label: "Remaining",       value: futureDates.length },
          { label: "Cert Threshold",  value: `${certThreshold}%` },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
            <p className="text-xs text-slate-400">{s.label}</p>
            <p className="text-lg font-bold text-slate-900 tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Legend + Save */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-slate-500 font-medium">Click a cell to toggle:</span>
          {(["P", "A", "L", "E"] as AttendanceStatus[]).map((s) => s && (
            <span key={s} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${STATUS_STYLE[s]}`}>
              {s} — {STATUS_LABEL[s]}
            </span>
          ))}
          <span className="text-xs text-slate-400">· Grey = future (locked)</span>
        </div>
        <div className="flex items-center gap-3">
          {saveMsg && (
            <span className={`text-xs font-medium ${saveMsg.includes("fail") || saveMsg.includes("Failed") ? "text-red-600" : "text-emerald-600"}`}>
              {saveMsg}
            </span>
          )}
          <button
            onClick={saveChanges}
            disabled={dirty.size === 0 || saving}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded-xl font-medium transition-colors"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving…" : dirty.size > 0 ? `Save Changes (${dirty.size})` : "No Changes"}
          </button>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No students assigned to this batch yet.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="text-xs border-collapse">
              {/* Header: student name col + date cols + summary col */}
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {/* Sticky name column */}
                  <th className="sticky left-0 z-10 bg-slate-50 border-r border-slate-200 px-4 py-3 text-left font-semibold text-slate-600 min-w-[180px]">
                    Student
                  </th>
                  {sessionDates.map((d) => {
                    const dt = new Date(d);
                    const isPast = dt <= today;
                    const isDirty = dirty.has(d);
                    return (
                      <th key={d} className={`border-r border-slate-100 px-1 py-2 text-center font-medium min-w-[56px] ${!isPast ? "opacity-40" : ""} ${isDirty ? "bg-indigo-50" : ""}`}>
                        <div className="text-[10px] text-slate-400">
                          {DAY_LABELS[dt.getDay()]}
                        </div>
                        <div className="text-slate-700 font-semibold">
                          {dt.toLocaleDateString("en-US", { month: "numeric", day: "numeric" })}
                        </div>
                        {isPast && (
                          <ColumnMenu
                            onAllPresent={() => markAllPresent(d)}
                            onAllAbsent={() => markAllAbsent(d)}
                          />
                        )}
                      </th>
                    );
                  })}
                  <th className="sticky right-0 z-10 bg-slate-50 border-l border-slate-200 px-3 py-3 text-center font-semibold text-slate-600 min-w-[140px]">
                    Summary
                  </th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, rowIdx) => {
                  const summary = summaryMap[student.id];
                  const pct = summary?.attendancePct ?? 0;
                  const isEligible = summary?.isEligible ?? false;
                  const hasCert = summary?.hasCert ?? false;
                  return (
                    <tr key={student.id} className={`border-b border-slate-100 ${rowIdx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                      {/* Name col */}
                      <td className={`sticky left-0 z-10 border-r border-slate-200 px-4 py-2.5 ${rowIdx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                        <p className="font-semibold text-slate-900 truncate max-w-[160px]">{student.name}</p>
                        <p className="text-[10px] text-slate-400 truncate max-w-[160px]">{student.email}</p>
                      </td>
                      {/* Attendance cells */}
                      {sessionDates.map((d) => {
                        const status = localAtt[student.id]?.[d] ?? null;
                        const isPast = new Date(d) <= today;
                        return (
                          <td key={d} className="border-r border-slate-100 p-1 text-center">
                            {isPast ? (
                              <button
                                onClick={() => toggleCell(student.id, d)}
                                className={`w-10 h-8 rounded-lg text-xs font-bold transition-colors ${
                                  status ? STATUS_STYLE[status] : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                                }`}
                                title={status ? STATUS_LABEL[status] : "Not marked"}
                              >
                                {status ?? "—"}
                              </button>
                            ) : (
                              <span className="text-slate-300 text-xs">·</span>
                            )}
                          </td>
                        );
                      })}
                      {/* Summary col */}
                      <td className="sticky right-0 z-10 border-l border-slate-200 px-3 py-2.5 bg-white text-center">
                        <p className={`text-sm font-bold tabular-nums ${
                          pct >= certThreshold ? "text-emerald-700" : pct >= 50 ? "text-amber-700" : "text-red-700"
                        }`}>
                          {pct}%
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {summary?.presentCount ?? 0}/{summary?.totalSessions ?? 0}
                        </p>
                        {hasCert ? (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 font-semibold mt-0.5">
                            <Award className="h-3 w-3" /> Cert
                          </span>
                        ) : isEligible ? (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-indigo-600 font-semibold mt-0.5">
                            <Check className="h-3 w-3" /> Eligible
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-400 mt-0.5">
                            <AlertTriangle className="h-3 w-3" /> Below threshold
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {/* Footer: column totals */}
                <tr className="bg-slate-50 border-t-2 border-slate-200 font-semibold">
                  <td className="sticky left-0 z-10 bg-slate-100 border-r border-slate-200 px-4 py-2.5 text-xs text-slate-500">
                    Present count
                  </td>
                  {sessionDates.map((d) => {
                    const isPast = new Date(d) <= today;
                    const count = columnTotals[d] ?? 0;
                    return (
                      <td key={d} className="border-r border-slate-100 px-1 py-2 text-center">
                        {isPast ? (
                          <span className={`text-xs font-bold tabular-nums ${
                            count === students.length ? "text-emerald-600" : count === 0 ? "text-red-600" : "text-amber-600"
                          }`}>
                            {count}/{students.length}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="sticky right-0 z-10 bg-slate-100 border-l border-slate-200 px-3 py-2.5 text-center">
                    <span className="text-xs text-slate-500">
                      {summaries.filter((s) => s.isEligible).length}/{students.length} eligible
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cert eligibility summary */}
      {students.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Award className="h-4 w-4 text-yellow-500" />
            Certificate Eligibility (≥{certThreshold}% attendance)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-center">
              <p className="text-2xl font-bold text-emerald-700 tabular-nums">
                {summaries.filter((s) => s.hasCert).length}
              </p>
              <p className="text-xs text-emerald-600 mt-0.5">Cert issued</p>
            </div>
            <div className="rounded-xl bg-indigo-50 border border-indigo-200 p-3 text-center">
              <p className="text-2xl font-bold text-indigo-700 tabular-nums">
                {summaries.filter((s) => s.isEligible && !s.hasCert).length}
              </p>
              <p className="text-xs text-indigo-600 mt-0.5">Eligible, not yet issued</p>
            </div>
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-center">
              <p className="text-2xl font-bold text-amber-700 tabular-nums">
                {summaries.filter((s) => !s.isEligible && !s.hasCert).length}
              </p>
              <p className="text-xs text-amber-600 mt-0.5">Below threshold</p>
            </div>
          </div>
          {summaries.filter((s) => s.isEligible && !s.hasCert).length > 0 && (
            <Link
              href="/admin/training-center/certifications?status=eligible"
              className="mt-3 inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              <Award className="h-4 w-4" /> Issue certificates for eligible students
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

/* Small dropdown for column-level bulk actions */
function ColumnMenu({ onAllPresent, onAllAbsent }: { onAllPresent: () => void; onAllAbsent: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative mt-1 flex justify-center">
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-0.5 rounded hover:bg-slate-200 text-slate-400"
        title="Bulk mark"
      >
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-20 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-[120px]">
          <button
            onClick={() => { onAllPresent(); setOpen(false); }}
            className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-slate-50 text-emerald-700"
          >
            <CheckSquare className="h-3.5 w-3.5" /> All Present
          </button>
          <button
            onClick={() => { onAllAbsent(); setOpen(false); }}
            className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-slate-50 text-red-700"
          >
            <Square className="h-3.5 w-3.5" /> All Absent
          </button>
        </div>
      )}
    </div>
  );
}
