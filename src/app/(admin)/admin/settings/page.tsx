import type { Metadata } from "next";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { Globe, Bell, Shield, Palette } from "lucide-react";
import {
  getPlatformSettings,
  getEmailSettings,
  getSecuritySettings,
  getBrandingSettings,
} from "@/lib/repositories/settings.repository";
import { GeneralSettingsForm } from "@/components/admin/settings/GeneralSettingsForm";
import { NotificationsSettingsForm } from "@/components/admin/settings/NotificationsSettingsForm";
import { SecuritySettingsForm } from "@/components/admin/settings/SecuritySettingsForm";
import { AppearanceSettingsForm } from "@/components/admin/settings/AppearanceSettingsForm";

export const metadata: Metadata = { title: "Settings | Admin" };

/* ------------------------------------------------------------------ */
/*  Tab definitions                                                    */
/* ------------------------------------------------------------------ */

const TABS = [
  { id: "general", label: "General", icon: Globe },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "appearance", label: "Appearance", icon: Palette },
] as const;

type TabId = (typeof TABS)[number]["id"];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

interface SettingsPageProps {
  readonly searchParams: Promise<{ tab?: string }>;
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const resolvedParams = await searchParams;
  const activeTab = (TABS.find((t) => t.id === resolvedParams.tab)?.id ?? "general") as TabId;

  // Load only what the active tab needs
  const [general, email, security, branding] = await Promise.all([
    activeTab === "general" ? getPlatformSettings() : null,
    activeTab === "notifications" ? getEmailSettings() : null,
    activeTab === "security" ? getSecuritySettings() : null,
    activeTab === "appearance" ? getBrandingSettings() : null,
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Platform configuration and preferences</p>
      </div>

      {/* Tab nav */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-0 -mb-px overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === activeTab;
            return (
              <Link
                key={tab.id}
                href={`/admin/settings?tab=${tab.id}`}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Tab content */}
      <div className="py-2">
        {activeTab === "general" && general && (
          <section>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">General Settings</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Site name, timezone, currency, and language used across the platform.
              </p>
            </div>
            <GeneralSettingsForm initialValues={general} />
          </section>
        )}

        {activeTab === "notifications" && email && (
          <section>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Notification Settings</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Configure SMTP to send system emails and manage which notifications are sent.
              </p>
            </div>
            <NotificationsSettingsForm
              initialValues={{ ...email, smtpPassword: email.smtpPassword ? "••••••••" : "" }}
            />
          </section>
        )}

        {activeTab === "security" && security && (
          <section>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Security Settings</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Password policies, session timeouts, and login attempt limits.
              </p>
            </div>
            <SecuritySettingsForm initialValues={security} />
          </section>
        )}

        {activeTab === "appearance" && branding && (
          <section>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Appearance Settings</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Brand colors, logo, favicon, and landing page customization.
              </p>
            </div>
            <AppearanceSettingsForm initialValues={branding} />
          </section>
        )}
      </div>
    </div>
  );
}
