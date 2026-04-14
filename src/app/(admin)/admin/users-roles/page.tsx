"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  ShieldCheck,
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
  Sparkles,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
/*  Toggle Pill component                                               */
/* ================================================================== */

function TogglePill({
  label,
  enabled,
  onChange,
  critical,
}: {
  label:    string;
  enabled:  boolean;
  onChange: (v: boolean) => void;
  critical?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 select-none border ${
        enabled
          ? critical
            ? "bg-red-100 border-red-300 text-red-700 hover:bg-red-200"
            : "bg-indigo-100 border-indigo-300 text-indigo-700 hover:bg-indigo-200"
          : "bg-gray-100 border-gray-200 text-gray-400 hover:bg-gray-200 hover:text-gray-500"
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full shrink-0 ${
          enabled
            ? critical ? "bg-red-500" : "bg-indigo-500"
            : "bg-gray-300"
        }`}
      />
      {label}
    </button>
  );
}

/* ================================================================== */
/*  Permission Matrix                                                   */
/* ================================================================== */

function PermissionMatrix({
  permissions,
  onChange,
}: {
  permissions: RolePermissions;
  onChange:    (p: RolePermissions) => void;
}) {
  function toggleSection(sectionKey: SectionKey, actionKey: string, value: boolean) {
    const updated: RolePermissions = {
      ...permissions,
      sections: {
        ...permissions.sections,
        [sectionKey]: {
          ...(permissions.sections[sectionKey] as Record<string, boolean>),
          [actionKey]: value,
        },
      },
    };
    onChange(updated);
  }

  function toggleAllSection(sectionKey: SectionKey, enableAll: boolean) {
    const section = PERMISSION_SECTIONS.find((s) => s.key === sectionKey);
    if (!section) return;
    const allActions = Object.fromEntries(section.actions.map((a) => [a.key, enableAll]));
    const updated: RolePermissions = {
      ...permissions,
      sections: {
        ...permissions.sections,
        [sectionKey]: allActions,
      },
    };
    onChange(updated);
  }

  function isSectionAllEnabled(sectionKey: SectionKey): boolean {
    const section = PERMISSION_SECTIONS.find((s) => s.key === sectionKey);
    if (!section) return false;
    const current = permissions.sections[sectionKey] as Record<string, boolean>;
    return section.actions.every((a) => current[a.key] === true);
  }

  function toggleModule(key: ModuleKey, value: boolean) {
    onChange({
      ...permissions,
      modules: { ...permissions.modules, [key]: value },
    });
  }

  return (
    <div className="space-y-6">
      {/* Module Access */}
      <div>
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Module Access
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {MODULE_KEYS.map((key) => {
            const mod     = MODULES[key];
            const enabled = permissions.modules[key] ?? false;
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleModule(key, !enabled)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all duration-150 ${
                  enabled
                    ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                    : "bg-white border-gray-200 text-gray-400 hover:border-gray-300"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full shrink-0 ${enabled ? "bg-indigo-500" : "bg-gray-300"}`}
                />
                {mod.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-gray-100" />

      {/* Section Permissions */}
      <div>
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Feature Permissions
        </h4>
        <div className="space-y-4">
          {PERMISSION_SECTIONS.map((section) => {
            const current     = permissions.sections[section.key] as Record<string, boolean>;
            const allEnabled  = isSectionAllEnabled(section.key);
            const isCritical  = section.key === "settings";

            return (
              <div key={section.key} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-700">{section.label}</span>
                  <button
                    type="button"
                    onClick={() => toggleAllSection(section.key, !allEnabled)}
                    className={`text-xs font-medium px-2 py-0.5 rounded-lg transition-colors ${
                      allEnabled
                        ? "text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100"
                        : "text-gray-500 hover:text-gray-700 bg-white border border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {allEnabled ? "Disable All" : "Enable All"}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {section.actions.map((action) => (
                    <TogglePill
                      key={action.key}
                      label={action.label}
                      enabled={current[action.key] === true}
                      onChange={(v) => toggleSection(section.key, action.key, v)}
                      critical={isCritical}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Roles Tab                                                           */
/* ================================================================== */

function RolesTab() {
  const [roles,         setRoles]         = useState<TenantRole[]>([]);
  const [loadingRoles,  setLoadingRoles]  = useState(true);
  const [selectedId,    setSelectedId]    = useState<string | null>(null);

  // Right-panel state
  const [roleName,      setRoleName]      = useState("");
  const [roleDesc,      setRoleDesc]      = useState("");
  const [permissions,   setPermissions]   = useState<RolePermissions>(emptyPermissions());
  const [saving,        setSaving]        = useState(false);
  const [saveError,     setSaveError]     = useState<string | null>(null);
  const [saveSuccess,   setSaveSuccess]   = useState(false);
  const [deleteError,   setDeleteError]   = useState<string | null>(null);

  // New role creation
  const [showNewRole,   setShowNewRole]   = useState(false);
  const [newRoleName,   setNewRoleName]   = useState("");
  const [newRoleError,  setNewRoleError]  = useState<string | null>(null);
  const [creatingRole,  setCreatingRole]  = useState(false);

  // Template picker
  const [showTemplates, setShowTemplates] = useState(false);

  const fetchRoles = useCallback(async () => {
    setLoadingRoles(true);
    try {
      const res  = await fetch("/api/admin/roles");
      const json = (await res.json()) as { success: boolean; data: { roles: TenantRole[] } };
      if (json.success) {
        setRoles(json.data.roles);
        if (!selectedId && json.data.roles.length > 0) {
          loadRole(json.data.roles[0]);
        }
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
    setSaveError(null);
    setSaveSuccess(false);
    setDeleteError(null);
  }

  async function handleSave() {
    if (!selectedId) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const res  = await fetch(`/api/admin/roles/${selectedId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name: roleName, description: roleDesc, permissions }),
      });
      const json = (await res.json()) as { success: boolean; error?: string; data?: { role: TenantRole } };
      if (!json.success) { setSaveError(json.error ?? "Failed to save"); return; }
      // Update local list
      setRoles((prev) =>
        prev.map((r) => (r.id === selectedId ? { ...r, name: roleName, description: roleDesc } : r)),
      );
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedId) return;
    const role = roles.find((r) => r.id === selectedId);
    if (!role) return;

    if (role._count.users > 0) {
      setDeleteError(
        `Cannot delete — ${role._count.users} user(s) have this role. Reassign them first.`,
      );
      return;
    }

    if (!confirm(`Delete the "${role.name}" role? This cannot be undone.`)) return;

    setDeleteError(null);
    const res  = await fetch(`/api/admin/roles/${selectedId}`, { method: "DELETE" });
    const json = (await res.json()) as { success: boolean; error?: string };
    if (!json.success) { setDeleteError(json.error ?? "Failed to delete"); return; }

    const remaining = roles.filter((r) => r.id !== selectedId);
    setRoles(remaining);
    if (remaining.length > 0) {
      loadRole(remaining[0]);
    } else {
      setSelectedId(null);
      setRoleName("");
      setRoleDesc("");
      setPermissions(emptyPermissions());
    }
  }

  async function handleDuplicate() {
    if (!selectedId) return;
    const res  = await fetch(`/api/admin/roles/${selectedId}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ action: "duplicate" }),
    });
    const json = (await res.json()) as { success: boolean; data?: { role: TenantRole } };
    if (json.success && json.data?.role) {
      const newRole = json.data.role;
      setRoles((prev) => [...prev, newRole]);
      loadRole(newRole);
    }
  }

  async function handleCreateRole() {
    if (!newRoleName.trim()) { setNewRoleError("Name is required"); return; }
    setCreatingRole(true);
    setNewRoleError(null);
    try {
      const res  = await fetch("/api/admin/roles", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name: newRoleName.trim() }),
      });
      const json = (await res.json()) as { success: boolean; error?: string; data?: { role: TenantRole } };
      if (!json.success) { setNewRoleError(json.error ?? "Failed to create role"); return; }
      const role = json.data!.role;
      setRoles((prev) => [...prev, role]);
      loadRole(role);
      setShowNewRole(false);
      setNewRoleName("");
    } finally {
      setCreatingRole(false);
    }
  }

  async function applyTemplate(idx: number) {
    const tpl = ROLE_TEMPLATES[idx];
    if (!tpl) return;
    setCreatingRole(true);
    setNewRoleError(null);
    try {
      const res  = await fetch("/api/admin/roles", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name: tpl.name, description: tpl.description, permissions: tpl.permissions }),
      });
      const json = (await res.json()) as { success: boolean; error?: string; data?: { role: TenantRole } };
      if (!json.success) { setNewRoleError(json.error ?? "Failed"); return; }
      const role = json.data!.role;
      setRoles((prev) => [...prev, role]);
      loadRole(role);
      setShowTemplates(false);
    } finally {
      setCreatingRole(false);
    }
  }

  const selectedRole   = roles.find((r) => r.id === selectedId);
  const permSummary    = buildPermissionSummary(permissions);

  return (
    <div className="flex gap-6 min-h-[600px]">
      {/* ── LEFT: Roles list ─────────────────────────────────────────── */}
      <div className="w-60 shrink-0 flex flex-col gap-3">
        {/* Create button */}
        <div className="flex flex-col gap-2">
          <Button
            size="sm"
            className="w-full gap-2 justify-start"
            onClick={() => { setShowNewRole(true); setShowTemplates(false); }}
          >
            <Plus className="h-4 w-4" />
            Create Role
          </Button>
          <button
            type="button"
            onClick={() => { setShowTemplates((v) => !v); setShowNewRole(false); }}
            className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 px-1"
          >
            <Sparkles className="h-3 w-3" />
            Use a template
          </button>
        </div>

        {/* Template picker */}
        {showTemplates && (
          <div className="bg-indigo-50 rounded-xl border border-indigo-100 p-3 space-y-2">
            <p className="text-xs font-semibold text-indigo-700 mb-2">Quick Templates</p>
            {ROLE_TEMPLATES.map((tpl, i) => (
              <button
                key={tpl.name}
                type="button"
                onClick={() => void applyTemplate(i)}
                disabled={creatingRole}
                className="w-full text-left px-3 py-2 rounded-lg text-sm text-indigo-800 hover:bg-indigo-100 transition-colors border border-transparent hover:border-indigo-200 disabled:opacity-50"
              >
                <p className="font-medium">{tpl.name}</p>
                <p className="text-xs text-indigo-600 mt-0.5">{tpl.description}</p>
              </button>
            ))}
          </div>
        )}

        {/* New role inline form */}
        {showNewRole && (
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-3 space-y-2">
            <Input
              placeholder="Role name…"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void handleCreateRole(); }}
              autoFocus
              className="text-sm h-8"
            />
            {newRoleError && <p className="text-xs text-red-600">{newRoleError}</p>}
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 h-7 text-xs" onClick={() => void handleCreateRole()} disabled={creatingRole}>
                {creatingRole ? <Loader2 className="h-3 w-3 animate-spin" /> : "Add"}
              </Button>
              <Button size="sm" variant="outline" className="flex-1 h-7 text-xs" onClick={() => { setShowNewRole(false); setNewRoleName(""); }}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Role list */}
        {loadingRoles ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
          </div>
        ) : roles.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400 py-8">
            <Shield className="h-8 w-8 mb-2 text-gray-200" />
            <p className="text-sm">No roles yet</p>
          </div>
        ) : (
          <div className="flex-1 space-y-1 overflow-y-auto">
            {roles.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => loadRole(role)}
                className={`w-full text-left px-3 py-3 rounded-xl transition-colors border ${
                  selectedId === role.id
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-700 border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                }`}
              >
                <p className="text-sm font-medium leading-none">{role.name}</p>
                <p className={`text-xs mt-1 ${selectedId === role.id ? "text-indigo-200" : "text-gray-400"}`}>
                  {role._count.users} user{role._count.users !== 1 ? "s" : ""}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── RIGHT: Role detail ────────────────────────────────────────── */}
      {selectedId && selectedRole ? (
        <div className="flex-1 bg-white rounded-2xl border border-gray-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="role-name" className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Role Name
              </Label>
              <Input
                id="role-name"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                className="text-base font-semibold text-gray-900 border-0 border-b-2 border-gray-200 rounded-none px-0 focus-visible:ring-0 focus-visible:border-indigo-500 bg-transparent"
                disabled={selectedRole.isSystem}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role-desc" className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Description
              </Label>
              <Input
                id="role-desc"
                value={roleDesc}
                onChange={(e) => setRoleDesc(e.target.value)}
                placeholder="What is this role for?"
                className="text-sm text-gray-600 border-gray-200"
                disabled={selectedRole.isSystem}
              />
            </div>

            {/* Permission summary */}
            <div className="flex items-start gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
              <Info className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
              <p className="text-xs text-indigo-700">{permSummary}</p>
            </div>
          </div>

          {/* Permission matrix — scrollable */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {selectedRole.isSystem ? (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-5">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                <p className="text-xs text-amber-700">System roles cannot be modified.</p>
              </div>
            ) : null}
            <PermissionMatrix
              permissions={permissions}
              onChange={selectedRole.isSystem ? () => {} : setPermissions}
            />
          </div>

          {/* Actions footer */}
          {!selectedRole.isSystem && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {deleteError && (
                  <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    {deleteError}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void handleDuplicate()}
                  className="gap-1.5 text-gray-600"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Duplicate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void handleDelete()}
                  className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
                <Button
                  size="sm"
                  onClick={() => void handleSave()}
                  disabled={saving}
                  className="gap-1.5 min-w-[100px]"
                >
                  {saving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : saveSuccess ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : null}
                  {saving ? "Saving…" : saveSuccess ? "Saved!" : "Save Changes"}
                </Button>
              </div>
            </div>
          )}

          {saveError && (
            <div className="px-6 pb-4">
              <p className="text-xs text-red-600 flex items-center gap-1.5">
                <XCircle className="h-3.5 w-3.5" />
                {saveError}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400">
          <ShieldCheck className="h-12 w-12 mb-3 text-gray-200" />
          <p className="text-sm font-medium text-gray-500">Select or create a role</p>
          <p className="text-xs text-gray-400 mt-1">
            Define permissions for each role in your organization.
          </p>
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  Users Tab                                                           */
/* ================================================================== */

const PAGE_LIMIT = 15;

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const url    = isEdit ? `/api/admin/portal-users/${user!.id}` : "/api/admin/portal-users";
      const method = isEdit ? "PATCH" : "POST";

      const body = isEdit
        ? { roleLabel, roleId: roleId || null, permissions }
        : {
            name:        name.trim(),
            email:       email.trim().toLowerCase(),
            roleLabel,
            roleId:      roleId || null,
            permissions,
          };

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

  // When a role is selected, pre-fill the roleLabel and auto-check permissions
  function handleRoleSelect(id: string) {
    setRoleId(id);
    const role = roles.find((r) => r.id === id);
    if (role) {
      setRoleLabel(role.name);
      const p = normalizePermissions(role.permissions);
      const mods = (Object.entries(p.modules) as [ModuleKey, boolean][])
        .filter(([, v]) => v)
        .map(([k]) => k);
      setPermissions(mods);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? "Edit User" : "Add Portal User"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
              <XCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {!isEdit && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="u-name">Full Name <span className="text-red-500">*</span></Label>
                <Input id="u-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Juan dela Cruz" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="u-email">Email <span className="text-red-500">*</span></Label>
                <Input id="u-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@company.com" required />
                <p className="text-xs text-gray-400">A temporary password will be sent to this address.</p>
              </div>
            </>
          )}

          {/* Role selector */}
          {roles.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="u-role-select">Assign Role</Label>
              <select
                id="u-role-select"
                value={roleId}
                onChange={(e) => handleRoleSelect(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">— Select a role —</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400">Selecting a role auto-assigns its module access.</p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="u-role-label">Custom Title (optional)</Label>
            <Input id="u-role-label" value={roleLabel} onChange={(e) => setRoleLabel(e.target.value)} placeholder="e.g. HR Officer, Accountant" />
          </div>

          {/* Module access (manual override) */}
          <div className="space-y-2">
            <Label>Module Access</Label>
            <div className="grid grid-cols-2 gap-2">
              {MODULE_KEYS.map((key) => {
                const checked = permissions.includes(key);
                return (
                  <label
                    key={key}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer select-none text-sm transition-colors ${
                      checked ? "border-indigo-400 bg-indigo-50 text-indigo-800" : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      onChange={() =>
                        setPermissions((prev) =>
                          checked ? prev.filter((k) => k !== key) : [...prev, key],
                        )
                      }
                    />
                    <span className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${checked ? "bg-indigo-600 border-indigo-600" : "border-gray-300 bg-white"}`}>
                      {checked && (
                        <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                    {MODULES[key].label}
                  </label>
                );
              })}
            </div>
          </div>
        </form>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 shrink-0">
          <Button variant="outline" type="button" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEdit ? "Save Changes" : "Create & Send Invite"}
          </Button>
        </div>
      </div>
    </div>
  );
}

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
      const qs  = new URLSearchParams({ page: String(page), limit: String(PAGE_LIMIT), ...(search ? { search } : {}) });
      const res  = await fetch(`/api/admin/portal-users?${qs}`);
      const json = (await res.json()) as { success: boolean; data: { users: PortalUser[]; total: number } };
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
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
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
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <Input className="pl-9" placeholder="Search name or email…" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Button className="gap-2 shrink-0" onClick={() => { setEditUser(null); setShowModal(true); }}>
          <UserPlus className="h-4 w-4" />Add User
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left px-5 py-3.5 font-semibold text-gray-600 w-[220px]">Name</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-600">Email</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-600">Role</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-600">Modules</th>
                <th className="text-center px-4 py-3.5 font-semibold text-gray-600 w-24">Status</th>
                <th className="text-right px-5 py-3.5 font-semibold text-gray-600 w-28">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-16"><Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-300" /></td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16 text-gray-400">
                  <UserPlus className="h-8 w-8 mx-auto mb-2 text-gray-200" />
                  <p className="font-medium text-gray-500">No users yet</p>
                  <p className="text-xs text-gray-400 mt-1">Add a user to grant workspace access.</p>
                </td></tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
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
                    <td className="px-4 py-3.5 text-gray-600">{user.email}</td>
                    <td className="px-4 py-3.5">
                      <span className="inline-block bg-indigo-50 text-indigo-700 text-xs font-medium px-2 py-0.5 rounded-full border border-indigo-100">
                        {user.roleLabel || "User"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {user.permissions.length === 0
                        ? <span className="text-gray-400 text-xs italic">No modules</span>
                        : <div className="flex flex-wrap gap-1">
                            {user.permissions.map((p) => (
                              <span key={p} className="inline-block bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded">
                                {MODULES[p as ModuleKey]?.label ?? p}
                              </span>
                            ))}
                          </div>
                      }
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {user.isActive
                        ? <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full"><CheckCircle2 className="h-3 w-3" />Active</span>
                        : <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full"><XCircle className="h-3 w-3" />Inactive</span>
                      }
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => { setEditUser(user); setShowModal(true); }} disabled={actionId === user.id}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-50" title="Edit">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => void toggleActive(user)} disabled={actionId === user.id}
                          className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${user.isActive ? "text-gray-400 hover:text-amber-600 hover:bg-amber-50" : "text-gray-400 hover:text-emerald-600 hover:bg-emerald-50"}`}
                          title={user.isActive ? "Deactivate" : "Activate"}>
                          {actionId === user.id ? <Loader2 className="h-4 w-4 animate-spin" />
                            : user.isActive ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                        </button>
                        <button onClick={() => void handleDelete(user)} disabled={actionId === user.id}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50" title="Remove">
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

        {total > PAGE_LIMIT && (
          <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
            <span>Showing {(page - 1) * PAGE_LIMIT + 1}–{Math.min(page * PAGE_LIMIT, total)} of {total}</span>
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="h-8 w-8 p-0"><ChevronLeft className="h-4 w-4" /></Button>
              <span className="px-2">{page} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="h-8 w-8 p-0"><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}
      </div>

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
/*  Page root                                                           */
/* ================================================================== */

type TabId = "users" | "roles";

const TABS: { id: TabId; label: string; icon: typeof Users }[] = [
  { id: "users", label: "Users",             icon: Users      },
  { id: "roles", label: "Roles & Permissions", icon: ShieldCheck },
];

export default function UsersRolesPage() {
  const [activeTab, setActiveTab] = useState<TabId>("users");
  const [roles,     setRoles]     = useState<TenantRole[]>([]);

  // Prefetch roles so both tabs can use them
  useEffect(() => {
    fetch("/api/admin/roles")
      .then((r) => r.json())
      .then((d: { success: boolean; data?: { roles: TenantRole[] } }) => {
        if (d.success && d.data) setRoles(d.data.roles);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Users &amp; Roles</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Manage workspace access, define roles, and configure granular permissions.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-0 -mb-px">
          {TABS.map((tab) => {
            const Icon     = tab.icon;
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? "border-indigo-600 text-indigo-700"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === "users"  && <UsersTab roles={roles} />}
      {activeTab === "roles"  && <RolesTab />}
    </div>
  );
}
