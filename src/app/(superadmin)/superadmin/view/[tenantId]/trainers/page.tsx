"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import { UserCog, CheckCircle2, XCircle, Info } from "lucide-react";

interface TrainerRecord {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  tier: string;
  createdAt: string;
  assignedAt: string;
  tenantActive: boolean;
}

interface PageProps {
  readonly params: Promise<{ tenantId: string }>;
}

const TIER_BADGE: Record<string, string> = {
  BASIC: "bg-slate-100 text-slate-600",
  PROFESSIONAL: "bg-blue-100 text-blue-700",
  PREMIUM: "bg-purple-100 text-purple-700",
};

export default function TenantViewTrainers({ params }: PageProps) {
  const { tenantId } = use(params);
  const [trainers, setTrainers] = useState<TrainerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/superadmin/view/${tenantId}/trainers`)
      .then((r) => r.json())
      .then((res: { success: boolean; data: TrainerRecord[]; error: string }) => {
        if (res.success) {
          setTrainers(res.data);
        } else {
          setError(res.error ?? "Failed to load trainers");
        }
      })
      .catch(() => setError("Network error — could not load trainers"))
      .finally(() => setLoading(false));
  }, [tenantId]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-48" />
        <div className="h-64 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-sm font-semibold text-red-700">Error loading trainers</p>
        <p className="text-xs text-red-500 mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Trainers</h1>
        <p className="text-sm text-slate-500 mt-1">
          {trainers.length} trainer(s) assigned to this tenant
        </p>
      </div>

      <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
        <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-blue-700">
          Viewing as Super Admin — read-only view. Trainer management is not available here.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left px-5 py-3 font-medium text-slate-500">Trainer</th>
              <th className="text-left px-5 py-3 font-medium text-slate-500">Tier</th>
              <th className="text-center px-5 py-3 font-medium text-slate-500">Active</th>
              <th className="text-right px-5 py-3 font-medium text-slate-500">Assigned</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {trainers.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <UserCog className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-slate-900">{t.name}</p>
                      <p className="text-xs text-slate-400">{t.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      TIER_BADGE[t.tier] ?? "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {t.tier}
                  </span>
                </td>
                <td className="px-5 py-3 text-center">
                  {t.isActive && t.tenantActive ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-400 mx-auto" />
                  )}
                </td>
                <td className="px-5 py-3 text-right text-slate-400 text-xs">
                  {new Date(t.assignedAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {trainers.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <UserCog className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No trainers assigned to this tenant.</p>
          </div>
        )}
      </div>
    </div>
  );
}
