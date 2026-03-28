"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GraduationCap, Mail, Phone, Search, Loader2, MessageSquare, ArrowLeft } from "lucide-react";

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
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function TrainersListPage() {
  const [trainers, setTrainers] = useState<ReadonlyArray<Trainer>>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");

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

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/corporate/trainers"
          className="p-2 rounded-xl bg-ds-surface border border-ds-border text-ds-muted hover:text-ds-text hover:border-ds-primary/50 transition-colors"
          title="Back to Trainers"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-ds-text">All Trainers</h1>
          <p className="text-sm text-ds-muted mt-0.5">Certified trainers assigned to your organization</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ds-muted" />
        <input
          type="text"
          placeholder="Search by name or specialization…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm bg-ds-surface border border-ds-border text-ds-text placeholder:text-ds-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-ds-primary/50"
        />
      </div>

      {/* Table */}
      <div className="bg-ds-card rounded-xl border border-ds-border overflow-hidden">
        <div className="px-5 py-3 border-b border-ds-border text-xs text-ds-muted">
          {filtered.length} trainer{filtered.length !== 1 ? "s" : ""}
          {filtered.length < trainers.length && ` · filtered from ${trainers.length}`}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-ds-primary" />
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-ds-surface border-b border-ds-border">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-ds-muted uppercase tracking-wide">Trainer</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-ds-muted uppercase tracking-wide hidden sm:table-cell">Specialization</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-ds-muted uppercase tracking-wide hidden md:table-cell">Contact</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-ds-muted uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ds-border">
              {filtered.length === 0 ? (
                <tr><td colSpan={4}>
                  <div className="py-16 text-center">
                    <GraduationCap className="h-10 w-10 text-ds-muted/30 mx-auto mb-3" />
                    <p className="text-sm font-medium text-ds-muted">
                      {search ? "No trainers match your search" : "No trainers assigned yet"}
                    </p>
                    <p className="text-xs text-ds-muted/60 mt-1">
                      {search ? "Try a different name or specialization" : "Contact your account manager to request trainer assignments"}
                    </p>
                  </div>
                </td></tr>
              ) : filtered.map((trainer) => (
                <tr key={trainer.id} className="hover:bg-ds-surface/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-indigo-900/50 text-indigo-400 flex items-center justify-center font-semibold text-sm shrink-0">
                        {trainer.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ds-text truncate">{trainer.name}</p>
                        {trainer.bio && (
                          <p className="text-xs text-ds-muted truncate max-w-[220px]">{trainer.bio}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden sm:table-cell">
                    <span className="text-sm text-ds-muted">
                      {trainer.specialization ?? "—"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <div className="space-y-1">
                      <a href={`mailto:${trainer.email}`} className="flex items-center gap-1.5 text-xs text-ds-muted hover:text-ds-text transition-colors">
                        <Mail className="h-3 w-3 shrink-0" />
                        <span className="truncate max-w-[180px]">{trainer.email}</span>
                      </a>
                      {trainer.phone && (
                        <a href={`tel:${trainer.phone}`} className="flex items-center gap-1.5 text-xs text-ds-muted hover:text-ds-text transition-colors">
                          <Phone className="h-3 w-3 shrink-0" />
                          {trainer.phone}
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    {trainer.isActive ? (
                      <span className="inline-flex items-center text-xs font-medium bg-emerald-900/40 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-xs font-medium bg-ds-surface text-ds-muted border border-ds-border px-2 py-0.5 rounded-full">
                        Inactive
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-ds-muted flex items-center gap-1.5">
        <MessageSquare className="h-3.5 w-3.5" />
        Trainers are assigned by your platform administrator. Contact support to request changes.
      </p>
    </div>
  );
}
