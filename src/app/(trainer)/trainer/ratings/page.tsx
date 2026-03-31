import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Star } from "lucide-react";
import { authOptions } from "@/lib/auth";
import {
  getRatingsByTrainer,
  getTrainerRatingStats,
} from "@/lib/repositories/trainer-rating.repository";

export const metadata: Metadata = { title: "My Ratings | HUMI Hub Trainer Portal" };
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderStars(rating: number): string {
  const full = Math.round(rating);
  return Array.from({ length: 5 }, (_, i) => (i < full ? "\u2605" : "\u2606")).join("");
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function TrainerRatingsPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as
    | (typeof session & { user: { id: string; role: string } })["user"]
    | undefined;

  if (!user || user.role !== "trainer") {
    redirect("/trainer/login");
  }

  const trainerId = user.id;

  const [ratings, stats] = await Promise.all([
    getRatingsByTrainer(trainerId),
    getTrainerRatingStats(trainerId),
  ]);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Ratings</h1>
        <p className="text-gray-500 text-sm mt-1">
          Feedback and ratings from your students.
        </p>
      </div>

      {/* Rating Summary */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="text-center sm:text-left">
            <p className="text-4xl font-bold text-gray-900">
              {stats.averageRating !== null
                ? stats.averageRating.toFixed(1)
                : "N/A"}
            </p>
            {stats.averageRating !== null && (
              <p className="text-amber-500 text-xl mt-1">
                {renderStars(stats.averageRating)}
              </p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              Based on {stats.totalRatings} rating
              {stats.totalRatings !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Rating distribution */}
          {stats.totalRatings > 0 && (
            <div className="flex-1 space-y-1.5">
              {[5, 4, 3, 2, 1].map((starLevel) => {
                const count = ratings.filter(
                  (r) => Math.round(r.rating) === starLevel,
                ).length;
                const pct =
                  stats.totalRatings > 0
                    ? Math.round((count / stats.totalRatings) * 100)
                    : 0;

                return (
                  <div key={starLevel} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-12 text-right">
                      {starLevel} star{starLevel !== 1 ? "s" : ""}
                    </span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-amber-400 h-2 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-8">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Ratings List */}
      {ratings.length > 0 ? (
        <div className="space-y-4">
          {ratings.map((rating) => (
            <div
              key={rating.id}
              className="bg-white rounded-xl border border-gray-200 p-5"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  {rating.student.avatarUrl ? (
                    <img
                      src={rating.student.avatarUrl}
                      alt={rating.student.name}
                      className="h-10 w-10 rounded-full object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center border border-ds-border">
                      <span className="text-sm font-medium text-blue-700">
                        {rating.student.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {rating.student.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDate(rating.createdAt)}
                    </p>
                  </div>
                </div>
                <span className="text-amber-500 text-sm">
                  {renderStars(rating.rating)}
                </span>
              </div>

              {rating.review ? (
                <p className="text-sm text-gray-600 mt-2 whitespace-pre-line">
                  {rating.review}
                </p>
              ) : (
                <p className="text-sm text-gray-400 italic mt-2">
                  No written review provided.
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <div className="bg-amber-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Star className="h-8 w-8 text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            No Ratings Yet
          </h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            You have not received any ratings yet. Ratings will appear here as
            your students provide feedback.
          </p>
        </div>
      )}
    </>
  );
}
