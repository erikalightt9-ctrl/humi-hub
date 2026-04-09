"use client";

import { useState, useEffect, useCallback } from "react";
import { UserCog, Plus, Trash2, KeyRound, Loader2, CheckCircle, ShieldAlert, LockOpen } from "lucide-react";

interface TenantAdmin {
  id: string;
  email: string;
  name: string;
  isTenantAdmin: boolean;
  isActive: boolean;
  createdAt: string;
}

export function AdminsPanel({ tenantId }: { tenantId: string }) {
  const [admins, setAdmins]       = useState<TenantAdmin[]>([]);
  const [canAdd, setCanAdd]       = useState(true);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [success, setSuccess]     = useState<string | null>(null);

  // Add form
  const [showAdd, setShowAdd]     = useState(false);
  const [addName, setAddName]     = useState("");
  const [addEmail, setAddEmail]   = useState("");
  const [addPwd, setAddPwd]       = useState("");
  const [addAdmin, setAddAdmin]   = useState(true);
  const [adding, setAdding]       = useState(false);

  // Reset password
  const [resetId, setResetId]     = useState<string | null>(null);
  const [newPwd, setNewPwd]       = useState("");
  const [resetting, setResetting] = useState(false);

  // Delete
  const [deleting, setDeleting]   = useState<string | null>(null);

  // Unlock account
  const [unlockEmail, setUnlockEmail] = useState("");
  const [unlocking, setUnlocking]     = useState(false);
  const [unlockResult, setUnlockResult] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`/api/superadmin/tenants/${tenantId}/admins`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setAdmins(json.data);
      setCanAdd(json.meta.canAddMore);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load admins");
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => { load(); }, [load]);

  const flash = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 4000);
  };

  const handleAdd = async () => {
    if (!addName || !addEmail || !addPwd) return;
    setAdding(true);
    setError(null);
    try {
      const res  = await fetch(`/api/superadmin/tenants/${tenantId}/admins`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name: addName, email: addEmail, password: addPwd, isTenantAdmin: addAdmin }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setAdmins((prev) => [...prev, json.data]);
      setCanAdd(json.meta.canAddMore);
      setShowAdd(false);
      setAddName(""); setAddEmail(""); setAddPwd("");
      flash(`Admin account created for ${json.data.email}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create admin");
    } finally {
      setAdding(false);
    }
  };

  const handleReset = async (adminId: string) => {
    if (!newPwd || newPwd.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setResetting(true);
    setError(null);
    try {
      const res  = await fetch(`/api/superadmin/tenants/${tenantId}/admins`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ adminId, newPassword: newPwd }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setResetId(null);
      setNewPwd("");
      flash("Password reset successfully");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reset password");
    } finally {
      setResetting(false);
    }
  };

  const handleUnlock = async () => {
    if (!unlockEmail) return;
    setUnlocking(true);
    setUnlockResult(null);
    setError(null);
    try {
      const res  = await fetch("/api/superadmin/unlock-account", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: unlockEmail }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setUnlockResult(`Unlocked ${json.data.email}: ${json.data.unlockedIn.join(", ")}`);
      setUnlockEmail("");
      load(); // refresh admin list in case isActive changed
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unlock failed");
    } finally {
      setUnlocking(false);
    }
  };

  const handleDelete = async (adminId: string, email: string) => {
    if (!confirm(`Remove admin access for ${email}?`)) return;
    setDeleting(adminId);
    setError(null);
    try {
      const res  = await fetch(`/api/superadmin/tenants/${tenantId}/admins?adminId=${adminId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setAdmins((prev) => prev.filter((a) => a.id !== adminId));
      setCanAdd(json.meta.canAddMore);
      flash(`Removed ${email}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to remove admin");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="bg-ds-card border border-ds-border rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-ds-text flex items-center gap-2">
          <UserCog className="h-4 w-4 text-ds-muted" />
          Admin Accounts
        </h2>
        {canAdd && !showAdd && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium border border-indigo-200 rounded-lg px-3 py-1.5 hover:bg-indigo-50"
          >
            <Plus className="h-3.5 w-3.5" /> Add Admin
          </button>
        )}
      </div>

      {success && (
        <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          <CheckCircle className="h-4 w-4 flex-shrink-0" /> {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <ShieldAlert className="h-4 w-4 flex-shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-6 text-ds-muted">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : admins.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-ds-border rounded-lg">
          <UserCog className="h-8 w-8 text-ds-muted mx-auto mb-2 opacity-40" />
          <p className="text-sm text-ds-muted font-medium">No admin accounts</p>
          <p className="text-xs text-ds-muted mt-1">
            This tenant has no login credentials. Add an admin to grant access.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-ds-border">
          {admins.map((admin) => (
            <div key={admin.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ds-text">{admin.name}</p>
                  <p className="text-xs text-ds-muted">{admin.email}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {admin.isTenantAdmin && (
                      <span className="text-xs bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-medium">Tenant Admin</span>
                    )}
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${admin.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                      {admin.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setResetId(resetId === admin.id ? null : admin.id); setNewPwd(""); setError(null); }}
                    className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1"
                    title="Reset password"
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(admin.id, admin.email)}
                    disabled={deleting === admin.id}
                    className="text-xs text-slate-400 hover:text-red-600 flex items-center gap-1 disabled:opacity-40"
                    title="Remove admin"
                  >
                    {deleting === admin.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {resetId === admin.id && (
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="password"
                    placeholder="New password (min 8 chars)"
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    className="flex-1 text-xs border border-ds-border rounded-lg px-2.5 py-1.5 bg-ds-bg focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  />
                  <button
                    onClick={() => handleReset(admin.id)}
                    disabled={resetting}
                    className="text-xs bg-indigo-600 text-white rounded-lg px-3 py-1.5 hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1"
                  >
                    {resetting ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                    Reset
                  </button>
                  <button onClick={() => setResetId(null)} className="text-xs text-ds-muted hover:text-ds-text">
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div className="border border-indigo-200 rounded-lg p-4 bg-indigo-50 space-y-3">
          <p className="text-xs font-semibold text-indigo-800">New Admin Account</p>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Full name"
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              className="text-sm border border-ds-border rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
            <input
              type="email"
              placeholder="Email address"
              value={addEmail}
              onChange={(e) => setAddEmail(e.target.value)}
              className="text-sm border border-ds-border rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>
          <input
            type="password"
            placeholder="Temporary password (min 8 chars)"
            value={addPwd}
            onChange={(e) => setAddPwd(e.target.value)}
            className="w-full text-sm border border-ds-border rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
          <label className="flex items-center gap-2 text-xs text-indigo-800 cursor-pointer">
            <input
              type="checkbox"
              checked={addAdmin}
              onChange={(e) => setAddAdmin(e.target.checked)}
              className="rounded"
            />
            Grant full Tenant Admin access
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAdd}
              disabled={adding || !addName || !addEmail || !addPwd}
              className="flex items-center gap-1.5 text-sm bg-indigo-600 text-white rounded-lg px-4 py-1.5 hover:bg-indigo-700 disabled:opacity-50"
            >
              {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Create Admin
            </button>
            <button onClick={() => { setShowAdd(false); setError(null); }} className="text-sm text-ds-muted hover:text-ds-text">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Unlock locked account ── */}
      <div className="border-t border-ds-border pt-4 space-y-2">
        <p className="text-xs font-semibold text-ds-muted flex items-center gap-1.5">
          <LockOpen className="h-3.5 w-3.5" />
          Unlock Locked Account
        </p>
        <p className="text-xs text-ds-muted">
          Resets failed login attempts for any email (student, trainer, corporate manager).
        </p>
        {unlockResult && (
          <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 flex items-center gap-1.5">
            <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" /> {unlockResult}
          </div>
        )}
        <div className="flex items-center gap-2">
          <input
            type="email"
            placeholder="Email address to unlock"
            value={unlockEmail}
            onChange={(e) => setUnlockEmail(e.target.value)}
            className="flex-1 text-sm border border-ds-border rounded-lg px-3 py-1.5 bg-ds-bg focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
          <button
            onClick={handleUnlock}
            disabled={unlocking || !unlockEmail}
            className="flex items-center gap-1.5 text-sm bg-amber-500 text-white rounded-lg px-3 py-1.5 hover:bg-amber-600 disabled:opacity-50 whitespace-nowrap"
          >
            {unlocking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LockOpen className="h-3.5 w-3.5" />}
            Unlock
          </button>
        </div>
      </div>
    </div>
  );
}
