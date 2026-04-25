"use client";

import { useState, useEffect, useCallback } from "react";
import {
  UserPlus,
  Search,
  Pencil,
  Trash2,
  Shield,
  ShieldOff,
  Loader2,
  CheckCircle2,
  XCircle,
  KeyRound,
  Plus,
  Copy,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Eye,
  EyeOff,
} from "lucide-react";
import { MODULE_KEYS, MODULES } from "@/lib/modules";
import type { ModuleKey } from "@/lib/modules";
import {
  PERMISSION_SECTIONS,
  ROLE_TEMPLATES,
  buildPermissionSummary,
  normalizePermissions,
  emptyPermissions,
} from "@/lib/role-permissions";
import type { RolePermissions, SectionKey } from "@/lib/role-permissions";
import { ROLE_CONFIG } from "@/lib/rbac";
import type { UserRole } from "@/lib/rbac";

/* ================================================================== */
/*  Types                                                               */
/* ================================================================== */

interface PortalUser {
  id:                 string;
  name:               string;
  email:              string;
  roleLabel:          string;
  roleId:             string | null;
  permissions:        string[];
  isActive:           boolean;
  mustChangePassword: boolean;
  createdAt:          string;
}

interface TenantRole {
  id:          string;
  name:        string;
  description: string | null;
  permissions: unknown;
  isSystem:    boolean;
  _count:      { users: number };
}

/* ================================================================== */
/*  Add / Edit User Modal                                               */
/* ================================================================== */

interface UserModalProps {
  user?:   PortalUser | null;
  roles:   TenantRole[];
  onClose: () => void;
  onSaved: () => void;
}

function UserModal({ user, roles, onClose, onSaved }: UserModalProps) {
  const isEdit = Boolean(user);

  const [name,        setName]        = useState(user?.name       ?? "");
  const [email,       setEmail]       = useState(user?.email      ?? "");
  const [roleLabel,   setRoleLabel]   = useState(user?.roleLabel  ?? "");
  const [roleId,      setRoleId]      = useState(user?.roleId     ?? "");
  const [permissions, setPermissions] = useState<ModuleKey[]>(
    (user?.permissions ?? []) as ModuleKey[],
  );
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  function handleRoleSelect(id: string) {
    setRoleId(id);
    const role = roles.find((r) => r.id === id);
    if (role) {
      setRoleLabel(role.name);
      const p    = normalizePermissions(role.permissions);
      const mods = (Object.entries(p.modules) as [ModuleKey, boolean][])
        .filter(([, v]) => v)
        .map(([k]) => k);
      setPermissions(mods);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const url    = isEdit ? `/api/admin/portal-users/${user!.id}` : "/api/admin/portal-users";
      const method = isEdit ? "PATCH" : "POST";
      const body   = isEdit
        ? { roleLabel, roleId: roleId || null, permissions }
        : { name: name.trim(), email: email.trim().toLowerCase(), roleLabel, roleId: roleId || null, permissions };

      const res  = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      const json = (await res.json()) as { success: boolean; error?: string };
      if (!json.success) { setError(json.error ?? "Failed to save"); return; }
      onSaved();
      onClose();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? "Edit User" : "Add User"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3">
              <XCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {!isEdit && (
            <>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Juan dela Cruz"
                  required
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@company.com"
                  required
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-xs text-gray-400">A temporary password will be sent automatically.</p>
              </div>
            </>
          )}

          {/* Role */}
          {roles.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Role</label>
              <select
                value={roleId}
                onChange={(e) => handleRoleSelect(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">— Select a role —</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Custom Title</label>
            <input
              value={roleLabel}
              onChange={(e) => setRoleLabel(e.target.value)}
              placeholder="e.g. HR Officer, Accountant"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Module access */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Module Access</label>
            <div className="grid grid-cols-2 gap-2">
              {MODULE_KEYS.map((key) => {
                const checked = permissions.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() =>
                      setPermissions((prev) =>
                        checked ? prev.filter((k) => k !== key) : [...prev, key],
                      )
                    }
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
                      checked
                        ? "bg-indigo-600 border-indigo-600 text-white"
                        : "bg-gray-100 border-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full shrink-0 ${checked ? "bg-white" : "bg-gray-300"}`} />
                    {MODULES[key].label}
                  </button>
                );
              })}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? "Save Changes" : "Create & Send Invite"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Team Tab (CorporateManager RBAC roles)                             */
/* ================================================================== */

interface TeamMember {
  id:                 string;
  name:               string;
  email:              string;
  userRole:           UserRole;
  department:         string | null;
  phone:              string | null;
  isActive:           boolean;
  isTenantAdmin:      boolean;
  mustChangePassword: boolean;
  createdAt:          string;
}

const USER_ROLES: UserRole[] = ["ADMIN", "EXECUTIVE", "MANAGER"];

function AddMemberModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name,       setName]       = useState("");
  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [showPw,     setShowPw]     = useState(false);
  const [userRole,   setUserRole]   = useState<UserRole>("MANAGER");
  const [department, setDepartment] = useState("");
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      const res  = await fetch("/api/admin/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password, userRole, department }),
      });
      const json = await res.json() as { success: boolean; error?: string };
      if (!json.success) { setError(json.error ?? "Failed to create"); return; }
      onSaved(); onClose();
    } catch { setError("Unexpected error"); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Add Team Member</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XCircle className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3">
              <XCircle className="h-4 w-4 shrink-0" />{error}
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Full Name <span className="text-red-500">*</span></label>
            <input value={name} onChange={e => setName(e.target.value)} required placeholder="Juan dela Cruz"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Email <span className="text-red-500">*</span></label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="user@company.com"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Temporary Password <span className="text-red-500">*</span></label>
            <div className="relative">
              <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="Min. 8 characters"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-400">The user will be prompted to change this on first login.</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Role</label>
            <div className="grid grid-cols-3 gap-2">
              {USER_ROLES.map(r => (
                <button key={r} type="button" onClick={() => setUserRole(r)}
                  className={`py-2 rounded-xl text-sm font-medium border transition-colors ${
                    userRole === r
                      ? `${ROLE_CONFIG[r].badgeClass} border-transparent`
                      : "bg-gray-100 border-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}>
                  {ROLE_CONFIG[r].label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400">{ROLE_CONFIG[userRole].description}</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Department</label>
            <input value={department} onChange={e => setDepartment(e.target.value)} placeholder="e.g. Finance, HR"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </form>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={saving}
            className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Add Member
          </button>
        </div>
      </div>
    </div>
  );
}

function EditRoleModal({
  member, onClose, onSaved,
}: { member: TeamMember; onClose: () => void; onSaved: () => void }) {
  const [userRole,   setUserRole]   = useState<UserRole>(member.userRole);
  const [department, setDepartment] = useState(member.department ?? "");
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  async function handleSave() {
    setSaving(true); setError(null);
    try {
      const res  = await fetch(`/api/admin/team/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userRole, department }),
      });
      const json = await res.json() as { success: boolean; error?: string };
      if (!json.success) { setError(json.error ?? "Failed to save"); return; }
      onSaved(); onClose();
    } catch { setError("Unexpected error"); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Edit {member.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XCircle className="h-5 w-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Role</label>
            <div className="grid grid-cols-3 gap-2">
              {USER_ROLES.map(r => (
                <button key={r} type="button" onClick={() => setUserRole(r)}
                  className={`py-2 rounded-xl text-sm font-medium border transition-colors ${
                    userRole === r
                      ? `${ROLE_CONFIG[r].badgeClass} border-transparent`
                      : "bg-gray-100 border-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}>
                  {ROLE_CONFIG[r].label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400">{ROLE_CONFIG[userRole].description}</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Department</label>
            <input value={department} onChange={e => setDepartment(e.target.value)} placeholder="e.g. Finance, HR"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={saving}
            className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 disabled:opacity-50">
            Cancel
          </button>
          <button onClick={() => void handleSave()} disabled={saving}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function TeamTab() {
  const [members,   setMembers]   = useState<TeamMember[]>([]);
  const [total,     setTotal]     = useState(0);
  const [page,      setPage]      = useState(1);
  const [search,    setSearch]    = useState("");
  const [loading,   setLoading]   = useState(true);
  const [showAdd,   setShowAdd]   = useState(false);
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [actionId,  setActionId]  = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const qs  = new URLSearchParams({ page: String(page), ...(search ? { search } : {}) });
      const res  = await fetch(`/api/admin/team?${qs}`);
      const json = await res.json() as { success: boolean; data: { members: TeamMember[]; total: number } };
      if (json.success) { setMembers(json.data.members); setTotal(json.data.total); }
    } finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { void fetchMembers(); }, [fetchMembers]);

  async function toggleActive(m: TeamMember) {
    setActionId(m.id);
    try {
      await fetch(`/api/admin/team/${m.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !m.isActive }),
      });
      void fetchMembers();
    } finally { setActionId(null); }
  }

  async function handleDelete(m: TeamMember) {
    if (!confirm(`Remove "${m.name}" from the team?`)) return;
    setActionId(m.id);
    try {
      await fetch(`/api/admin/team/${m.id}`, { method: "DELETE" });
      void fetchMembers();
    } finally { setActionId(null); }
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="bg-white p-6 rounded-2xl shadow space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Admin Team</h2>
          <p className="text-sm text-gray-400">Manage who has access to this portal and their permission level.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              className="pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-52"
              placeholder="Search name or email…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors">
            <UserPlus className="h-4 w-4" /> Add Member
          </button>
        </div>
      </div>

      {/* Role legend */}
      <div className="flex flex-wrap gap-2">
        {USER_ROLES.map(r => (
          <span key={r} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${ROLE_CONFIG[r].badgeClass}`}>
            {ROLE_CONFIG[r].label}
            <span className="opacity-75">— {ROLE_CONFIG[r].description}</span>
          </span>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-100">
              <th className="pb-3 font-medium">Member</th>
              <th className="pb-3 font-medium">Role</th>
              <th className="pb-3 font-medium">Department</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-12">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-300" />
              </td></tr>
            ) : members.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-gray-400">
                <UserPlus className="h-8 w-8 mx-auto mb-2 text-gray-200" />
                <p className="font-medium text-gray-500">No team members yet</p>
              </td></tr>
            ) : members.map(m => (
              <tr key={m.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-xs shrink-0">
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 flex items-center gap-1.5">
                        {m.name}
                        {m.isTenantAdmin && (
                          <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-semibold">Owner</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400">{m.email}</p>
                      {m.mustChangePassword && (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                          <KeyRound className="h-3 w-3" />Must change password
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${ROLE_CONFIG[m.userRole].badgeClass}`}>
                    {ROLE_CONFIG[m.userRole].label}
                  </span>
                </td>
                <td className="py-3 text-gray-500">{m.department ?? "—"}</td>
                <td className="py-3">
                  {m.isActive ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                      <CheckCircle2 className="h-3 w-3" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                      <XCircle className="h-3 w-3" /> Inactive
                    </span>
                  )}
                </td>
                <td className="py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => setEditMember(m)} disabled={actionId === m.id}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors" title="Edit role">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => void toggleActive(m)} disabled={actionId === m.id}
                      className={`p-1.5 rounded-lg transition-colors ${m.isActive ? "text-gray-400 hover:text-amber-600 hover:bg-amber-50" : "text-gray-400 hover:text-emerald-600 hover:bg-emerald-50"}`}
                      title={m.isActive ? "Deactivate" : "Activate"}>
                      {actionId === m.id ? <Loader2 className="h-4 w-4 animate-spin" /> : m.isActive ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                    </button>
                    {!m.isTenantAdmin && (
                      <button onClick={() => void handleDelete(m)} disabled={actionId === m.id}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Remove">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {total > 20 && (
        <div className="flex items-center justify-between text-sm text-gray-500 pt-2 border-t border-gray-100">
          <span>Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}</span>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              className="p-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-40 transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span>{page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
              className="p-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-40 transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {showAdd && <AddMemberModal onClose={() => setShowAdd(false)} onSaved={() => void fetchMembers()} />}
      {editMember && <EditRoleModal member={editMember} onClose={() => setEditMember(null)} onSaved={() => void fetchMembers()} />}
    </div>
  );
}

/* ================================================================== */
/*  Users Tab                                                           */
/* ================================================================== */

const PAGE_LIMIT = 15;

function UsersTab({ roles }: { roles: TenantRole[] }) {
  const [users,   setUsers]   = useState<PortalUser[]>([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [search,  setSearch]  = useState("");
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editUser,  setEditUser]  = useState<PortalUser | null>(null);
  const [actionId,  setActionId]  = useState<string | null>(null);

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
      if (json.success) { setUsers(json.data.users); setTotal(json.data.total); }
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { void fetchUsers(); }, [fetchUsers]);

  async function toggleActive(user: PortalUser) {
    setActionId(user.id);
    try {
      const res  = await fetch(`/api/admin/portal-users/${user.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ isActive: !user.isActive }),
      });
      if ((await res.json() as { success: boolean }).success) void fetchUsers();
    } finally { setActionId(null); }
  }

  async function handleDelete(user: PortalUser) {
    if (!confirm(`Remove "${user.name}" from portal access?`)) return;
    setActionId(user.id);
    try {
      const res  = await fetch(`/api/admin/portal-users/${user.id}`, { method: "DELETE" });
      if ((await res.json() as { success: boolean }).success) void fetchUsers();
    } finally { setActionId(null); }
  }

  const totalPages = Math.ceil(total / PAGE_LIMIT);

  return (
    <div className="bg-white p-6 rounded-2xl shadow space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-gray-900">Users</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              className="pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-56"
              placeholder="Search name or email…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <button
            onClick={() => { setEditUser(null); setShowModal(true); }}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            Add User
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-100">
              <th className="pb-3 font-medium">Name</th>
              <th className="pb-3 font-medium">Email</th>
              <th className="pb-3 font-medium">Role</th>
              <th className="pb-3 font-medium">Modules</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-300" />
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400">
                  <UserPlus className="h-8 w-8 mx-auto mb-2 text-gray-200" />
                  <p className="font-medium text-gray-500">No users yet</p>
                  <p className="text-xs mt-1">Add a user to grant workspace access.</p>
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-xs shrink-0">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        {user.mustChangePassword && (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                            <KeyRound className="h-3 w-3" />Password change required
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-gray-600">{user.email}</td>
                  <td className="py-3">
                    <span className="inline-block bg-indigo-50 text-indigo-700 text-xs font-medium px-2.5 py-1 rounded-full">
                      {user.roleLabel || "User"}
                    </span>
                  </td>
                  <td className="py-3">
                    {user.permissions.length === 0 ? (
                      <span className="text-gray-400 text-xs italic">None</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {user.permissions.map((p) => (
                          <span key={p} className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                            {MODULES[p as ModuleKey]?.label ?? p}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="py-3">
                    {user.isActive ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                        <CheckCircle2 className="h-3 w-3" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                        <XCircle className="h-3 w-3" /> Inactive
                      </span>
                    )}
                  </td>
                  <td className="py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => { setEditUser(user); setShowModal(true); }}
                        disabled={actionId === user.id}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => void toggleActive(user)}
                        disabled={actionId === user.id}
                        className={`p-1.5 rounded-lg transition-colors ${
                          user.isActive
                            ? "text-gray-400 hover:text-amber-600 hover:bg-amber-50"
                            : "text-gray-400 hover:text-emerald-600 hover:bg-emerald-50"
                        }`}
                        title={user.isActive ? "Deactivate" : "Activate"}
                      >
                        {actionId === user.id
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : user.isActive
                            ? <ShieldOff className="h-4 w-4" />
                            : <Shield className="h-4 w-4" />
                        }
                      </button>
                      <button
                        onClick={() => void handleDelete(user)}
                        disabled={actionId === user.id}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
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
        <div className="flex items-center justify-between text-sm text-gray-500 pt-2 border-t border-gray-100">
          <span>
            Showing {(page - 1) * PAGE_LIMIT + 1}–{Math.min(page * PAGE_LIMIT, total)} of {total}
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="p-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-1">{page} / {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <UserModal
          user={editUser}
          roles={roles}
          onClose={() => { setShowModal(false); setEditUser(null); }}
          onSaved={() => void fetchUsers()}
        />
      )}
    </div>
  );
}

/* ================================================================== */
/*  Roles & Permissions Tab                                             */
/* ================================================================== */

function RolesTab() {
  const [roles,        setRoles]        = useState<TenantRole[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [selectedId,   setSelectedId]   = useState<string | null>(null);

  /* Right-panel state */
  const [roleName,    setRoleName]    = useState("");
  const [roleDesc,    setRoleDesc]    = useState("");
  const [permissions, setPermissions] = useState<RolePermissions>(emptyPermissions());
  const [saving,      setSaving]      = useState(false);
  const [saveOk,      setSaveOk]      = useState(false);
  const [saveErr,     setSaveErr]     = useState<string | null>(null);
  const [deleteErr,   setDeleteErr]   = useState<string | null>(null);

  /* New role inline form */
  const [showNew,     setShowNew]     = useState(false);
  const [newName,     setNewName]     = useState("");
  const [newErr,      setNewErr]      = useState<string | null>(null);
  const [creating,    setCreating]    = useState(false);

  /* Template picker */
  const [showTpl,     setShowTpl]     = useState(false);

  /* ── Fetch ─────────────────────────────────────────────────────── */
  const fetchRoles = useCallback(async () => {
    setLoadingRoles(true);
    try {
      const res  = await fetch("/api/admin/roles");
      const json = (await res.json()) as { success: boolean; data: { roles: TenantRole[] } };
      if (json.success) {
        setRoles(json.data.roles);
        if (!selectedId && json.data.roles.length > 0) loadRole(json.data.roles[0]);
      }
    } finally {
      setLoadingRoles(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { void fetchRoles(); }, [fetchRoles]);

  function loadRole(role: TenantRole) {
    setSelectedId(role.id);
    setRoleName(role.name);
    setRoleDesc(role.description ?? "");
    setPermissions(normalizePermissions(role.permissions));
    setSaveErr(null);
    setSaveOk(false);
    setDeleteErr(null);
  }

  /* ── Toggle helpers ─────────────────────────────────────────────── */
  function toggleAction(sectionKey: SectionKey, actionKey: string) {
    const current = permissions.sections[sectionKey] as unknown as Record<string, boolean>;
    setPermissions((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        [sectionKey]: {
          ...current,
          [actionKey]: !current[actionKey],
        },
      },
    }));
  }

  function toggleAllSection(sectionKey: SectionKey) {
    const section    = PERMISSION_SECTIONS.find((s) => s.key === sectionKey);
    if (!section) return;
    const current    = permissions.sections[sectionKey] as unknown as Record<string, boolean>;
    const allEnabled = section.actions.every((a) => current[a.key]);
    const allActions = Object.fromEntries(section.actions.map((a) => [a.key, !allEnabled]));
    setPermissions((prev) => ({
      ...prev,
      sections: { ...prev.sections, [sectionKey]: allActions },
    }));
  }

  function toggleModule(key: ModuleKey) {
    setPermissions((prev) => ({
      ...prev,
      modules: { ...prev.modules, [key]: !prev.modules[key] },
    }));
  }

  /* ── Save ───────────────────────────────────────────────────────── */
  async function handleSave() {
    if (!selectedId) return;
    setSaving(true);
    setSaveErr(null);
    setSaveOk(false);
    try {
      const res  = await fetch(`/api/admin/roles/${selectedId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name: roleName, description: roleDesc, permissions }),
      });
      const json = (await res.json()) as { success: boolean; error?: string };
      if (!json.success) { setSaveErr(json.error ?? "Failed to save"); return; }
      setRoles((prev) =>
        prev.map((r) => r.id === selectedId ? { ...r, name: roleName, description: roleDesc } : r),
      );
      setSaveOk(true);
      setTimeout(() => setSaveOk(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  /* ── Delete ─────────────────────────────────────────────────────── */
  async function handleDelete() {
    const role = roles.find((r) => r.id === selectedId);
    if (!role) return;
    if (role._count.users > 0) {
      setDeleteErr(`${role._count.users} user(s) have this role. Reassign them first.`);
      return;
    }
    if (!confirm(`Delete "${role.name}"? This cannot be undone.`)) return;
    const res  = await fetch(`/api/admin/roles/${selectedId}`, { method: "DELETE" });
    const json = (await res.json()) as { success: boolean; error?: string };
    if (!json.success) { setDeleteErr(json.error ?? "Cannot delete"); return; }
    const rest = roles.filter((r) => r.id !== selectedId);
    setRoles(rest);
    if (rest.length > 0) loadRole(rest[0]);
    else { setSelectedId(null); setRoleName(""); setRoleDesc(""); setPermissions(emptyPermissions()); }
  }

  /* ── Duplicate ──────────────────────────────────────────────────── */
  async function handleDuplicate() {
    if (!selectedId) return;
    const res  = await fetch(`/api/admin/roles/${selectedId}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ action: "duplicate" }),
    });
    const json = (await res.json()) as { success: boolean; data?: { role: TenantRole } };
    if (json.success && json.data?.role) {
      const r = json.data.role;
      setRoles((prev) => [...prev, r]);
      loadRole(r);
    }
  }

  /* ── Create role ────────────────────────────────────────────────── */
  async function handleCreate() {
    if (!newName.trim()) { setNewErr("Name is required"); return; }
    setCreating(true);
    setNewErr(null);
    try {
      const res  = await fetch("/api/admin/roles", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name: newName.trim() }),
      });
      const json = (await res.json()) as { success: boolean; error?: string; data?: { role: TenantRole } };
      if (!json.success) { setNewErr(json.error ?? "Failed"); return; }
      const r = json.data!.role;
      setRoles((prev) => [...prev, r]);
      loadRole(r);
      setShowNew(false);
      setNewName("");
    } finally {
      setCreating(false);
    }
  }

  /* ── Apply template ─────────────────────────────────────────────── */
  async function applyTemplate(i: number) {
    const tpl = ROLE_TEMPLATES[i];
    if (!tpl) return;
    setCreating(true);
    try {
      const res  = await fetch("/api/admin/roles", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name: tpl.name, description: tpl.description, permissions: tpl.permissions }),
      });
      const json = (await res.json()) as { success: boolean; data?: { role: TenantRole } };
      if (json.success && json.data?.role) {
        const r = json.data.role;
        setRoles((prev) => [...prev, r]);
        loadRole(r);
        setShowTpl(false);
      }
    } finally {
      setCreating(false);
    }
  }

  const selectedRole = roles.find((r) => r.id === selectedId);
  const isSystem     = selectedRole?.isSystem ?? false;
  const summary      = buildPermissionSummary(permissions);

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* ── LEFT PANEL ─────────────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-2xl shadow space-y-3">
        {/* Create */}
        <button
          onClick={() => { setShowNew(true); setShowTpl(false); }}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Role
        </button>

        {/* Template link */}
        <button
          onClick={() => { setShowTpl((v) => !v); setShowNew(false); }}
          className="w-full text-xs text-indigo-600 hover:text-indigo-800 text-center py-1 transition-colors"
        >
          ✨ Use a template
        </button>

        {/* Template picker */}
        {showTpl && (
          <div className="bg-indigo-50 rounded-xl p-3 space-y-1.5 border border-indigo-100">
            {ROLE_TEMPLATES.map((tpl, i) => (
              <button
                key={tpl.name}
                onClick={() => void applyTemplate(i)}
                disabled={creating}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-indigo-800 hover:bg-indigo-100 transition-colors disabled:opacity-50"
              >
                <p className="font-medium">{tpl.name}</p>
                <p className="text-xs text-indigo-500 mt-0.5">{tpl.description}</p>
              </button>
            ))}
          </div>
        )}

        {/* Inline new-role form */}
        {showNew && (
          <div className="bg-gray-50 rounded-xl p-3 space-y-2 border border-gray-200">
            <input
              autoFocus
              placeholder="Role name…"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void handleCreate(); }}
              className="w-full rounded-xl border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {newErr && <p className="text-xs text-red-600">{newErr}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => void handleCreate()}
                disabled={creating}
                className="flex-1 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
              >
                {creating ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                Add
              </button>
              <button
                onClick={() => { setShowNew(false); setNewName(""); }}
                className="flex-1 py-1.5 rounded-xl bg-gray-200 text-gray-700 text-xs font-medium hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Role list */}
        <div className="space-y-1 pt-1">
          {loadingRoles ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
            </div>
          ) : roles.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">No roles yet</p>
          ) : (
            roles.map((role) => (
              <div
                key={role.id}
                onClick={() => loadRole(role)}
                className={`p-3 rounded-xl cursor-pointer transition-colors ${
                  selectedId === role.id
                    ? "bg-indigo-100 text-indigo-900"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                <p className="text-sm font-medium">{role.name}</p>
                <p className={`text-xs mt-0.5 ${selectedId === role.id ? "text-indigo-500" : "text-gray-400"}`}>
                  {role._count.users} user{role._count.users !== 1 ? "s" : ""}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL ─────────────────────────────────────────────── */}
      {selectedId && selectedRole ? (
        <div className="col-span-2 bg-white p-6 rounded-2xl shadow space-y-6">
          {/* Role header */}
          <div className="space-y-3">
            <div>
              <input
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                disabled={isSystem}
                className="text-xl font-semibold text-gray-900 w-full border-0 border-b-2 border-transparent focus:border-indigo-500 focus:outline-none bg-transparent pb-1 transition-colors disabled:opacity-60"
              />
              <input
                value={roleDesc}
                onChange={(e) => setRoleDesc(e.target.value)}
                placeholder="Add a description…"
                disabled={isSystem}
                className="text-sm text-gray-500 w-full border-0 focus:outline-none bg-transparent mt-1 disabled:opacity-60"
              />
            </div>

            {/* Permission summary */}
            <div className="bg-indigo-50 rounded-xl px-4 py-3 text-xs text-indigo-700 border border-indigo-100">
              {summary}
            </div>

            {isSystem && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5 text-xs text-amber-700">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                System roles cannot be modified.
              </div>
            )}
          </div>

          {/* ── Module access ─────────────────────────────────────── */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Module Access
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {MODULE_KEYS.map((key) => {
                const enabled = permissions.modules[key] ?? false;
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={isSystem}
                    onClick={() => toggleModule(key)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium border transition-colors disabled:opacity-50 ${
                      enabled
                        ? "bg-indigo-600 border-indigo-600 text-white"
                        : "bg-gray-100 border-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {MODULES[key].label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Section permissions ───────────────────────────────── */}
          <div className="space-y-4">
            {PERMISSION_SECTIONS.map((section) => {
              const current    = permissions.sections[section.key] as unknown as Record<string, boolean>;
              const allEnabled = section.actions.every((a) => current[a.key]);
              return (
                <div key={section.key}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-sm text-gray-800">{section.label}</h3>
                    <button
                      type="button"
                      disabled={isSystem}
                      onClick={() => toggleAllSection(section.key)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 disabled:opacity-50 transition-colors"
                    >
                      {allEnabled ? "Disable All" : "Enable All"}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {section.actions.map((action) => {
                      const active = current[action.key] === true;
                      return (
                        <button
                          key={action.key}
                          type="button"
                          disabled={isSystem}
                          onClick={() => toggleAction(section.key, action.key)}
                          className={`px-3 py-1 rounded-full text-sm border transition-colors disabled:opacity-50 ${
                            active
                              ? "bg-indigo-600 text-white border-indigo-600"
                              : "bg-gray-100 text-gray-600 border-gray-100 hover:bg-gray-200"
                          }`}
                        >
                          {action.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Actions ───────────────────────────────────────────── */}
          {!isSystem && (
            <div className="space-y-3 pt-2 border-t border-gray-100">
              {deleteErr && (
                <p className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-xl">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  {deleteErr}
                </p>
              )}
              {saveErr && (
                <p className="text-xs text-red-600 flex items-center gap-1.5">
                  <XCircle className="h-3.5 w-3.5" /> {saveErr}
                </p>
              )}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => void handleDuplicate()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  <Copy className="h-3.5 w-3.5" /> Duplicate
                </button>
                <button
                  onClick={() => void handleDelete()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-100 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
                <button
                  onClick={() => void handleSave()}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors min-w-[120px] justify-center"
                >
                  {saving
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : saveOk
                      ? <CheckCircle2 className="h-4 w-4" />
                      : null}
                  {saving ? "Saving…" : saveOk ? "Saved!" : "Save Changes"}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="col-span-2 bg-white rounded-2xl shadow flex flex-col items-center justify-center text-center py-16 text-gray-400">
          <Shield className="h-12 w-12 mb-3 text-gray-200" />
          <p className="font-medium text-gray-500">Select or create a role</p>
          <p className="text-sm mt-1">Configure module access and permissions.</p>
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  Page Root                                                           */
/* ================================================================== */

export default function UsersRolesPage() {
  const [activeTab, setActiveTab] = useState<"team" | "users" | "roles">("team");
  const [roles,     setRoles]     = useState<TenantRole[]>([]);

  useEffect(() => {
    fetch("/api/admin/roles")
      .then((r) => r.json())
      .then((d: { success: boolean; data?: { roles: TenantRole[] } }) => {
        if (d.success && d.data) setRoles(d.data.roles);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Users &amp; Roles</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Manage your admin team, portal users, and permission roles
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-3">
        {(["team", "users", "roles"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab === "team" ? "Admin Team" : tab === "users" ? "Portal Users" : "Roles & Permissions"}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "team"  && <TeamTab />}
      {activeTab === "users" && <UsersTab roles={roles} />}
      {activeTab === "roles" && <RolesTab />}
    </div>
  );
}
