"use client";

import { useState, useEffect } from "react";
import {
  Globe,
  Mail,
  Shield,
  Database,
  CreditCard,
  Bell,
  Save,
  Loader2,
  CheckCircle2,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PlatformSettings {
  siteName: string;
  timezone: string;
  currency: string;
  language: string;
}

interface EnvData {
  nodeEnv: string;
  rootDomain: string;
  nextauthUrl: string;
  nextauthSecret: boolean;
  databaseUrl: boolean;
  gmailUser: string;
  gmailPass: boolean;
  emailFrom: string;
  emailFromName: string;
  supportEmail: string;
  stripeKey: boolean;
  stripeWebhook: boolean;
}

const TIMEZONES = [
  "Asia/Manila",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Asia/Dubai",
  "Europe/London",
  "Europe/Paris",
  "America/New_York",
  "America/Los_Angeles",
  "America/Chicago",
  "UTC",
];

const CURRENCIES = ["PHP", "USD", "EUR", "GBP", "SGD", "AUD", "JPY"];
const LANGUAGES  = [
  { value: "en", label: "English" },
  { value: "fil", label: "Filipino" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "ja", label: "Japanese" },
];

/* ------------------------------------------------------------------ */
/*  Small UI helpers                                                   */
/* ------------------------------------------------------------------ */

function Card({
  title,
  icon: Icon,
  description,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <Icon className="h-4 w-4 text-blue-600" />
          <h2 className="font-semibold text-gray-900 text-sm">{title}</h2>
        </div>
        {description && <p className="text-xs text-gray-500 ml-6">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function EnvRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs font-mono text-gray-500">{label}</span>
      <span className="text-xs font-medium text-gray-800 font-mono">{value}</span>
    </div>
  );
}

function EnvBadge({ set }: { set: boolean }) {
  return set ? (
    <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
      ✓ Set
    </span>
  ) : (
    <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium">
      ✗ Missing
    </span>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 items-center gap-4">
      <label className="text-sm text-gray-600 text-right">{label}</label>
      <div className="col-span-2">{children}</div>
    </div>
  );
}

const inputCls =
  "w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function PlatformSettingsForm({ env }: { env: EnvData }) {
  const [settings, setSettings] = useState<PlatformSettings>({
    siteName: "HUMI Hub",
    timezone: "Asia/Manila",
    currency: "PHP",
    language: "en",
  });
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"general" | "environment">("general");

  useEffect(() => {
    fetch("/api/superadmin/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setSettings({
            siteName: d.data.siteName,
            timezone: d.data.timezone,
            currency: d.data.currency,
            language: d.data.language,
          });
        }
      })
      .catch(() => {/* use defaults */})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const res  = await fetch("/api/superadmin/settings", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(settings),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Failed to save");
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function set<K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="space-y-5">
      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {(["general", "environment"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-5 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
              activeTab === t
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "general" ? "General" : "Environment"}
          </button>
        ))}
      </div>

      {/* ── General tab (editable) ── */}
      {activeTab === "general" && (
        <form onSubmit={handleSave} className="space-y-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            </div>
          ) : (
            <>
              {/* Platform identity */}
              <Card icon={Globe} title="Platform Identity" description="Public-facing platform name and locale settings.">
                <div className="space-y-4 mt-2">
                  <FieldRow label="Platform name">
                    <input
                      type="text"
                      value={settings.siteName}
                      onChange={(e) => set("siteName", e.target.value)}
                      placeholder="HUMI Hub"
                      maxLength={80}
                      required
                      className={inputCls}
                    />
                  </FieldRow>
                  <FieldRow label="Default timezone">
                    <select
                      value={settings.timezone}
                      onChange={(e) => set("timezone", e.target.value)}
                      className={inputCls}
                    >
                      {TIMEZONES.map((tz) => (
                        <option key={tz} value={tz}>{tz}</option>
                      ))}
                    </select>
                  </FieldRow>
                  <FieldRow label="Default currency">
                    <select
                      value={settings.currency}
                      onChange={(e) => set("currency", e.target.value)}
                      className={inputCls}
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </FieldRow>
                  <FieldRow label="Default language">
                    <select
                      value={settings.language}
                      onChange={(e) => set("language", e.target.value)}
                      className={inputCls}
                    >
                      {LANGUAGES.map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </FieldRow>
                </div>
              </Card>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                  {error}
                </div>
              )}

              {/* Save button */}
              <div className="flex items-center justify-end gap-3">
                {saved && (
                  <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
                    <CheckCircle2 className="h-4 w-4" />
                    Settings saved
                  </span>
                )}
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white bg-[#1E3A8A] hover:bg-[#1e40af] transition-colors disabled:opacity-70"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saving ? "Saving…" : "Save Settings"}
                </button>
              </div>
            </>
          )}
        </form>
      )}

      {/* ── Environment tab (read-only) ── */}
      {activeTab === "environment" && (
        <div className="space-y-5">
          <Card icon={Globe} title="Runtime" description="Deployment and runtime configuration.">
            <EnvRow label="NODE_ENV"     value={env.nodeEnv} />
            <EnvRow label="ROOT_DOMAIN"  value={env.rootDomain} />
            <EnvRow label="NEXTAUTH_URL" value={env.nextauthUrl} />
          </Card>

          <Card
            icon={Shield}
            title="Secrets"
            description="Sensitive values are not displayed — only whether they are set."
          >
            {[
              { label: "NEXTAUTH_SECRET",       set: env.nextauthSecret },
              { label: "DATABASE_URL",          set: env.databaseUrl },
              { label: "GMAIL_APP_PASSWORD",    set: env.gmailPass },
              { label: "STRIPE_SECRET_KEY",     set: env.stripeKey },
              { label: "STRIPE_WEBHOOK_SECRET", set: env.stripeWebhook },
            ].map(({ label, set }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-xs font-mono text-gray-500">{label}</span>
                <EnvBadge set={set} />
              </div>
            ))}
          </Card>

          <Card
            icon={Mail}
            title="Email (SMTP / Gmail)"
            description="Edit via .env or Vercel environment variables."
          >
            <EnvRow label="GMAIL_USER"         value={env.gmailUser} />
            <EnvRow label="EMAIL_FROM_ADDRESS" value={env.emailFrom} />
            <EnvRow label="EMAIL_FROM_NAME"    value={env.emailFromName} />
            <EnvRow label="SUPPORT_EMAIL"      value={env.supportEmail} />
          </Card>

          <Card icon={Database} title="Database">
            <div className="flex items-center justify-between py-2">
              <span className="text-xs font-mono text-gray-500">DATABASE_URL</span>
              <EnvBadge set={env.databaseUrl} />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Run{" "}
              <code className="bg-gray-50 px-1 rounded">npx prisma migrate deploy</code>{" "}
              to apply pending schema migrations.
            </p>
          </Card>

          <Card
            icon={CreditCard}
            title="Billing (Stripe)"
            description="Stripe integration for tenant subscription payments."
          >
            {[
              { label: "STRIPE_SECRET_KEY",     set: env.stripeKey },
              { label: "STRIPE_WEBHOOK_SECRET", set: env.stripeWebhook },
            ].map(({ label, set }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-xs font-mono text-gray-500">{label}</span>
                <EnvBadge set={set} />
              </div>
            ))}
          </Card>

          <Card icon={Bell} title="Notifications" description="Platform-level notification triggers.">
            <ul className="text-sm text-gray-500 space-y-1.5 list-disc list-inside">
              <li>Tenant welcome email on creation</li>
              <li>Admin credential emails for new managers</li>
              <li>Student enrollment confirmation emails</li>
              <li>Password reset emails</li>
              <li>Support ticket notifications</li>
            </ul>
          </Card>

          <p className="text-xs text-gray-400 text-center">
            To change environment variables, update your{" "}
            <code className="bg-gray-50 px-1 rounded">.env</code> file or{" "}
            Vercel project settings, then redeploy.
          </p>
        </div>
      )}
    </div>
  );
}
