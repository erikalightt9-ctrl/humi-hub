"use client";

import { useRef, useCallback } from "react";
import {
  CalendarEvent,
  TYPE_COLORS,
  toMinutes,
  getWeekDates,
  toDateString,
  fmtDayHeader,
} from "./types";

// ── Constants ──────────────────────────────────────────────────────────────────
const HOUR_START = 8;   // 08:00
const HOUR_END   = 22;  // 22:00 (exclusive)
const TOTAL_HOURS = HOUR_END - HOUR_START; // 14
const HOUR_PX = 64;     // px per hour
const GRID_HEIGHT = TOTAL_HOURS * HOUR_PX; // 896px

// Snap drag positions to 15-minute increments
const SNAP_MINUTES = 15;

// ── Helpers ───────────────────────────────────────────────────────────────────

function minuteToY(mins: number): number {
  return ((mins - HOUR_START * 60) / 60) * HOUR_PX;
}

function yToMinute(y: number): number {
  const raw = (y / HOUR_PX) * 60 + HOUR_START * 60;
  return Math.round(raw / SNAP_MINUTES) * SNAP_MINUTES;
}

function minutesToTimeStr(mins: number): string {
  const clamped = Math.max(HOUR_START * 60, Math.min(HOUR_END * 60, mins));
  const h = String(Math.floor(clamped / 60)).padStart(2, "0");
  const m = String(clamped % 60).padStart(2, "0");
  return `${h}:${m}`;
}

function formatTimeLabel(h: number): string {
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour} ${ampm}`;
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface DragCreate {
  dateStr: string;
  startY: number;
  currentY: number;
}

interface WeekGridProps {
  weekStart: Date;          // Monday of displayed week
  events: CalendarEvent[];
  today: string;            // "YYYY-MM-DD"
  onEventClick: (event: CalendarEvent) => void;
  onCreateSlot: (dateStr: string, startTime: string, endTime: string) => void;
  onEventMove: (eventId: string, newDate: string, newStart: string, newEnd: string) => void;
}

// ── Event block ───────────────────────────────────────────────────────────────

function EventBlock({
  event,
  onClick,
  onDragStart,
}: {
  event: CalendarEvent;
  onClick: () => void;
  onDragStart: (e: React.DragEvent, event: CalendarEvent) => void;
}) {
  const startMins = toMinutes(event.startTime);
  const endMins = toMinutes(event.endTime);
  if (startMins < 0 || endMins < 0 || endMins <= startMins) return null;

  const top = minuteToY(startMins);
  const height = Math.max(22, ((endMins - startMins) / 60) * HOUR_PX);
  const colors = TYPE_COLORS[event.type] ?? TYPE_COLORS.CUSTOM;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, event)}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      style={{ top, height, position: "absolute", left: 2, right: 2 }}
      className={`rounded-md border-l-4 px-1.5 py-0.5 overflow-hidden cursor-grab select-none z-10
        ${colors.bg} ${colors.border} ${colors.text}`}
    >
      <p className="text-[11px] font-semibold leading-tight truncate">{event.title}</p>
      {height > 32 && (
        <p className="text-[10px] opacity-70 leading-tight">
          {event.startTime}–{event.endTime}
        </p>
      )}
    </div>
  );
}

// ── All-day event bar ─────────────────────────────────────────────────────────

function AllDayBar({
  event,
  onClick,
}: {
  event: CalendarEvent;
  onClick: () => void;
}) {
  const colors = TYPE_COLORS[event.type] ?? TYPE_COLORS.CUSTOM;
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`rounded text-[11px] font-medium px-1.5 py-0.5 mb-0.5 truncate cursor-pointer
        ${colors.bg} ${colors.text} border-l-2 ${colors.border}`}
    >
      {event.title}
    </div>
  );
}

// ── WeekGrid ──────────────────────────────────────────────────────────────────

export function WeekGrid({
  weekStart,
  events,
  today,
  onEventClick,
  onCreateSlot,
  onEventMove,
}: WeekGridProps) {
  const weekDates = getWeekDates(weekStart);
  const dragCreateRef = useRef<DragCreate | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const ghostRef = useRef<HTMLDivElement | null>(null);

  // Partition events by date
  const byDate = new Map<string, { timed: CalendarEvent[]; allDay: CalendarEvent[] }>();
  for (const date of weekDates) {
    byDate.set(toDateString(date), { timed: [], allDay: [] });
  }
  for (const ev of events) {
    const bucket = byDate.get(ev.date);
    if (!bucket) continue;
    if (ev.startTime && ev.endTime) {
      bucket.timed.push(ev);
    } else {
      bucket.allDay.push(ev);
    }
  }

  // ── Drag-to-create ────────────────────────────────────────────────────────
  const handleColumnMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, dateStr: string) => {
      if (e.button !== 0) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const y = e.clientY - rect.top;
      dragCreateRef.current = { dateStr, startY: y, currentY: y };

      const ghost = document.createElement("div");
      ghost.style.cssText = `
        position:absolute; left:2px; right:2px; z-index:20;
        background:rgba(99,102,241,0.25); border:2px dashed rgb(99,102,241);
        border-radius:6px; pointer-events:none;
      `;
      e.currentTarget.appendChild(ghost);
      ghostRef.current = ghost;

      const updateGhost = (clientY: number) => {
        const dc = dragCreateRef.current;
        if (!dc || !ghostRef.current) return;
        const curY = clientY - rect.top;
        dragCreateRef.current = { ...dc, currentY: curY };
        const top = Math.min(dc.startY, curY);
        const height = Math.max(16, Math.abs(curY - dc.startY));
        ghostRef.current.style.top = `${top}px`;
        ghostRef.current.style.height = `${height}px`;
      };

      const onMove = (me: MouseEvent) => updateGhost(me.clientY);
      const onUp = (me: MouseEvent) => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        ghostRef.current?.remove();
        ghostRef.current = null;

        const dc = dragCreateRef.current;
        dragCreateRef.current = null;
        if (!dc) return;

        const endY = me.clientY - rect.top;
        const startMins = yToMinute(Math.min(dc.startY, endY));
        const endMins = yToMinute(Math.max(dc.startY, endY));
        if (endMins - startMins < 15) return; // too short
        onCreateSlot(dc.dateStr, minutesToTimeStr(startMins), minutesToTimeStr(endMins));
      };

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [onCreateSlot],
  );

  // ── Drag-to-move ──────────────────────────────────────────────────────────
  const handleEventDragStart = useCallback(
    (e: React.DragEvent, event: CalendarEvent) => {
      e.dataTransfer.setData("eventId", event.id);
      e.dataTransfer.setData("originalDate", event.date);
      e.dataTransfer.setData("startTime", event.startTime ?? "");
      e.dataTransfer.setData("endTime", event.endTime ?? "");
      const duration =
        toMinutes(event.endTime) - toMinutes(event.startTime);
      e.dataTransfer.setData("duration", String(duration));
    },
    [],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>, dateStr: string) => {
      e.preventDefault();
      const eventId = e.dataTransfer.getData("eventId");
      const duration = parseInt(e.dataTransfer.getData("duration"), 10);
      if (!eventId || isNaN(duration)) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const newStartMins = yToMinute(y);
      const newEndMins = newStartMins + duration;

      onEventMove(
        eventId,
        dateStr,
        minutesToTimeStr(newStartMins),
        minutesToTimeStr(newEndMins),
      );
    },
    [onEventMove],
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Day headers */}
      <div className="flex border-b border-gray-200 bg-white">
        {/* Gutter */}
        <div className="w-14 shrink-0" />
        {weekDates.map((date) => {
          const ds = toDateString(date);
          const { day, num } = fmtDayHeader(date);
          const isToday = ds === today;
          return (
            <div
              key={ds}
              className="flex-1 text-center py-2 border-l border-gray-100"
            >
              <span className="text-xs uppercase tracking-wide text-gray-400">{day}</span>
              <div
                className={`mx-auto mt-0.5 w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold
                  ${isToday ? "bg-blue-600 text-white" : "text-gray-700"}`}
              >
                {num}
              </div>
            </div>
          );
        })}
      </div>

      {/* All-day strip */}
      <div className="flex border-b border-gray-200 bg-gray-50 min-h-[28px]">
        <div className="w-14 shrink-0 text-[10px] text-gray-400 text-right pr-2 pt-1">
          All day
        </div>
        {weekDates.map((date) => {
          const ds = toDateString(date);
          const allDay = byDate.get(ds)?.allDay ?? [];
          return (
            <div key={ds} className="flex-1 border-l border-gray-100 px-0.5 py-0.5">
              {allDay.map((ev) => (
                <AllDayBar key={ev.id} event={ev} onClick={() => onEventClick(ev)} />
              ))}
            </div>
          );
        })}
      </div>

      {/* Scrollable time grid */}
      <div
        ref={gridRef}
        className="flex flex-1 overflow-y-auto"
        style={{ scrollbarWidth: "thin" }}
      >
        {/* Hour labels */}
        <div className="w-14 shrink-0 relative" style={{ height: GRID_HEIGHT }}>
          {Array.from({ length: TOTAL_HOURS }, (_, i) => (
            <div
              key={i}
              style={{ top: i * HOUR_PX - 8 }}
              className="absolute right-2 text-[10px] text-gray-400 select-none"
            >
              {formatTimeLabel(HOUR_START + i)}
            </div>
          ))}
        </div>

        {/* Day columns */}
        {weekDates.map((date) => {
          const ds = toDateString(date);
          const isToday = ds === today;
          const timed = byDate.get(ds)?.timed ?? [];
          const nowMins = (() => {
            if (!isToday) return -1;
            const n = new Date();
            return n.getHours() * 60 + n.getMinutes();
          })();

          return (
            <div
              key={ds}
              className={`flex-1 border-l relative cursor-crosshair
                ${isToday ? "bg-blue-50/30" : "bg-white hover:bg-gray-50/50"}`}
              style={{ height: GRID_HEIGHT }}
              onMouseDown={(e) => handleColumnMouseDown(e, ds)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, ds)}
            >
              {/* Horizontal hour lines */}
              {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                <div
                  key={i}
                  style={{ top: i * HOUR_PX }}
                  className="absolute inset-x-0 border-t border-gray-100"
                />
              ))}

              {/* Half-hour faint lines */}
              {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                <div
                  key={`h${i}`}
                  style={{ top: i * HOUR_PX + HOUR_PX / 2 }}
                  className="absolute inset-x-0 border-t border-gray-50"
                />
              ))}

              {/* Now indicator */}
              {nowMins >= HOUR_START * 60 && nowMins < HOUR_END * 60 && (
                <div
                  style={{ top: minuteToY(nowMins) }}
                  className="absolute inset-x-0 border-t-2 border-blue-500 z-10 pointer-events-none"
                >
                  <div className="absolute -top-1.5 -left-0.5 w-3 h-3 rounded-full bg-blue-500" />
                </div>
              )}

              {/* Timed event blocks */}
              {timed.map((ev) => (
                <EventBlock
                  key={ev.id}
                  event={ev}
                  onClick={() => onEventClick(ev)}
                  onDragStart={handleEventDragStart}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
