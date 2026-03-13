import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import {
  Users,
  CalendarClock,
  Star,
  MessageSquare,
  Clock,
} from "lucide-react";
import { authOptions } from "@/lib/auth";
import {
  getTrainerDashboardStats,
  getTrainerSchedules,
} from "@/lib/repositories/trainer.repository";
import { getRatingsByTrainer } from "@/lib/repositories/trainer-rating.repository";
import { ScheduleStatusBadge } from "@/components/admin/ScheduleStatusBadge";

export const metadata: Metadata = { title: "Dashboard | HUMI Trainer Portal" };
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

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function TrainerDashboardPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as
    | (typeof session & { user: { id: string; role: string } })["user"]
    | undefined;

  if (!user || user.role !== "trainer") {
    redirect("/trainer/login");
  }

  const trainerId = user.id;

  const [stats, schedules, ratings] = await Promise.all([
    getTrainerDashboardStats(trainerId),
    getTrainerSchedules(trainerId),
    getRatingsByTrainer(trainerId),
  ]);

  const upcomingSchedules = schedules
    .filter((s) => s.status === "OPEN" || s.status === "FULL")
    .slice(0, 5);

  const recentRatings = ratings.slice(0, 5);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user.name ?? "Trainer"}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Here is an overview of your training activity.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-lg p-2 bg-blue-100 text-blue-600">
              <Users className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-gray-500">
              Total Students
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {stats.totalStudents}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-lg p-2 bg-indigo-100 text-indigo-600">
              <CalendarClock className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-gray-500">
              Active Schedules
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {stats.activeSchedules}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-lg p-2 bg-amber-100 text-amber-600">
              <Star className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-gray-500">
              Average Rating
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-gray-900">
              {stats.averageRating !== null
                ? stats.averageRating.toFixed(1)
                : "N/A"}
            </p>
            {stats.averageRating !== null && (
              <span className="text-amber-500 text-lg">
                {renderStars(stats.averageRating)}
              </span>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-lg p-2 bg-purple-100 text-purple-600">
              <MessageSquare className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-gray-500">
              Total Ratings
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {stats.totalRatings}
          </p>
        </div>
      </div>

      {/* Two-column: Upcoming Schedules + Recent Ratings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Schedules */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-blue-600" />
              Upcoming Schedules
            </h2>
            <Link
              href="/trainer/schedule"
              className="text-sm text-blue-600 hover:underline"
            >
              View all
            </Link>
          </div>

          {upcomingSchedules.length > 0 ? (
            <div className="space-y-3">
              {upcomingSchedules.map((schedule) => {
                const enrolled = schedule._count.students;
                return (
                  <div
                    key={schedule.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {schedule.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {schedule.course.title} &middot;{" "}
                        {formatDate(schedule.startDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-4 shrink-0">
                      <span className="text-xs text-gray-500">
                        {enrolled}/{schedule.maxCapacity}
                      </span>
                      <ScheduleStatusBadge status={schedule.status} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">
                No upcoming schedules at the moment.
              </p>
            </div>
          )}
        </div>

        {/* Recent Ratings */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" />
              Recent Ratings
            </h2>
            <Link
              href="/trainer/ratings"
              className="text-sm text-blue-600 hover:underline"
            >
              View all
            </Link>
          </div>

          {recentRatings.length > 0 ? (
            <div className="space-y-3">
              {recentRatings.map((rating) => (
                <div
                  key={rating.id}
                  className="p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {rating.student.name}
                    </span>
                    <span className="text-xs text-gray-400">
                      {timeAgo(rating.createdAt)}
                    </span>
                  </div>
                  <div className="text-amber-500 text-sm mb-1">
                    {renderStars(rating.rating)}
                  </div>
                  {rating.review && (
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {rating.review}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Star className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">
                No ratings received yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
