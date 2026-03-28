"use client";

import Link from "next/link";
import {
  GraduationCap,
  List,
  Star,
  UserPlus,
  ArrowRight,
  Lock,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Hub card                                                           */
/* ------------------------------------------------------------------ */

function HubCard({
  href,
  icon: Icon,
  label,
  description,
  accent,
}: {
  readonly href: string;
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly label: string;
  readonly description: string;
  readonly accent: string;
}) {
  return (
    <Link
      href={href}
      className="group bg-ds-card rounded-xl border border-ds-border p-5 flex flex-col gap-3 hover:border-ds-primary/50 hover:shadow-lg hover:shadow-black/20 transition-all"
    >
      <div className={`p-2.5 rounded-xl w-fit ${accent}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="font-semibold text-ds-text group-hover:text-blue-300 transition-colors text-sm">
          {label}
        </p>
        <p className="text-xs text-ds-muted mt-0.5 leading-relaxed">{description}</p>
      </div>
      <div className="flex items-center gap-1 text-xs text-blue-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity mt-auto">
        Open <ArrowRight className="h-3 w-3" />
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Coming Soon card                                                   */
/* ------------------------------------------------------------------ */

function SoonCard({
  icon: Icon,
  label,
  description,
  accent,
}: {
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly label: string;
  readonly description: string;
  readonly accent: string;
}) {
  return (
    <div
      title="Coming soon"
      className="bg-ds-card/40 rounded-xl border border-dashed border-ds-border p-5 flex flex-col gap-3 opacity-50 cursor-not-allowed"
    >
      <div className={`p-2.5 rounded-xl w-fit ${accent} opacity-60`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="font-semibold text-ds-muted text-sm">{label}</p>
        <p className="text-xs text-ds-muted/70 mt-0.5 leading-relaxed">{description}</p>
      </div>
      <div className="flex items-center gap-1 text-xs text-ds-muted font-medium mt-auto">
        <Lock className="h-3 w-3" />
        Coming Soon
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Trainers Hub                                                       */
/* ------------------------------------------------------------------ */

export default function TrainersHubPage() {
  return (
    <div className="space-y-8 max-w-4xl">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ds-text">Trainers</h1>
          <p className="text-sm text-ds-muted mt-0.5">
            View and manage trainers assigned to your organization
          </p>
        </div>
        <Link
          href="/corporate/trainers/list"
          className="flex items-center gap-2 px-4 py-2 bg-ds-primary text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
        >
          <List className="h-4 w-4" />
          View All Trainers
        </Link>
      </div>

      {/* Hub cards */}
      <div>
        <p className="text-xs font-semibold text-ds-muted uppercase tracking-wider mb-3">
          Actions
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <HubCard
            href="/corporate/trainers/list"
            icon={GraduationCap}
            label="All Trainers"
            description="View trainers assigned to your organization"
            accent="bg-indigo-900/50 text-indigo-400"
          />
          <SoonCard
            icon={UserPlus}
            label="Request Trainer"
            description="Submit a request for a new trainer assignment"
            accent="bg-blue-900/50 text-blue-400"
          />
          <SoonCard
            icon={Star}
            label="Ratings & Reviews"
            description="See trainer performance and student feedback"
            accent="bg-amber-900/50 text-amber-400"
          />
        </div>
      </div>

      {/* Quick tip */}
      <div className="bg-ds-surface rounded-xl border border-ds-border px-5 py-4 flex items-start gap-3">
        <GraduationCap className="h-4 w-4 text-ds-primary mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-ds-text">About trainers</p>
          <p className="text-xs text-ds-muted mt-0.5 leading-relaxed">
            Trainers are assigned to your organization by the platform administrator.
            Contact <span className="text-blue-400">support</span> to request changes or new trainer assignments.
          </p>
        </div>
      </div>
    </div>
  );
}
