"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  Plus,
  Users,
  UserPlus,
  Loader2,
  X,
  CheckCircle2,
  XCircle,
  Copy,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Organization {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly email: string;
  readonly industry: string | null;
  readonly maxSeats: number;
  readonly isActive: boolean;
  readonly createdAt: string | Date;
  readonly _count: {
    readonly managers: number;
    readonly students: number;
    readonly enrollments: number;
  };
}

interface ManagerResult {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly tempPassword: string;
}

/* ------------------------------------------------------------------ */
/*  Create Organization Modal                                          */
/* ------------------------------------------------------------------ */

function CreateOrgModal({
  onClose,
  onCreated,
}: {
  readonly onClose: () => void;
  readonly onCreated: (org: Organization) => void;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [email, setEmail] = useState("");
  const [industry, setIndustry] = useState("");
  const [maxSeats, setMaxSeats] = useState("10");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate slug from name
  function handleNameChange(value: string) {
    setName(value);
    setSlug(
      value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          email: email.trim().toLowerCase(),
          industry: industry.trim() || null,
          maxSeats: parseInt(maxSeats, 10) || 10,
        }),
      });

      const json = await res.json();

      if (!json.success) {
        setError(json.error ?? "Failed to create organization");
        return;
      }

      onCreated({ ...json.data, _count: { managers: 0, students: 0, enrollments: 0 } });
      onClose();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Create Organization</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="org-name">Organization Name *</Label>
            <Input
              id="org-name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Acme Corp"
              required
              maxLength={200}
            />
          </div>
          <div>
            <Label htmlFor="org-slug">Slug *</Label>
            <Input
              id="org-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="acme-corp"
              required
              maxLength={100}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="org-email">Contact Email *</Label>
            <Input
              id="org-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@acmecorp.com"
              required
            />
          </div>
          <div>
            <Label htmlFor="org-industry">Industry</Label>
            <Input
              id="org-industry"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g. Healthcare, Technology"
              maxLength={100}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="org-seats">Max Seats</Label>
          <Input
            id="org-seats"
            type="number"
            value={maxSeats}
            onChange={(e) => setMaxSeats(e.target.value)}
            min={1}
            max={1000}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving} className="gap-2">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Organization"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Create Manager Modal                                               */
/* ------------------------------------------------------------------ */

function CreateManagerModal({
  orgId,
  orgName,
  onClose,
}: {
  readonly orgId: string;
  readonly orgName: string;
  readonly onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ManagerResult | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/organizations/${orgId}/managers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
        }),
      });

      const json = await res.json();

      if (!json.success) {
        setError(json.error ?? "Failed to create manager");
        return;
      }

      setResult(json.data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleCopy() {
    if (!result) return;
    const text = `Email: ${result.email}\nTemporary Password: ${result.tempPassword}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">Create Manager</h3>
          <p className="text-xs text-gray-500">{orgName}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {result ? (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-800">Manager Created</span>
            </div>
            <div className="text-sm text-green-700 space-y-1">
              <p>
                <strong>Name:</strong> {result.name}
              </p>
              <p>
                <strong>Email:</strong> {result.email}
              </p>
              <p>
                <strong>Temporary Password:</strong>{" "}
                <code className="bg-green-100 px-1 rounded">{result.tempPassword}</code>
              </p>
            </div>
          </div>

          <p className="text-xs text-gray-500">
            Share these credentials securely with the manager. They can log in at{" "}
            <code className="bg-gray-100 px-1 rounded">/corporate/login</code>.
          </p>

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
              <Copy className="h-3.5 w-3.5" />
              {copied ? "Copied!" : "Copy Credentials"}
            </Button>
            <Button size="sm" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
              {error}
            </div>
          )}

          <div>
            <Label htmlFor="mgr-name">Full Name *</Label>
            <Input
              id="mgr-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Manager name"
              required
            />
          </div>

          <div>
            <Label htmlFor="mgr-email">Email Address *</Label>
            <Input
              id="mgr-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="manager@company.com"
              required
            />
          </div>

          <p className="text-xs text-gray-500">
            A temporary password will be generated automatically.
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="gap-2">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Manager"
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Status Badge                                                       */
/* ------------------------------------------------------------------ */

function OrgStatusBadge({ isActive }: { readonly isActive: boolean }) {
  return isActive ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
      <CheckCircle2 className="h-3 w-3" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
      <XCircle className="h-3 w-3" />
      Inactive
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function OrganizationManager() {
  const [organizations, setOrganizations] = useState<ReadonlyArray<Organization>>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [managerModal, setManagerModal] = useState<{
    readonly orgId: string;
    readonly orgName: string;
  } | null>(null);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  function fetchOrganizations() {
    setLoading(true);
    fetch("/api/admin/organizations")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setOrganizations(json.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  async function handleToggleActive(orgId: string, isActive: boolean) {
    try {
      const res = await fetch(`/api/admin/organizations/${orgId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });

      const json = await res.json();

      if (json.success) {
        setOrganizations((prev) =>
          prev.map((o) => (o.id === orgId ? { ...o, isActive: !isActive } : o)),
        );
      }
    } catch {
      // Silent fail
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {organizations.length} organization{organizations.length !== 1 ? "s" : ""}
        </p>
        <Button className="gap-1.5" onClick={() => setShowCreateOrg(true)}>
          <Plus className="h-4 w-4" />
          Create Organization
        </Button>
      </div>

      {/* Modals */}
      {showCreateOrg && (
        <CreateOrgModal
          onClose={() => setShowCreateOrg(false)}
          onCreated={(org) => setOrganizations((prev) => [org, ...prev])}
        />
      )}

      {managerModal && (
        <CreateManagerModal
          orgId={managerModal.orgId}
          orgName={managerModal.orgName}
          onClose={() => setManagerModal(null)}
        />
      )}

      {/* Organization list */}
      {organizations.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-8 w-8 text-purple-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            No Organizations Yet
          </h2>
          <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
            Create your first organization to start the corporate upskilling
            portal.
          </p>
          <Button onClick={() => setShowCreateOrg(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create First Organization
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {organizations.map((org) => (
            <div
              key={org.id}
              className="bg-white rounded-xl border border-gray-200 p-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 rounded-lg p-2 mt-0.5">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{org.name}</h3>
                      <OrgStatusBadge isActive={org.isActive} />
                    </div>
                    <p className="text-sm text-gray-500">
                      {org.email} {org.industry ? `\u2022 ${org.industry}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() =>
                      setManagerModal({ orgId: org.id, orgName: org.name })
                    }
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Add Manager
                  </Button>
                  <Button
                    variant={org.isActive ? "outline" : "default"}
                    size="sm"
                    onClick={() => handleToggleActive(org.id, org.isActive)}
                  >
                    {org.isActive ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-6 mt-4 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span>
                    {org._count.students} / {org.maxSeats} seats
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <ClipboardList className="h-4 w-4 text-gray-400" />
                  <span>{org._count.enrollments} enrollments</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <UserPlus className="h-4 w-4 text-gray-400" />
                  <span>{org._count.managers} managers</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
