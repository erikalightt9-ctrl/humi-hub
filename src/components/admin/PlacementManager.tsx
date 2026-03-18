"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  Briefcase,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  TrendingUp,
  Users,
  DollarSign,
  Trophy,
  ChevronDown,
  Building2,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type PlacementType = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "FREELANCE";

interface PlacementStudent {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly enrollment: {
    readonly course: { readonly title: string; readonly slug: string };
  };
}

interface Placement {
  readonly id: string;
  readonly studentId: string;
  readonly companyName: string;
  readonly jobTitle: string;
  readonly employmentType: PlacementType;
  readonly monthlyRate: number | null;
  readonly currency: string;
  readonly startDate: string;
  readonly notes: string | null;
  readonly placedAt: string;
  readonly student: PlacementStudent;
  readonly jobApplication: {
    readonly id: string;
    readonly jobPosting: { readonly title: string; readonly company: string };
  } | null;
}

interface PlacementStats {
  readonly totalPlacements: number;
  readonly totalGraduates: number;
  readonly placementRate: number;
  readonly avgMonthlyRate: number | null;
  readonly byEmploymentType: ReadonlyArray<{ type: PlacementType; count: number }>;
  readonly byCourse: ReadonlyArray<{ courseTitle: string; courseSlug: string; count: number }>;
  readonly recentPlacements: ReadonlyArray<{
    id: string;
    companyName: string;
    jobTitle: string;
    employmentType: PlacementType;
    monthlyRate: number | null;
    currency: string;
    placedAt: string;
    student: { id: string; name: string };
  }>;
}

interface ListData {
  readonly items: ReadonlyArray<Placement>;
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}

interface FormState {
  readonly studentId: string;
  readonly companyName: string;
  readonly jobTitle: string;
  readonly employmentType: PlacementType;
  readonly monthlyRate: string;
  readonly currency: string;
  readonly startDate: string;
  readonly notes: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const TYPE_LABELS: Record<PlacementType, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  FREELANCE: "Freelance",
};

const TYPE_COLORS: Record<PlacementType, string> = {
  FULL_TIME: "bg-green-100 text-green-800",
  PART_TIME: "bg-blue-100 text-blue-800",
  CONTRACT: "bg-amber-100 text-amber-800",
  FREELANCE: "bg-purple-100 text-purple-800",
};

const EMPTY_FORM: FormState = {
  studentId: "",
  companyName: "",
  jobTitle: "",
  employmentType: "FULL_TIME",
  monthlyRate: "",
  currency: "USD",
  startDate: "",
  notes: "",
};

/* ------------------------------------------------------------------ */
/*  Stats Banner                                                       */
/* ------------------------------------------------------------------ */

function StatsBanner({ stats }: { readonly stats: PlacementStats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
        <Trophy className="h-5 w-5 text-blue-600 mb-2" />
        <p className="text-2xl font-bold text-blue-900">{stats.placementRate}%</p>
        <p className="text-xs text-gray-500 mt-0.5">Placement Rate</p>
      </div>
      <div className="bg-green-50 rounded-xl p-4 border border-green-100">
        <Users className="h-5 w-5 text-green-600 mb-2" />
        <p className="text-2xl font-bold text-green-900">{stats.totalPlacements}</p>
        <p className="text-xs text-gray-500 mt-0.5">Students Placed</p>
      </div>
      <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
        <TrendingUp className="h-5 w-5 text-amber-600 mb-2" />
        <p className="text-2xl font-bold text-amber-900">{stats.totalGraduates}</p>
        <p className="text-xs text-gray-500 mt-0.5">Total Graduates</p>
      </div>
      <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
        <DollarSign className="h-5 w-5 text-purple-600 mb-2" />
        <p className="text-2xl font-bold text-purple-900">
          {stats.avgMonthlyRate
            ? `$${Math.round(stats.avgMonthlyRate).toLocaleString()}`
            : "—"}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">Avg Monthly Rate</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Placement Form Dialog                                              */
/* ------------------------------------------------------------------ */

interface PlacementFormProps {
  readonly editing: Placement | null;
  readonly onClose: () => void;
  readonly onSaved: () => void;
}

function PlacementFormDialog({ editing, onClose, onSaved }: PlacementFormProps) {
  const [form, setForm] = useState<FormState>(() =>
    editing
      ? {
          studentId: editing.studentId,
          companyName: editing.companyName,
          jobTitle: editing.jobTitle,
          employmentType: editing.employmentType,
          monthlyRate: editing.monthlyRate?.toString() ?? "",
          currency: editing.currency,
          startDate: editing.startDate.slice(0, 10),
          notes: editing.notes ?? "",
        }
      : EMPTY_FORM,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      studentId: form.studentId,
      companyName: form.companyName,
      jobTitle: form.jobTitle,
      employmentType: form.employmentType,
      monthlyRate: form.monthlyRate ? parseFloat(form.monthlyRate) : undefined,
      currency: form.currency,
      startDate: form.startDate,
      notes: form.notes || undefined,
    };

    try {
      const url = editing
        ? `/api/admin/placements/${editing.id}`
        : "/api/admin/placements";
      const method = editing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!json.success) {
        setError(json.error ?? "Failed to save");
        return;
      }

      onSaved();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">
              {editing ? "Edit Placement" : "Record Placement"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Student ID (hidden when editing) */}
          {!editing && (
            <div>
              <Label htmlFor="pf-studentId">Student ID *</Label>
              <Input
                id="pf-studentId"
                value={form.studentId}
                onChange={(e) => update("studentId", e.target.value)}
                placeholder="Paste student ID from Student Directory"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                Find the student ID in the Student Directory page.
              </p>
            </div>
          )}

          {/* Company + Job Title */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pf-company">Company *</Label>
              <Input
                id="pf-company"
                value={form.companyName}
                onChange={(e) => update("companyName", e.target.value)}
                placeholder="Acme Corp"
                required
              />
            </div>
            <div>
              <Label htmlFor="pf-title">Job Title *</Label>
              <Input
                id="pf-title"
                value={form.jobTitle}
                onChange={(e) => update("jobTitle", e.target.value)}
                placeholder="Medical VA"
                required
              />
            </div>
          </div>

          {/* Employment Type */}
          <div>
            <Label htmlFor="pf-type">Employment Type *</Label>
            <div className="relative">
              <select
                id="pf-type"
                value={form.employmentType}
                onChange={(e) => update("employmentType", e.target.value as PlacementType)}
                className="w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-ring"
                required
              >
                {(Object.keys(TYPE_LABELS) as PlacementType[]).map((t) => (
                  <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Rate + Currency + Start Date */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <Label htmlFor="pf-rate">Monthly Rate</Label>
              <Input
                id="pf-rate"
                type="number"
                min="0"
                step="0.01"
                value={form.monthlyRate}
                onChange={(e) => update("monthlyRate", e.target.value)}
                placeholder="800"
              />
            </div>
            <div className="col-span-1">
              <Label htmlFor="pf-currency">Currency</Label>
              <div className="relative">
                <select
                  id="pf-currency"
                  value={form.currency}
                  onChange={(e) => update("currency", e.target.value)}
                  className="w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="USD">USD</option>
                  <option value="PHP">PHP</option>
                  <option value="AUD">AUD</option>
                  <option value="GBP">GBP</option>
                  <option value="CAD">CAD</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div className="col-span-1">
              <Label htmlFor="pf-startDate">Start Date *</Label>
              <Input
                id="pf-startDate"
                type="date"
                value={form.startDate}
                onChange={(e) => update("startDate", e.target.value)}
                required
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="pf-notes">Notes</Label>
            <textarea
              id="pf-notes"
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              rows={3}
              placeholder="Optional — e.g. referred by trainer, part of a batch hire..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {saving ? "Saving…" : editing ? "Save Changes" : "Record Placement"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function PlacementManager() {
  const [listData, setListData] = useState<ListData | null>(null);
  const [stats, setStats] = useState<PlacementStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Placement | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const sp = new URLSearchParams({
        page: String(page),
        limit: "25",
      });
      if (debouncedSearch) sp.set("search", debouncedSearch);

      const [listRes, statsRes] = await Promise.all([
        fetch(`/api/admin/placements?${sp}`),
        fetch("/api/admin/placements?mode=stats"),
      ]);
      const [listJson, statsJson] = await Promise.all([listRes.json(), statsRes.json()]);

      if (listJson.success) setListData(listJson.data as ListData);
      if (statsJson.success) setStats(statsJson.data as PlacementStats);
    } catch {
      setError("Failed to load placement data.");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  async function handleDelete(id: string) {
    if (!confirm("Remove this placement record? This cannot be undone.")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/placements/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        await fetchData();
      } else {
        alert(json.error ?? "Failed to delete");
      }
    } catch {
      alert("Network error");
    } finally {
      setDeleting(null);
    }
  }

  function openNew() {
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(p: Placement) {
    setEditing(p);
    setShowForm(true);
  }

  function handleFormSaved() {
    setShowForm(false);
    setEditing(null);
    void fetchData();
  }

  const totalPages = listData ? Math.ceil(listData.total / listData.limit) : 1;

  return (
    <div className="space-y-6">
      {/* Stats Banner */}
      {stats && <StatsBanner stats={stats} />}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by student, company, or job title…"
            className="pl-9"
          />
        </div>
        <Button onClick={openNew} className="bg-blue-600 hover:bg-blue-700 shrink-0">
          <Plus className="h-4 w-4 mr-2" />
          Record Placement
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : !listData || listData.items.length === 0 ? (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-12 text-center">
          <Briefcase className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No placement records yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Record a student&apos;s placement when they accept a job offer.
          </p>
          <Button onClick={openNew} className="mt-4 bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Record First Placement
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Student</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Company / Role</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Monthly Rate</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Start Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Placed</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {listData.items.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{p.student.name}</div>
                    <div className="text-xs text-gray-400">{p.student.enrollment.course.title}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <span className="font-medium text-gray-800">{p.companyName}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{p.jobTitle}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[p.employmentType]}`}>
                      {TYPE_LABELS[p.employmentType]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {p.monthlyRate ? (
                      <span className="font-medium text-green-700">
                        {p.currency} {Number(p.monthlyRate).toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                      {new Date(p.startDate).toLocaleDateString("en-PH", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(p.placedAt).toLocaleDateString("en-PH", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(p)}
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                        aria-label="Edit placement"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        disabled={deleting === p.id}
                        className="text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                        aria-label="Delete placement"
                      >
                        {deleting === p.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-gray-500">
            {listData?.total ?? 0} total placements
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <span className="flex items-center px-3 text-gray-600">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* By Employment Type Breakdown */}
      {stats && stats.byEmploymentType.length > 0 && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            Placements by Employment Type
          </h3>
          <div className="flex flex-wrap gap-3">
            {stats.byEmploymentType.map((t) => (
              <div key={t.type} className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[t.type]}`}>
                  {TYPE_LABELS[t.type]}
                </span>
                <span className="text-sm font-bold text-gray-700">{t.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form Dialog */}
      {showForm && (
        <PlacementFormDialog
          editing={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={handleFormSaved}
        />
      )}
    </div>
  );
}
