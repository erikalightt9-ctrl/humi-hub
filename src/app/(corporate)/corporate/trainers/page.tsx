"use client";

import { useEffect, useState } from "react";
import { GraduationCap, Mail, Phone, Search, Loader2, MessageSquare } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Trainer {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly phone: string | null;
  readonly bio: string | null;
  readonly specialization: string | null;
  readonly isActive: boolean;
}

/* ------------------------------------------------------------------ */
/*  Empty state                                                        */
/* ------------------------------------------------------------------ */

function EmptyState({ query }: { readonly query: string }) {
  return (
    <tr>
      <td colSpan={4}>
        <div className="py-16 text-center">
          <GraduationCap className="h-10 w-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-500">
            {query ? "No trainers match your search" : "No trainers assigned yet"}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {query
              ? "Try a different name or specialization"
              : "Contact your account manager to request trainer assignments"}
          </p>
        </div>
      </td>
    </tr>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function CorporateTrainersPage() {
  const [trainers, setTrainers] = useState<ReadonlyArray<Trainer>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/corporate/trainers")
      .then((r) => r.json())
      .then((json) => { if (json.success) setTrainers(json.data ?? []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = trainers.filter((t) => {
    const q = search.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      (t.specialization ?? "").toLowerCase().includes(q) ||
      t.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-6xl">

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Trainers</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Certified trainers assigned to your organization
          </p>
        </div>
      </div>

      {/* ── Search ──────────────────────────────────────────────────── */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name or specialization…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>

      {/* ── Table ────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Summary */}
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2 text-xs text-gray-400">
          <span>{filtered.length} trainer{filtered.length !== 1 ? "s" : ""}</span>
          {filtered.length < trainers.length && (
            <span>· filtered from {trainers.length}</span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Trainer
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden sm:table-cell">
                  Specialization
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden md:table-cell">
                  Contact
                </th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <EmptyState query={search} />
              ) : (
                filtered.map((trainer) => (
                  <tr key={trainer.id} className="hover:bg-gray-50">
                    {/* Name + avatar */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold text-sm shrink-0">
                          {trainer.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{trainer.name}</p>
                          {trainer.bio && (
                            <p className="text-xs text-gray-400 truncate max-w-[220px]">{trainer.bio}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Specialization */}
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      {trainer.specialization ? (
                        <span className="text-sm text-gray-700">{trainer.specialization}</span>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>

                    {/* Contact */}
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <div className="space-y-1">
                        <a
                          href={`mailto:${trainer.email}`}
                          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 transition-colors"
                        >
                          <Mail className="h-3 w-3 shrink-0" />
                          <span className="truncate max-w-[180px]">{trainer.email}</span>
                        </a>
                        {trainer.phone && (
                          <a
                            href={`tel:${trainer.phone}`}
                            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 transition-colors"
                          >
                            <Phone className="h-3 w-3 shrink-0" />
                            {trainer.phone}
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      {trainer.isActive ? (
                        <span className="inline-flex items-center text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                          Inactive
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Footer note ─────────────────────────────────────────────── */}
      <p className="text-xs text-gray-400 flex items-center gap-1.5">
        <MessageSquare className="h-3.5 w-3.5" />
        Trainers are assigned by your platform administrator. Contact support to request changes.
      </p>
    </div>
  );
}
