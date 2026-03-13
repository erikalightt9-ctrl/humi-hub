import type { Metadata } from "next";
import { Settings, Globe, Bell, Shield, Palette } from "lucide-react";

export const metadata: Metadata = { title: "Settings | HUMI Admin" };

export default function SettingsPage() {
  const sections = [
    {
      title: "General",
      description: "Site name, timezone, default currency, and language.",
      icon: Globe,
    },
    {
      title: "Notifications",
      description: "Email templates, SMTP settings, and notification preferences.",
      icon: Bell,
    },
    {
      title: "Security",
      description: "Password policies, session timeouts, and admin account management.",
      icon: Shield,
    },
    {
      title: "Appearance",
      description: "Logo, brand colors, and landing page customization.",
      icon: Palette,
    },
  ];

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">
          Platform configuration and preferences
        </p>
      </div>

      <div className="space-y-4">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <div
              key={section.title}
              className="bg-white rounded-xl border border-gray-200 p-6 flex items-start gap-4"
            >
              <div className="bg-gray-100 rounded-lg p-2.5">
                <Icon className="h-5 w-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{section.title}</h3>
                <p className="text-sm text-gray-500 mt-0.5">{section.description}</p>
              </div>
              <span className="text-xs text-gray-400 font-medium mt-1">Coming soon</span>
            </div>
          );
        })}
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-5">
        <div className="flex items-center gap-3">
          <Settings className="h-5 w-5 text-blue-600" />
          <div>
            <p className="text-sm font-medium text-blue-800">
              Settings are managed via environment variables for now
            </p>
            <p className="text-xs text-blue-600 mt-0.5">
              Edit your <code className="bg-blue-100 px-1 rounded">.env</code> file to update SMTP, admin email, and other configurations.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
