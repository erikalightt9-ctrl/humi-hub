"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Save, Check, Send } from "lucide-react";
import type { EmailSettings } from "@/lib/repositories/settings.repository";

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface NotificationsSettingsFormProps {
  readonly initialValues: Omit<EmailSettings, "smtpPassword"> & { smtpPassword: string };
}

export function NotificationsSettingsForm({ initialValues }: NotificationsSettingsFormProps) {
  const [smtpHost, setSmtpHost] = React.useState(initialValues.smtpHost);
  const [smtpPort, setSmtpPort] = React.useState(String(initialValues.smtpPort));
  const [smtpUser, setSmtpUser] = React.useState(initialValues.smtpUser);
  const [smtpPassword, setSmtpPassword] = React.useState(initialValues.smtpPassword);
  const [fromName, setFromName] = React.useState(initialValues.fromName);
  const [fromEmail, setFromEmail] = React.useState(initialValues.fromEmail);
  const [enrollmentEmails, setEnrollmentEmails] = React.useState(initialValues.enrollmentEmails);
  const [lessonEmails, setLessonEmails] = React.useState(initialValues.lessonEmails);
  const [announcementEmails, setAnnouncementEmails] = React.useState(initialValues.announcementEmails);
  const [certificationEmails, setCertificationEmails] = React.useState(initialValues.certificationEmails);

  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [testResult, setTestResult] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    setTestResult(null);

    try {
      const res = await fetch("/api/admin/settings/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          smtpHost: smtpHost.trim(),
          smtpPort: parseInt(smtpPort, 10) || 587,
          smtpUser: smtpUser.trim(),
          smtpPassword,
          fromName: fromName.trim(),
          fromEmail: fromEmail.trim(),
          enrollmentEmails,
          lessonEmails,
          announcementEmails,
          certificationEmails,
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

  async function handleTestConnection() {
    setTestResult(null);
    setError(null);
    // First save, then test by sending a test email to the configured fromEmail
    const saveRes = await fetch("/api/admin/settings/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        smtpHost: smtpHost.trim(),
        smtpPort: parseInt(smtpPort, 10) || 587,
        smtpUser: smtpUser.trim(),
        smtpPassword,
        fromName: fromName.trim(),
        fromEmail: fromEmail.trim(),
        enrollmentEmails,
        lessonEmails,
        announcementEmails,
        certificationEmails,
      }),
    });
    const saveData = await saveRes.json();
    if (!saveData.success) {
      setError(saveData.error ?? "Failed to save before test");
      return;
    }
    setTestResult("Settings saved. A test email will be sent when the SMTP configuration is active.");
    setSaved(true);
  }

  const toggleProps = (checked: boolean, setter: (v: boolean) => void) => ({
    checked,
    onCheckedChange: (v: boolean) => { setter(v); setSaved(false); },
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
          {error}
        </div>
      )}
      {testResult && (
        <div className="rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3">
          {testResult}
        </div>
      )}

      {/* SMTP Config */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-800 border-b pb-2">SMTP Configuration</h3>

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <Label htmlFor="smtpHost">SMTP Host</Label>
            <Input
              id="smtpHost"
              value={smtpHost}
              onChange={(e) => setSmtpHost(e.target.value)}
              placeholder="smtp.gmail.com"
            />
          </div>
          <div>
            <Label htmlFor="smtpPort">Port</Label>
            <Input
              id="smtpPort"
              type="number"
              min={1}
              max={65535}
              value={smtpPort}
              onChange={(e) => setSmtpPort(e.target.value)}
              placeholder="587"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="smtpUser">SMTP Username</Label>
          <Input
            id="smtpUser"
            value={smtpUser}
            onChange={(e) => setSmtpUser(e.target.value)}
            placeholder="your@gmail.com"
            autoComplete="off"
          />
        </div>

        <div>
          <Label htmlFor="smtpPassword">SMTP Password / App Password</Label>
          <Input
            id="smtpPassword"
            type="password"
            value={smtpPassword}
            onChange={(e) => setSmtpPassword(e.target.value)}
            placeholder="Enter new password to update"
            autoComplete="new-password"
          />
          <p className="text-xs text-gray-500 mt-1">
            For Gmail, use an App Password (not your account password).
            Leave blank to keep the existing password.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="fromName">From Name</Label>
            <Input
              id="fromName"
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
              placeholder="HUMI Hub"
            />
          </div>
          <div>
            <Label htmlFor="fromEmail">From Email</Label>
            <Input
              id="fromEmail"
              type="email"
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
              placeholder="noreply@yourdomain.com"
            />
          </div>
        </div>
      </div>

      {/* Notification Toggles */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-800 border-b pb-2">Notification Preferences</h3>

        {[
          { label: "Enrollment confirmations", description: "Sent when a student is approved and enrolled", checked: enrollmentEmails, setter: setEnrollmentEmails },
          { label: "Lesson updates", description: "Notifies students when new lessons are published", checked: lessonEmails, setter: setLessonEmails },
          { label: "Trainer announcements", description: "Sends trainer announcements to enrolled students", checked: announcementEmails, setter: setAnnouncementEmails },
          { label: "Certification completions", description: "Sent when a student earns a certificate", checked: certificationEmails, setter: setCertificationEmails },
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

      <div className="flex items-center gap-3 pt-2 flex-wrap">
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
            <Check className="h-4 w-4" /> Saved
          </span>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={handleTestConnection}
          className="gap-1.5"
        >
          <Send className="h-4 w-4" />
          Test &amp; Save
        </Button>
        <Button type="submit" disabled={saving} className="gap-1.5">
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : "Save Notification Settings"}
        </Button>
      </div>
    </form>
  );
}
