"use client";

import { useState, useEffect, useCallback } from "react";
import {
  UserPlus,
  Search,
  Shield,
  ShieldOff,
  Pencil,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  KeyRound,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MODULE_KEYS, MODULES } from "@/lib/modules";
import type { ModuleKey } from "@/lib/modules";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface PortalUser {
  id:                 string;
  name:               string;
  email:              string;
  roleLabel:          string;
  permissions:        string[];
  isActive:           boolean;
  mustChangePassword: boolean;
  createdAt:          string;
}

/* ------------------------------------------------------------------ */
/*  Module permission checkbox list                                     */
/* ------------------------------------------------------------------ */

function ModulePermissions({
  selected,
  onChange,
}: {
  selected: ModuleKey[];
  onChange: (keys: ModuleKey[]) => void;
}) {
  function toggle(key: ModuleKey) {
    if (selected.includes(key)) {
      onChange(selected.filter((k) => k !== key));
    } else {
      onChange([...selected, key]);
    }
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {MODULE_KEYS.map((key) => {
        const mod     = MODULES[key];
        const checked = selected.includes(key);
        return (
          <label
            key={key}
            className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer select-none transition-colors text-sm ${
              checked
                ? "border-blue-500 bg-blue-50 text-blue-800"
                : "border-gray-200 hover:border-gray-300 text-gray-700"
            }`}
          >
            <input
              type="checkbox"
              className="sr-only"
              checked={checked}
              onChange={() => toggle(key)}
            />
            <span
              className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${
                checked ? "bg-blue-600 border-blue-600" : "border-gray-300 bg-white"
              }`}
            >
              {checked && (
                <svg
                  className="h-2.5 w-2.5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </span>
            {mod.label}
          </label>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Add / Edit Modal                                                    */
/* ------------------------------------------------------------------ */

interface UserModalProps {
  user?:   PortalUser | null;
  onClose: () => void;
  onSaved: () => void;
}

function UserModal({ user, onClose, onSaved }: UserModalProps) {
  const isEdit = Boolean(user);

  const [name,        setName]        = useState(user?.name      ?? "");
  const [email,       setEmail]       = useState(user?.email     ?? "");
  const [roleLabel,   setRoleLabel]   = useState(user?.roleLabel ?? "");
  const [permissions, setPermissions] = useState<ModuleKey[]>(
    (user?.permissions ?? []) as ModuleKey[],
  );
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const url    = isEdit ? `/api/admin/portal-users/${user!.id}` : "/api/admin/portal-users";
      const method = isEdit ? "PATCH" : "POST";

      const body = isEdit
        ? { roleLabel, permissions }
        : {
            name:        name.trim(),
            email:       email.trim().toLowerCase(),
            roleLabel,
            permissions,
          };

      const res  = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as { success: boolean; error?: string };

      if (!json.success) {
        setError(json.error ?? "Failed to save user");
        return;
      }

      onSaved();
      onClose();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? "Edit Portal User" : "Add Portal User"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
              <XCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {!isEdit && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="u-name">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="u-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Juan dela Cruz"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="u-email">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="u-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@company.com"
                  required
                />
                <p className="text-xs text-gray-500">
                  A temporary password will be sent to this address automatically.
                </p>
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="u-role">Role / Title</Label>
            <Input
              id="u-role"
              value={roleLabel}
              onChange={(e) => setRoleLabel(e.target.value)}
              placeholder="e.g. Accountant, HR Officer, IT Staff"
            />
          </div>

          <div className="space-y-2">
            <Label>Module Access</Label>
            <p className="text-xs text-gray-500">
              Select which modules this user can view and use.
            </p>
            <ModulePermissions selected={permissions} onChange={setPermissions} />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 shrink-0">
          <Button variant="outline" type="button" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? "Save Changes" : "Create & Send Invite"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

const PAGE_LIMIT = 15;

export default function PortalUsersPage() {
  const [users,   setUsers]   = useState<PortalUser[]>([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [search,  setSearch]  = useState("");
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editUser,  setEditUser]  = useState<PortalUser | null>(null);
  const [actionId,  setActionId]  = useState<string | null>(null);

  /* ── Fetch ───────────────────────────────────────────────────────── */
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const qs  = new URLSearchParams({
        page:  String(page),
        limit: String(PAGE_LIMIT),
        ...(search ? { search } : {}),
      });
      const res  = await fetch(`/api/admin/portal-users?${qs}`);
      const json = (await res.json()) as {
        success: boolean;
        data:    { users: PortalUser[]; total: number };
      };
      if (json.success) {
        setUsers(json.data.users);
        setTotal(json.data.total);
      }
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  /* ── Toggle active ───────────────────────────────────────────────── */
  async function toggleActive(user: PortalUser) {
    setActionId(user.id);
    try {
      const res  = await fetch(`/api/admin/portal-users/${user.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ isActive: !user.isActive }),
      });
      const json = (await res.json()) as { success: boolean };
      if (json.success) void fetchUsers();
    } finally {
      setActionId(null);
    }
  }

  /* ── Delete ──────────────────────────────────────────────────────── */
  async function handleDelete(user: PortalUser) {
    if (!confirm(`Remove "${user.name}" from portal access? This cannot be undone.`)) return;
    setActionId(user.id);
    try {
      const res  = await fetch(`/api/admin/portal-users/${user.id}`, { method: "DELETE" });
      const json = (await res.json()) as { success: boolean };
      if (json.success) void fetchUsers();
    } finally {
      setActionId(null);
    }
  }

  const totalPages = Math.ceil(total / PAGE_LIMIT);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Portal Users</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Grant team members access to specific modules in your workspace.
          </p>
        </div>
        <Button
          className="gap-2 shrink-0"
          onClick={() => {
            setEditUser(null);
            setShowModal(true);
          }}
        >
          <UserPlus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <Input
          className="pl-9"
          placeholder="Search name or email…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 w-[220px]">Name</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-600">Email</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-600">Role</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-600">Module Access</th>
                <th className="text-center px-4 py-3.5 font-semibold text-gray-600 w-24">Status</th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-600 w-28">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-gray-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-gray-500">
                    <UserPlus className="h-8 w-8 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">No portal users yet</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Add a user to give them workspace access.
                    </p>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                  >
                    {/* Name */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-xs shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          {user.mustChangePassword && (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-600 mt-0.5">
                              <KeyRound className="h-3 w-3" />
                              Password change required
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3.5 text-gray-600">{user.email}</td>

                    {/* Role */}
                    <td className="px-4 py-3.5">
                      <span className="inline-block bg-blue-50 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full border border-blue-100">
                        {user.roleLabel || "User"}
                      </span>
                    </td>

                    {/* Modules */}
                    <td className="px-4 py-3.5">
                      {user.permissions.length === 0 ? (
                        <span className="text-gray-400 text-xs italic">No modules</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {user.permissions.map((p) => (
                            <span
                              key={p}
                              className="inline-block bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded"
                            >
                              {MODULES[p as ModuleKey]?.label ?? p}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5 text-center">
                      {user.isActive ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="h-3 w-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">
                          <XCircle className="h-3 w-3" /> Inactive
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setEditUser(user);
                            setShowModal(true);
                          }}
                          disabled={actionId === user.id}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => void toggleActive(user)}
                          disabled={actionId === user.id}
                          className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                            user.isActive
                              ? "text-gray-400 hover:text-amber-600 hover:bg-amber-50"
                              : "text-gray-400 hover:text-emerald-600 hover:bg-emerald-50"
                          }`}
                          title={user.isActive ? "Deactivate" : "Activate"}
                        >
                          {actionId === user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : user.isActive ? (
                            <ShieldOff className="h-4 w-4" />
                          ) : (
                            <Shield className="h-4 w-4" />
                          )}
                        </button>

                        <button
                          onClick={() => void handleDelete(user)}
                          disabled={actionId === user.id}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                          title="Remove"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > PAGE_LIMIT && (
          <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
            <span>
              Showing {(page - 1) * PAGE_LIMIT + 1}–{Math.min(page * PAGE_LIMIT, total)} of {total}
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-2">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <UserModal
          user={editUser}
          onClose={() => {
            setShowModal(false);
            setEditUser(null);
          }}
          onSaved={() => void fetchUsers()}
        />
      )}
    </div>
  );
}
