import { LifeBuoy, Activity, BookOpen, ExternalLink, CheckCircle2, AlertTriangle, Info } from "lucide-react";

const MOCK_EVENTS = [
  {
    id: "1",
    type: "Tenant Created",
    tenant: "Acme Corp",
    date: "Mar 28, 2026",
    status: "success",
  },
  {
    id: "2",
    type: "Plan Change",
    tenant: "TechStart PH",
    date: "Mar 27, 2026",
    status: "success",
  },
  {
    id: "3",
    type: "Login Issue",
    tenant: "GlobalLearn Inc",
    date: "Mar 26, 2026",
    status: "warning",
  },
  {
    id: "4",
    type: "Suspension",
    tenant: "OldCo Ltd",
    date: "Mar 25, 2026",
    status: "error",
  },
  {
    id: "5",
    type: "Tenant Created",
    tenant: "SwiftEdu",
    date: "Mar 24, 2026",
    status: "success",
  },
];

const STATUS_CONFIG = {
  success: {
    badge: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    label: "Resolved",
    icon: CheckCircle2,
    iconColor: "text-emerald-500",
  },
  warning: {
    badge: "bg-amber-50 text-amber-700 border border-amber-200",
    label: "Investigating",
    icon: AlertTriangle,
    iconColor: "text-amber-500",
  },
  error: {
    badge: "bg-red-50 text-red-600 border border-red-200",
    label: "Action Taken",
    icon: Info,
    iconColor: "text-red-500",
  },
} as const;

const UPTIME_METRICS = [
  { label: "API Gateway",      uptime: "99.98%", status: "operational" },
  { label: "Auth Service",     uptime: "99.95%", status: "operational" },
  { label: "Database",         uptime: "99.99%", status: "operational" },
  { label: "Email Delivery",   uptime: "99.80%", status: "operational" },
  { label: "File Storage",     uptime: "100%",   status: "operational" },
];

export default function SupportPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Platform Support</h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitor system health, tenant issues, and platform documentation.
        </p>
      </div>

      {/* 3 top cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Tenant Issues */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="p-2 rounded-lg bg-red-50">
              <LifeBuoy className="h-5 w-5 text-red-500" />
            </span>
            <h2 className="font-semibold text-slate-900">Tenant Issues</h2>
          </div>
          <p className="text-sm text-slate-500 mb-4">
            Review tenant bug reports, feature requests, and escalations.
          </p>
          <a
            href="#"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            View issue tracker
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="p-2 rounded-lg bg-emerald-50">
              <Activity className="h-5 w-5 text-emerald-500" />
            </span>
            <h2 className="font-semibold text-slate-900">System Status</h2>
          </div>
          <div className="space-y-2">
            {UPTIME_METRICS.map((metric) => (
              <div key={metric.label} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{metric.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-500">{metric.uptime}</span>
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Documentation */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="p-2 rounded-lg bg-blue-50">
              <BookOpen className="h-5 w-5 text-blue-500" />
            </span>
            <h2 className="font-semibold text-slate-900">Documentation</h2>
          </div>
          <p className="text-sm text-slate-500 mb-4">
            Platform docs, API reference, and tenant onboarding guides.
          </p>
          <a
            href="#"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            Open documentation
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* Recent Support Events */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">Recent Support Events</h2>
          <p className="text-xs text-slate-400 mt-0.5">Platform-wide activity log</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">
                Event
              </th>
              <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">
                Tenant
              </th>
              <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">
                Date
              </th>
              <th className="text-left px-5 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {MOCK_EVENTS.map((event) => {
              const config = STATUS_CONFIG[event.status as keyof typeof STATUS_CONFIG];
              const StatusIcon = config.icon;
              return (
                <tr key={event.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <StatusIcon className={`h-4 w-4 ${config.iconColor}`} />
                      <span className="font-medium text-slate-900">{event.type}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{event.tenant}</td>
                  <td className="px-5 py-3 text-slate-500 text-xs">{event.date}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${config.badge}`}
                    >
                      {config.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Placeholder notice */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-2">
        <Info className="h-4 w-4 text-slate-400 flex-shrink-0" />
        <p className="text-xs text-slate-500">
          Support events above are placeholder data. Live integration with your ticketing system
          and audit log is planned for Phase 2.
        </p>
      </div>
    </div>
  );
}
