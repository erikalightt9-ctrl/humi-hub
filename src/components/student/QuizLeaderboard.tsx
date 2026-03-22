"use client";

import { useState, useEffect } from "react";
import { Trophy, Medal, Star } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  completedAt: string;
  isCurrentUser: boolean;
}

// ---------------------------------------------------------------------------
// Rank icon helper
// ---------------------------------------------------------------------------

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return <Trophy className="h-5 w-5 text-yellow-400" aria-label="1st place" />;
  if (rank === 2)
    return <Medal className="h-5 w-5 text-gray-400" aria-label="2nd place" />;
  if (rank === 3)
    return <Star className="h-5 w-5 text-amber-600" aria-label="3rd place" />;
  return (
    <span className="text-sm font-semibold text-gray-500 w-5 text-center">
      {rank}
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
          setError(data.error ?? "Failed to load leaderboard");
        }
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }, [courseId]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
        <div className="h-5 w-32 bg-gray-200 rounded mb-4" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 bg-gray-100 rounded-lg mb-2" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-sm text-gray-500">
        {error}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-sm text-gray-500">
        No quiz attempts yet. Be the first to complete a quiz!
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <Trophy className="h-5 w-5 text-yellow-400" />
        <h3 className="font-semibold text-gray-800">Course Leaderboard</h3>
        <span className="ml-auto text-xs text-gray-400">Top {entries.length}</span>
      </div>

      <ul className="divide-y divide-gray-100">
        {entries.map((entry) => (
          <li
            key={entry.rank}
            className={`flex items-center gap-3 px-5 py-3 transition-colors ${
              entry.isCurrentUser
                ? "bg-blue-50 border-l-4 border-blue-500"
                : entry.rank <= 3
                ? "bg-amber-50/40"
                : "hover:bg-gray-50"
            }`}
          >
            {/* Rank icon */}
            <div className="w-6 flex items-center justify-center shrink-0">
              <RankBadge rank={entry.rank} />
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0">
              <span
                className={`text-sm truncate ${
                  entry.isCurrentUser
                    ? "font-semibold text-blue-700"
                    : "text-gray-700"
                }`}
              >
                {entry.name}
                {entry.isCurrentUser && (
                  <span className="ml-1.5 text-[10px] font-bold bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">
                    You
                  </span>
                )}
              </span>
            </div>

            {/* Score */}
            <div
              className={`text-sm font-bold tabular-nums ${
                entry.score >= 90
                  ? "text-green-600"
                  : entry.score >= 70
                  ? "text-yellow-600"
                  : "text-red-500"
              }`}
            >
              {entry.score}%
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
