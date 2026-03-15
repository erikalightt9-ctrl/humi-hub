"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Save, Check, ShieldCheck } from "lucide-react";
import type { SecuritySettings } from "@/lib/repositories/settings.repository";

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface SecuritySettingsFormProps {
  readonly initialValues: SecuritySettings;
}

export function SecuritySettingsForm({ initialValues }: SecuritySettingsFormProps) {
  const [passwordMinLength, setPasswordMinLength] = React.useState(
    String(initialValues.passwordMinLength),
  );
  const [requireUppercase, setRequireUppercase] = React.useState(initialValues.requireUppercase);
  const [requireNumbers, setRequireNumbers] = React.useState(initialValues.requireNumbers);
  const [requireSymbols, setRequireSymbols] = React.useState(initialValues.requireSymbols);
  const [sessionTimeoutMins, setSessionTimeoutMins] = React.useState(
    String(initialValues.sessionTimeoutMins),
  );
  const [maxLoginAttempts, setMaxLoginAttempts] = React.useState(
    String(initialValues.maxLoginAttempts),
  );

  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch("/api/admin/settings/security", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passwordMinLength: parseInt(passwordMinLength, 10) || 8,
          requireUppercase,
          requireNumbers,
          requireSymbols,
          sessionTimeoutMins: parseInt(sessionTimeoutMins, 10) || 60,
          maxLoginAttempts: parseInt(maxLoginAttempts, 10) || 5,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error ?? "Failed to save");
        return;
      }
      setSaved(true);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function toggleProps(checked: boolean, setter: (v: boolean) => void) {
    return {
      checked,
      onCheckedChange: (v: boolean) => {
        setter(v);
        setSaved(false);
      },
    };
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
          {error}
        </div>
      )}

      {/* Password Policy */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-800 border-b pb-2">Password Policy</h3>

        <div>
          <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
          <Input
            id="passwordMinLength"
            type="number"
            min={6}
            max={32}
            value={passwordMinLength}
            onChange={(e) => setPasswordMinLength(e.target.value)}
            className="max-w-[120px]"
          />
          <p className="text-xs text-gray-500 mt-1">Between 6 and 32 characters.</p>
        </div>

        {[
          {
            label: "Require uppercase letters",
            description: "Passwords must contain at least one uppercase letter (A–Z)",
            checked: requireUppercase,
            setter: setRequireUppercase,
          },
          {
            label: "Require numbers",
            description: "Passwords must contain at least one number (0–9)",
            checked: requireNumbers,
            setter: setRequireNumbers,
          },
          {
            label: "Require symbols",
            description: "Passwords must contain at least one symbol (!, @, #, etc.)",
            checked: requireSymbols,
            setter: setRequireSymbols,
          },
        ].map(({ label, description, checked, setter }) => (
          <div key={label} className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-800">{label}</p>
              <p className="text-xs text-gray-500">{description}</p>
            </div>
            <Switch {...toggleProps(checked, setter)} />
          </div>
        ))}
      </div>

      {/* Session & Access */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-800 border-b pb-2">Session &amp; Access</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="sessionTimeoutMins">Session Timeout (minutes)</Label>
            <Input
              id="sessionTimeoutMins"
              type="number"
              min={5}
              max={1440}
              value={sessionTimeoutMins}
              onChange={(e) => setSessionTimeoutMins(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">5–1440 mins (1 day max).</p>
          </div>

          <div>
            <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
            <Input
              id="maxLoginAttempts"
              type="number"
              min={1}
              max={20}
              value={maxLoginAttempts}
              onChange={(e) => setMaxLoginAttempts(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">Before temporary lockout.</p>
          </div>
        </div>
      </div>

      {/* Policy preview */}
      <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-indigo-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-gray-700 space-y-1">
          <p className="font-medium">Current Policy Preview</p>
          <p>
            Min length: <strong>{passwordMinLength} chars</strong>
            {requireUppercase && " · uppercase required"}
            {requireNumbers && " · numbers required"}
            {requireSymbols && " · symbols required"}
          </p>
          <p>
            Session timeout: <strong>{sessionTimeoutMins} min</strong> · Max attempts:{" "}
            <strong>{maxLoginAttempts}</strong>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
            <Check className="h-4 w-4" /> Saved
          </span>
        )}
        <Button type="submit" disabled={saving} className="gap-1.5">
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : "Save Security Settings"}
        </Button>
      </div>
    </form>
  );
}
