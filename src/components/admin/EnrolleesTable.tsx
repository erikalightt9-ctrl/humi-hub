"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusDropdown } from "./StatusDropdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ExternalLink,
  Pencil,
  Trash2,
  X,
  Save,
  Loader2,
} from "lucide-react";
import type { EnrollmentWithCourse } from "@/lib/repositories/enrollment.repository";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface EnrolleesTableProps {
  readonly enrollments: ReadonlyArray<EnrollmentWithCourse>;
}

interface EditFormState {
  readonly fullName: string;
  readonly email: string;
  readonly contactNumber: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function EnrolleesTable({ enrollments }: EnrolleesTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>({
    fullName: "",
    email: "",
    contactNumber: "",
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function startEdit(enrollment: EnrollmentWithCourse) {
    setEditingId(enrollment.id);
    setEditForm({
      fullName: enrollment.fullName,
      email: enrollment.email,
      contactNumber: enrollment.contactNumber,
    });
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setError(null);
  }

  async function saveEdit() {
    if (!editingId) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/enrollments/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Failed to update");
        return;
      }

      setEditingId(null);
      startTransition(() => router.refresh());
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete application from "${name}"? This cannot be undone.`)) {
      return;
    }

    setDeleting(id);
    setError(null);

    try {
      const res = await fetch(`/api/admin/enrollments/${id}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Failed to delete");
        return;
      }

      startTransition(() => router.refresh());
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setDeleting(null);
    }
  }

  if (enrollments.length === 0) {
    return (
      <div className="text-center py-16 text-ds-muted">
        <p className="text-lg font-medium">No enrollments found</p>
        <p className="text-sm mt-1">Try adjusting your filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
          {error}
          <button
            type="button"
            className="ml-2 text-red-500 hover:text-red-800"
            onClick={() => setError(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* Inline edit form */}
      {editingId && (
        <div className="bg-ds-surface border border-ds-primary/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-ds-text">
              Edit Application
            </h3>
            <Button variant="ghost" size="sm" onClick={cancelEdit}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label htmlFor="edit-name" className="text-xs">
                Full Name
              </Label>
              <Input
                id="edit-name"
                value={editForm.fullName}
                onChange={(e) =>
                  setEditForm({ ...editForm, fullName: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="edit-email" className="text-xs">
                Email
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) =>
                  setEditForm({ ...editForm, email: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="edit-phone" className="text-xs">
                Contact Number
              </Label>
              <Input
                id="edit-phone"
                value={editForm.contactNumber}
                onChange={(e) =>
                  setEditForm({ ...editForm, contactNumber: e.target.value })
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={cancelEdit}
              disabled={saving || isPending}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={saveEdit}
              disabled={saving || isPending}
              className="gap-1"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-ds-border overflow-hidden">
        <Table>
          <TableHeader className="bg-ds-surface border-b border-ds-border">
            <TableRow>
              <TableHead className="w-[200px] text-ds-muted">Name</TableHead>
              <TableHead className="text-ds-muted">Email</TableHead>
              <TableHead className="text-ds-muted">Course</TableHead>
              <TableHead className="text-ds-muted">Status</TableHead>
              <TableHead className="text-ds-muted">Applied</TableHead>
              <TableHead className="w-[120px] text-right text-ds-muted">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enrollments.map((e) => {
              const isDeleting = deleting === e.id;
              const isEnrolled = e.status === "ENROLLED";

              return (
                <TableRow
                  key={e.id}
                  className={`hover:bg-ds-surface/50 ${isDeleting ? "opacity-50" : ""}`}
                >
                  <TableCell className="font-medium text-ds-text">
                    {e.fullName}
                  </TableCell>
                  <TableCell className="text-ds-muted text-sm">
                    {e.email}
                  </TableCell>
                  <TableCell className="text-ds-muted text-sm">
                    {e.course.title}
                  </TableCell>
                  <TableCell>
                    <StatusDropdown
                      enrollmentId={e.id}
                      currentStatus={e.status}
                    />
                  </TableCell>
                  <TableCell className="text-ds-muted text-sm">
                    {new Date(e.createdAt).toLocaleDateString("en-PH", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      {!isEnrolled && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(e)}
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(e.id, e.fullName)}
                        disabled={isDeleting}
                        className="text-red-500 hover:text-red-700"
                        title="Delete"
                      >
                        {isDeleting ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        title="View Details"
                      >
                        <Link href={`/admin/enrollees/${e.id}`}>
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
