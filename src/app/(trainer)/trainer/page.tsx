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
  ArrowRight,
  ClipboardList,
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
  return Array.from({ length: 5 }, (_, i) => (i < full ? "★" : "☆")).join("");
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
  return `${Math.floor(hours / 24)}d ago`;
}

// ---------------------------------------------------------------------------
// Clickable stat card (same style as admin dashboard)
// ---------------------------------------------------------------------------

interface StatCardProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  bgClass: string;
  label: string;
  value: number | string;
  sub?: string;
}

function StatCard({ href, icon: Icon, iconClass, bgClass, label, value, sub }: StatCardProps) {
  return (
    <Link
      href={href}
      className="group bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-start gap-4 hover:border-blue-300 hover:shadow-md transition-all"
    >
      <div className={`rounded-xl p-2.5 shrink-0 ${bgClass}`}>
        <Icon className={`h-5 w-5 ${iconClass}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
        <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1.5">{sub}</p>}
      </div>
      <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-blue-500 transition-colors self-center shrink-0" />
    </Link>
  );
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
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user.name ?? "Trainer"}
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Your training activity — click any card to view details
        </p>
      </div>

      {/* ── Clickable Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        <StatCard
          href="/trainer/students"
          icon={Users}
          iconClass="text-blue-600"
          bgClass="bg-blue-100"
          label="My Students"
          value={stats.totalStudents}
          sub="Across all courses"
        />
        <StatCard
          href="/trainer/schedule"
          icon={CalendarClock}
          iconClass="text-indigo-600"
          bgClass="bg-indigo-100"
          label="Active Schedules"
          value={stats.activeSchedules}
          sub="Currently running"
        />
        <StatCard
          href="/trainer/ratings"
          icon={Star}
          iconClass="text-amber-600"
          bgClass="bg-amber-100"
          label="Avg Rating"
          value={
            stats.averageRating !== null
              ? `${stats.averageRating.toFixed(1)} ${renderStars(stats.averageRating)}`
              : "N/A"
          }
          sub="From student feedback"
        />
        <StatCard
          href="/trainer/ratings"
          icon={MessageSquare}
          iconClass="text-purple-600"
          bgClass="bg-purple-100"
          label="Total Ratings"
          value={stats.totalRatings}
          sub="Reviews received"
        />
      </div>

      {/* ── Two-column: Schedules + Ratings ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Upcoming Schedules */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-blue-600" />
              Upcoming Schedules
            </h2>
            <Link href="/trainer/schedule" className="text-xs text-blue-600 hover:underline">
              View all →
            </Link>
          </div>

          {upcomingSchedules.length > 0 ? (
            <div className="space-y-2">
              {upcomingSchedules.map((schedule) => (
                <Link
                  key={schedule.id}
                  href="/trainer/schedule"
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-blue-50 hover:border-blue-100 border border-transparent transition-all group"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                      {schedule.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {schedule.course.title} · {formatDate(schedule.startDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-4 shrink-0">
                    <span className="text-xs text-gray-500">
                      {schedule._count.students}/{schedule.maxCapacity}
                    </span>
                    <ScheduleStatusBadge status={schedule.status} />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <Clock className="h-8 w-8 mb-3 opacity-40" />
              <p className="text-sm">No upcoming schedules</p>
            </div>
          )}
        </div>

        {/* Recent Ratings */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              Recent Ratings
            </h2>
            <Link href="/trainer/ratings" className="text-xs text-blue-600 hover:underline">
              View all →
            </Link>
          </div>

          {recentRatings.length > 0 ? (
            <div className="space-y-2">
              {recentRatings.map((rating) => (
                <Link
                  key={rating.id}
                  href="/trainer/ratings"
                  className="block p-3 bg-gray-50 rounded-xl hover:bg-amber-50 border border-transparent hover:border-amber-100 transition-all"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {rating.student.name}
                    </span>
                    <span className="text-xs text-gray-400">{timeAgo(rating.createdAt)}</span>
                  </div>
                  <div className="text-amber-500 text-sm mb-1">
                    {renderStars(rating.rating)}
                  </div>
                  {rating.review && (
                    <p className="text-xs text-gray-500 line-clamp-2">{rating.review}</p>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <Star className="h-8 w-8 mb-3 opacity-40" />
              <p className="text-sm">No ratings received yet</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Quick Links ── */}
      <div className="flex flex-wrap gap-3 mt-5">
        <Link
          href="/trainer/courses"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          <ClipboardList className="h-4 w-4" />
          My Courses
        </Link>
        <Link
          href="/trainer/submissions"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          <ClipboardList className="h-4 w-4" />
          Grade Submissions
        </Link>
        <Link
          href="/trainer/messages"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-800 text-white rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors"
        >
          <MessageSquare className="h-4 w-4" />
          Messages
        </Link>
      </div>
    </>
  );
}
