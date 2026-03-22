"use client";

import { useState, useEffect } from "react";
import { Trophy } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Badge = "gold" | "silver" | "bronze" | null;

interface LeaderboardEntry {
  rank: number;
  name: string;       // initials in student view, full name in trainer view
  score: number;
  completedAt: string;
  isCurrentUser: boolean;
  badge: Badge;
}

// ---------------------------------------------------------------------------
// Badge icon — emoji medals for clean, recognisable top-3 indicators
// ---------------------------------------------------------------------------

const BADGE_LABEL: Record<NonNullable<Badge>, string> = {
  gold:   "🥇",
  silver: "🥈",
  bronze: "🥉",
};

const BADGE_ROW_BG: Record<NonNullable<Badge>, string> = {
  gold:   "bg-yellow-50/60",
  silver: "bg-gray-50/60",
  bronze: "bg-amber-50/60",
};

function BadgeIcon({ badge }: { badge: Badge }) {
  if (badge) {
    return (
      <span className="text-lg leading-none" role="img" aria-label={badge}>
        {BADGE_LABEL[badge]}
      </span>
    );
  }
  return (
    <span className="text-sm font-semibold text-gray-400 w-6 text-center tabular-nums">
      {/* rank number is shown in the list item instead */}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function QuizLeaderboard({ courseId }: { courseId: string }) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/student/courses/${courseId}/leaderboard`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setEntries(data.data as LeaderboardEntry[]);
        } else {
          // Silently hide when forbidden (e.g. not enrolled yet)
          if (data.error?.startsWith("Forbidden")) {
            setEntries([]);
          } else {
            setError(data.error ?? "Failed to load leaderboard");
          }
        }
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }, [courseId]);

  // -------------------------------------------------------------------------
  // Loading skeleton
  // -------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3 animate-pulse">
        <div className="h-4 w-36 bg-gray-200 rounded" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-9 bg-gray-100 rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 text-sm text-gray-400">
        {error}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 text-sm text-gray-400">
        No attempts yet — be the first to complete a quiz!
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <Trophy className="h-4 w-4 text-yellow-400 shrink-0" />
        <h3 className="font-semibold text-gray-800 text-sm">Leaderboard</h3>
        <span className="ml-auto text-xs text-gray-400">Top {entries.length}</span>
      </div>

      <ul className="divide-y divide-gray-100">
        {entries.map((entry) => {
          const rowBg = entry.isCurrentUser
            ? "bg-blue-50 border-l-4 border-l-blue-500"
            : entry.badge
            ? BADGE_ROW_BG[entry.badge]
            : "hover:bg-gray-50";

          return (
            <li
              key={entry.rank}
              className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${rowBg}`}
            >
              {/* Badge or rank number */}
              <div className="w-7 flex items-center justify-center shrink-0">
                {entry.badge ? (
                  <BadgeIcon badge={entry.badge} />
                ) : (
                  <span className="text-xs font-semibold text-gray-400 tabular-nums">
                    {entry.rank}
                  </span>
                )}
              </div>

              {/* Name (initials in student view, full name in trainer view) */}
              <div className="flex-1 min-w-0 flex items-center gap-1.5">
                <span
                  className={`text-sm truncate ${
                    entry.isCurrentUser
                      ? "font-semibold text-blue-700"
                      : entry.badge
                      ? "font-medium text-gray-800"
                      : "text-gray-600"
                  }`}
                >
                  {entry.name}
                </span>
                {entry.isCurrentUser && (
                  <span className="shrink-0 text-[9px] font-bold bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                    You
                  </span>
                )}
              </div>

              {/* Score */}
              <span
                className={`text-sm font-bold tabular-nums shrink-0 ${
                  entry.score >= 90
                    ? "text-green-600"
                    : entry.score >= 70
                    ? "text-yellow-600"
                    : "text-red-500"
                }`}
              >
                {entry.score}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
