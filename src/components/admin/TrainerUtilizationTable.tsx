import type { TrainerUtilizationStat } from "@/lib/repositories/trainer-availability.repository";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function utilizationBarColor(pct: number): string {
  if (pct >= 90) return "bg-red-500";
  if (pct >= 70) return "bg-amber-500";
  return "bg-emerald-500";
}

function utilizationTextColor(pct: number): string {
  if (pct >= 90) return "text-red-700";
  if (pct >= 70) return "text-amber-700";
  return "text-emerald-700";
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface TrainerUtilizationTableProps {
  readonly stats: ReadonlyArray<TrainerUtilizationStat>;
}

export function TrainerUtilizationTable({ stats }: TrainerUtilizationTableProps) {
  if (stats.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
        <p className="text-gray-500">No active trainers found.</p>
      </div>
    );
  }

  const totalStudents = stats.reduce((s, t) => s + t.totalStudents, 0);
  const totalCapacity = stats.reduce((s, t) => s + t.totalCapacity, 0);
  const overallPct = totalCapacity > 0 ? Math.round((totalStudents / totalCapacity) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-6 rounded-xl border border-gray-200 bg-white px-5 py-4">
        <div>
          <p className="text-xs text-gray-500">Overall Utilization</p>
          <p className={`text-2xl font-bold ${utilizationTextColor(overallPct)}`}>
            {overallPct}%
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Total Students</p>
          <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Total Capacity</p>
          <p className="text-2xl font-bold text-gray-900">{totalCapacity}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Active Trainers</p>
          <p className="text-2xl font-bold text-gray-900">{stats.length}</p>
        </div>

        {/* Overall progress bar */}
        <div className="flex-1 min-w-[160px]">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Seats filled</span>
            <span>{totalStudents} / {totalCapacity}</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-gray-100">
            <div
              className={`h-2.5 rounded-full ${utilizationBarColor(overallPct)} transition-all`}
              style={{ width: `${Math.min(overallPct, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Per-trainer table */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Trainer
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Schedules
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Students
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide min-w-[140px]">
                Utilization
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {stats.map((t) => {
              return (
                <tr key={t.trainerId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {t.trainerName}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700">
                    {t.activeSchedules === 0 ? (
                      <span className="text-gray-400">—</span>
                    ) : (
                      t.activeSchedules
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700">
                    {t.totalCapacity === 0 ? (
                      <span className="text-gray-400">—</span>
                    ) : (
                      <span>
                        {t.totalStudents}
                        <span className="text-gray-400 text-xs"> / {t.totalCapacity}</span>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {t.totalCapacity === 0 ? (
                      <span className="text-xs text-gray-400">No active schedules</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-gray-100">
                          <div
                            className={`h-2 rounded-full ${utilizationBarColor(t.utilizationPct)} transition-all`}
                            style={{ width: `${Math.min(t.utilizationPct, 100)}%` }}
                          />
                        </div>
                        <span className={`text-xs font-semibold w-9 text-right ${utilizationTextColor(t.utilizationPct)}`}>
                          {t.utilizationPct}%
                        </span>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
          Under 70% — good availability
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500" />
          70–89% — filling up
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
          90%+ — near or at capacity
        </span>
      </div>
    </div>
  );
}
