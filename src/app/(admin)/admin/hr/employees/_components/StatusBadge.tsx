"use client";

/* ------------------------------------------------------------------ */
/*  Status Badge                                                        */
/* ------------------------------------------------------------------ */

const STATUS_CFG: Record<string, { label: string; dot: string; cls: string; tip: string }> = {
  ACTIVE:     { label: "Active",     dot: "bg-emerald-500 animate-pulse", cls: "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800", tip: "Currently employed" },
  ON_LEAVE:   { label: "On Leave",   dot: "bg-amber-500",   cls: "bg-amber-50   text-amber-700   border border-amber-200   dark:bg-amber-950/60   dark:text-amber-300   dark:border-amber-800",   tip: "Currently on approved leave" },
  AWOL:       { label: "AWOL",       dot: "bg-red-500",     cls: "bg-red-50     text-red-700     border border-red-200     dark:bg-red-950/60     dark:text-red-300     dark:border-red-800",     tip: "Absent without official leave" },
  RESIGNED:   { label: "Resigned",   dot: "bg-slate-400",   cls: "bg-slate-100  text-slate-500   border border-slate-200   dark:bg-slate-800      dark:text-slate-400   dark:border-slate-700",   tip: "Voluntarily resigned" },
  TERMINATED: { label: "Terminated", dot: "bg-red-700",     cls: "bg-red-100    text-red-800     border border-red-300     dark:bg-red-950/60     dark:text-red-300     dark:border-red-700",     tip: "Employment terminated" },
  INACTIVE:   { label: "Inactive",   dot: "bg-slate-300",   cls: "bg-slate-100  text-slate-400   border border-slate-200   dark:bg-slate-800      dark:text-slate-500   dark:border-slate-700",   tip: "Inactive record" },
};

interface StatusBadgeProps {
  status: string;
  tooltip?: string;
}

export function StatusBadge({ status, tooltip }: StatusBadgeProps) {
  const cfg = STATUS_CFG[status] ?? {
    label: status.replace(/_/g, " "),
    dot: "bg-slate-300",
    cls: "bg-slate-100 text-slate-500 border border-slate-200",
    tip: "",
  };

  return (
    <span
      title={tooltip ?? cfg.tip}
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${cfg.cls}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Employment Type Badge                                               */
/* ------------------------------------------------------------------ */

const TYPE_CFG: Record<string, { label: string; cls: string; tip: string }> = {
  REGULAR:      { label: "Regular",      cls: "bg-blue-50    text-blue-700    border border-blue-200    dark:bg-blue-950/60    dark:text-blue-300    dark:border-blue-800",    tip: "Regular / permanent employee" },
  PROBATIONARY: { label: "Probationary", cls: "bg-violet-50  text-violet-700  border border-violet-200  dark:bg-violet-950/60  dark:text-violet-300  dark:border-violet-800",  tip: "Currently on probationary period" },
  CONTRACTUAL:  { label: "Contractual",  cls: "bg-orange-50  text-orange-700  border border-orange-200  dark:bg-orange-950/60  dark:text-orange-300  dark:border-orange-800",  tip: "Fixed-term contractual employee" },
  PART_TIME:    { label: "Part-time",    cls: "bg-cyan-50    text-cyan-700    border border-cyan-200    dark:bg-cyan-950/60    dark:text-cyan-300    dark:border-cyan-800",    tip: "Part-time employment" },
  INTERN:       { label: "Intern",       cls: "bg-pink-50    text-pink-700    border border-pink-200    dark:bg-pink-950/60    dark:text-pink-300    dark:border-pink-800",    tip: "Internship or OJT" },
};

interface TypeBadgeProps {
  type: string;
  tooltip?: string;
}

export function TypeBadge({ type, tooltip }: TypeBadgeProps) {
  const cfg = TYPE_CFG[type] ?? {
    label: type.replace(/_/g, " "),
    cls: "bg-slate-100 text-slate-500 border border-slate-200",
    tip: "",
  };

  return (
    <span
      title={tooltip ?? cfg.tip}
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${cfg.cls}`}
    >
      {cfg.label}
    </span>
  );
}
