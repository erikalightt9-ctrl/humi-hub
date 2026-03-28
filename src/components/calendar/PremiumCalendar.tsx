"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import { WeekGrid } from "./WeekGrid";
import { CalendarSidebar, SidebarFilters } from "./CalendarSidebar";
import { CalendarKpiStrip, KpiData } from "./CalendarKpiStrip";
import { GoogleCalendarConnect } from "./GoogleCalendarConnect";
import { EventDialog } from "@/components/admin/EventDialog";
import {
  CalendarEvent,
  CalendarView,
  EventTypeKey,
  TYPE_COLORS,
  getWeekDates,
  toDateString,
  addDays,
} from "./types";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Course {
  id: string;
  title: string;
}

interface PremiumCalendarProps {
  initialEvents: CalendarEvent[];
  courses: ReadonlyArray<Course>;
  kpi: KpiData | null;
}

// ── View label helpers ────────────────────────────────────────────────────────

function fmtWeekRange(dates: Date[]): string {
  const first = dates[0];
  const last = dates[dates.length - 1];
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const firstStr = first.toLocaleDateString("en-US", opts);
  const lastStr = last.toLocaleDateString("en-US", {
    ...opts,
    year: "numeric",
  });
  return `${firstStr} – ${lastStr}`;
}

function fmtMonthYear(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// ── PremiumCalendar ───────────────────────────────────────────────────────────

export function PremiumCalendar({
  initialEvents,
  courses,
  kpi: initialKpi,
}: PremiumCalendarProps) {
  const today = toDateString(new Date());
  const [view, setView] = useState<CalendarView>("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [kpi, setKpi] = useState<KpiData | null>(initialKpi);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [prefill, setPrefill] = useState<{
    date: string;
    startTime: string;
    endTime: string;
  } | null>(null);

  // Sidebar filters
  const [filters, setFilters] = useState<SidebarFilters>({
    courseId: "",
    typeFilters: new Set<EventTypeKey>(),
  });

  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchEvents = useCallback(async (date: Date) => {
    setLoading(true);
    try {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const res = await fetch(`/api/admin/calendar?year=${year}&month=${month}`);
      const data = await res.json();
      if (data.success && data.data) {
        setEvents(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data.data.map((e: any) => ({
            id: e.id,
            title: e.title,
            description: e.description ?? null,
            date: typeof e.date === "string" ? e.date.slice(0, 10) : new Date(e.date).toISOString().slice(0, 10),
            endDate: e.endDate ? (typeof e.endDate === "string" ? e.endDate.slice(0, 10) : new Date(e.endDate).toISOString().slice(0, 10)) : null,
            startTime: e.startTime ?? null,
            endTime: e.endTime ?? null,
            type: e.type,
            courseId: e.courseId ?? null,
            assignedUserId: e.assignedUserId ?? null,
            creatorRole: e.creatorRole ?? null,
            source: "event" as const,
          })),
        );
      }
    } catch (err) {
      console.error("[PremiumCalendar] fetch events:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchKpi = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/calendar?kpi=1");
      const data = await res.json();
      if (data.success && data.data) setKpi(data.data);
    } catch {
      /* non-critical */
    }
  }, []);

  const handleSuccess = useCallback(() => {
    fetchEvents(currentDate);
    fetchKpi();
  }, [fetchEvents, fetchKpi, currentDate]);

  // ── Navigation ─────────────────────────────────────────────────────────────

  function goToToday() {
    const n = new Date();
    setCurrentDate(n);
    fetchEvents(n);
  }

  function goPrev() {
    setCurrentDate((d) => {
      const next = view === "week" ? addDays(d, -7) : addDays(d, -1);
      fetchEvents(next);
      return next;
    });
  }

  function goNext() {
    setCurrentDate((d) => {
      const next = view === "week" ? addDays(d, 7) : addDays(d, 1);
      fetchEvents(next);
      return next;
    });
  }

  // ── Event handlers ─────────────────────────────────────────────────────────

  function handleEventClick(ev: CalendarEvent) {
    setEditingEvent(ev);
    setPrefill(null);
    setDialogOpen(true);
  }

  function handleAddClick() {
    setEditingEvent(null);
    setPrefill(null);
    setDialogOpen(true);
  }

  function handleCreateSlot(dateStr: string, startTime: string, endTime: string) {
    setEditingEvent(null);
    setPrefill({ date: dateStr, startTime, endTime });
    setDialogOpen(true);
  }

  async function handleEventMove(
    eventId: string,
    newDate: string,
    newStart: string,
    newEnd: string,
  ) {
    try {
      const res = await fetch(`/api/admin/calendar/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: newDate, startTime: newStart, endTime: newEnd }),
      });
      const data = await res.json();
      if (data.success) {
        fetchEvents(currentDate);
      }
    } catch (err) {
      console.error("[PremiumCalendar] move event:", err);
    }
  }

  // ── Filtered events ────────────────────────────────────────────────────────

  const filteredEvents = useMemo(() => {
    let result = events;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          (e.description ?? "").toLowerCase().includes(q),
      );
    }

    if (filters.courseId) {
      result = result.filter(
        (e) => e.courseId === filters.courseId || e.courseId === null,
      );
    }

    if (filters.typeFilters.size > 0) {
      result = result.filter((e) => filters.typeFilters.has(e.type as EventTypeKey));
    }

    return result;
  }, [events, search, filters]);

  // ── Upcoming (next 7 days) for sidebar ────────────────────────────────────

  const upcomingEvents = useMemo(() => {
    const now = toDateString(new Date());
    const futureLimit = toDateString(addDays(new Date(), 7));
    return filteredEvents
      .filter((e) => e.date >= now && e.date <= futureLimit)
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return (a.startTime ?? "").localeCompare(b.startTime ?? "");
      })
      .slice(0, 8);
  }, [filteredEvents]);

  // Initial load of extra months when switching view
  useEffect(() => {
    fetchEvents(currentDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Navigation label ───────────────────────────────────────────────────────

  const navLabel =
    view === "week"
      ? fmtWeekRange(weekDates)
      : view === "day"
      ? currentDate.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : fmtMonthYear(currentDate);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-120px)] min-h-0">
      {/* KPI strip */}
      <CalendarKpiStrip kpi={kpi} />

      {/* Top bar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Today */}
        <button
          onClick={goToToday}
          className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Today
        </button>

        {/* Navigation */}
        <div className="flex items-center gap-1">
          <button
            onClick={goPrev}
            className="p-1.5 rounded-lg hover:bg-gray-100"
            aria-label="Previous"
          >
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          </button>
          <button
            onClick={goNext}
            className="p-1.5 rounded-lg hover:bg-gray-100"
            aria-label="Next"
          >
            <ChevronRight className="h-4 w-4 text-gray-600" />
          </button>
        </div>

        {/* Current period label */}
        <span className="text-sm font-semibold text-gray-800">{navLabel}</span>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events…"
            className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-44"
          />
        </div>

        {/* View toggles */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          {(["day", "week", "month"] as CalendarView[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 text-sm capitalize transition-colors
                ${view === v
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-50"
                }`}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Google Calendar connect button (compact) */}
        <GoogleCalendarConnect compact />

        {/* Loading indicator */}
        {loading && (
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {/* Main layout: sidebar + grid */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Sidebar */}
        <div className="w-48 shrink-0">
          <CalendarSidebar
            courses={courses}
            filters={filters}
            onFiltersChange={setFilters}
            upcomingEvents={upcomingEvents}
            onEventClick={handleEventClick}
            onAddClick={handleAddClick}
          />
        </div>

        {/* Grid */}
        <div className="flex-1 min-w-0 bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {view === "week" && (
            <WeekGrid
              weekStart={weekDates[0]}
              events={filteredEvents}
              today={today}
              onEventClick={handleEventClick}
              onCreateSlot={handleCreateSlot}
              onEventMove={handleEventMove}
            />
          )}

          {view === "day" && (
            <WeekGrid
              weekStart={currentDate}
              events={filteredEvents.filter((e) => e.date === toDateString(currentDate))}
              today={today}
              onEventClick={handleEventClick}
              onCreateSlot={handleCreateSlot}
              onEventMove={handleEventMove}
            />
          )}

          {view === "month" && (
            <MonthView
              currentDate={currentDate}
              events={filteredEvents}
              today={today}
              onEventClick={handleEventClick}
            />
          )}
        </div>
      </div>

      {/* Event create/edit dialog */}
      <EventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        event={editingEvent}
        prefill={prefill}
        courses={courses}
        onSuccess={handleSuccess}
      />
    </div>
  );
}

// ── Month View ────────────────────────────────────────────────────────────────

interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  today: string;
  onEventClick: (event: CalendarEvent) => void;
}

function MonthView({ currentDate, events, today, onEventClick }: MonthViewProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // First day of month (align to Mon=0)
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7; // Mon=0

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

  const cells: (Date | null)[] = Array.from({ length: totalCells }, (_, i) => {
    const dayNum = i - startOffset + 1;
    if (dayNum < 1 || dayNum > daysInMonth) return null;
    return new Date(year, month, dayNum);
  });

  const DOW_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const byDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      const arr = map.get(ev.date) ?? [];
      arr.push(ev);
      map.set(ev.date, arr);
    }
    return map;
  }, [events]);

  return (
    <div className="flex flex-col h-full">
      {/* DOW header */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {DOW_LABELS.map((d) => (
          <div
            key={d}
            className="text-center text-xs uppercase tracking-wide text-gray-400 py-2"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div
        className="grid grid-cols-7 flex-1 overflow-y-auto"
        style={{ gridAutoRows: "minmax(80px, 1fr)" }}
      >
        {cells.map((date, i) => {
          if (!date) {
            return (
              <div
                key={`empty-${i}`}
                className="border-b border-r border-gray-100 bg-gray-50/50"
              />
            );
          }
          const ds = toDateString(date);
          const isToday = ds === today;
          const dayEvents = byDate.get(ds) ?? [];

          return (
            <div
              key={ds}
              className={`border-b border-r border-gray-100 p-1 overflow-hidden
                ${isToday ? "bg-blue-50/40" : ""}`}
            >
              <div
                className={`w-6 h-6 flex items-center justify-center text-xs font-semibold rounded-full mb-1
                  ${isToday ? "bg-blue-600 text-white" : "text-gray-600"}`}
              >
                {date.getDate()}
              </div>
              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map((ev) => {
                  const colors = TYPE_COLORS[ev.type as EventTypeKey] ?? TYPE_COLORS.CUSTOM;
                  const { bg, text } = colors;
                  return (
                    <button
                      key={ev.id}
                      onClick={() => onEventClick(ev)}
                      className={`w-full text-left text-[10px] px-1 rounded truncate ${bg} ${text}`}
                    >
                      {ev.title}
                    </button>
                  );
                })}
                {dayEvents.length > 3 && (
                  <p className="text-[10px] text-gray-400 pl-1">
                    +{dayEvents.length - 3} more
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
