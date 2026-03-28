"use client";

import { CalendarCheck, CalendarClock, Clock } from "lucide-react";

export interface KpiData {
  todayCount: number;
  upcomingCount: number;
  freeSlotsToday: number;
}

interface CalendarKpiStripProps {
  kpi: KpiData | null;
}

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}

function KpiCard({ icon, label, value, color }: KpiCardProps) {
  return (
    <div className={`flex items-center gap-3 bg-white rounded-xl border px-4 py-3 ${color}`}>
      <div className="shrink-0">{icon}</div>
      <div>
        <p className="text-xl font-bold text-gray-800 leading-none">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export function CalendarKpiStrip({ kpi }: CalendarKpiStripProps) {
  if (!kpi) return null;

  return (
    <div className="grid grid-cols-3 gap-3">
      <KpiCard
        icon={<CalendarCheck className="h-5 w-5 text-blue-500" />}
        label="Today's events"
        value={kpi.todayCount}
        color="border-blue-100"
      />
      <KpiCard
        icon={<CalendarClock className="h-5 w-5 text-orange-500" />}
        label="Upcoming (7 days)"
        value={kpi.upcomingCount}
        color="border-orange-100"
      />
      <KpiCard
        icon={<Clock className="h-5 w-5 text-green-500" />}
        label="Free slots today"
        value={kpi.freeSlotsToday}
        color="border-green-100"
      />
    </div>
  );
}
