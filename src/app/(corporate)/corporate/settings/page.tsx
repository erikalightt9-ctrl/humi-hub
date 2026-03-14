"use client";

import { useState, useEffect } from "react";
import { Settings, Loader2, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface OrgSettings {
  readonly name: string;
  readonly industry: string | null;
  readonly maxSeats: number;
  readonly totalEmployees: number;
}

export default function CorporateSettingsPage() {
  const [settings, setSettings] = useState<OrgSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");

  useEffect(() => {
    fetch("/api/corporate/settings")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setSettings(json.data);
          setName(json.data.name);
          setIndustry(json.data.industry ?? "");
        }
      })
      .catch(() => setError("Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/corporate/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          industry: industry.trim() || null,
        }),
      });

      const json = await res.json();

      if (!json.success) {
        setError(json.error ?? "Failed to save");
        return;
      }

      setSuccess(true);
      setSettings(json.data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
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
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-gray-100 rounded-lg p-2">
            <Settings className="h-5 w-5 text-gray-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-sm text-gray-500">
              Manage your organization settings
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
        <div className="flex items-center gap-2 mb-6">
          <Building2 className="h-5 w-5 text-gray-500" />
          <h2 className="font-semibold text-gray-900">
            Organization Details
          </h2>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg p-3">
              Settings saved successfully.
            </div>
          )}

          <div>
            <Label htmlFor="org-name">Organization Name</Label>
            <Input
              id="org-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Organization name"
              maxLength={200}
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

          <div>
            <Label>Plan Usage</Label>
            <p className="text-sm text-gray-600">
              {settings?.totalEmployees ?? 0} / {settings?.maxSeats ?? 10} seats
              used
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={saving} className="gap-2">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
