"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, Search, Loader2, Award, AlertTriangle, CheckCircle2 } from "lucide-react";

type Participant = {
  id: string;
  name: string;
  email: string;
  course: { id: string; title: string } | null;
  schedule: { id: string; name: string } | null;
  accessGranted: boolean;
  presentCount: number;
  totalSessions: number;
  attendancePct: number | null;
  certificate: { id: string; issuedAt: string } | null;
};

export default function ParticipantsPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "50" });
    if (search) params.set("search", search);
    const res = await fetch(`/api/admin/training-center/participants?${params}`).then((r) => r.json());
    if (res.success) {
      setParticipants(res.data.participants);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    }
    setLoading(false);
  }, [search, page]);

  useEffect(() => { setPage(1); }, [search]);
  useEffect(() => { void load(); }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Participants</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            All enrolled students — {total} total
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name…"
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : participants.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No participants found</p>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {["Student", "Course", "Batch", "Attendance", "Status"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {participants.map((p) => {
                  const pct = p.attendancePct;
                  const hasCert = !!p.certificate;
                  const isEligible = pct !== null && pct >= 75;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">{p.name}</p>
                        <p className="text-xs text-slate-400">{p.email}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-700 text-xs">
                        {p.course?.title ?? <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {p.schedule?.name ?? <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {pct === null ? (
                          <span className="text-xs text-slate-400">No data</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${pct >= 75 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-400" : "bg-red-400"}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className={`text-xs font-semibold tabular-nums ${pct >= 75 ? "text-emerald-700" : pct >= 50 ? "text-amber-700" : "text-red-700"}`}>
                              {pct}%
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {p.presentCount}/{p.totalSessions}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {hasCert ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                            <Award className="h-3 w-3" /> Certified
                          </span>
                        ) : isEligible ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="h-3 w-3" /> Eligible
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                            <AlertTriangle className="h-3 w-3" /> In Progress
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span>Showing {participants.length} of {total}</span>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-2 py-1 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
                  >
                    Prev
                  </button>
                  <span>{page}/{totalPages}</span>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-2 py-1 rounded border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
