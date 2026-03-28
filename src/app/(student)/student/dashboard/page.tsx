import type { Metadata } from "next";
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getStudentBadges } from "@/lib/repositories/gamification.repository";
import { getStudentDashboardData } from "@/lib/repositories/student-dashboard.repository";
import Link from "next/link";
import { AnalyticsCard } from "@/components/admin/AnalyticsCard";
import {
  BookOpen,
  ClipboardList,
  FileCheck,
  Star,
  ArrowRight,
  CheckCircle2,
  Clock,
  CalendarDays,
} from "lucide-react";
import { ClockInWidget } from "@/components/student/ClockInWidget";

export const metadata: Metadata = { title: "Dashboard | HUMI Student" };

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHrs = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

const ACTIVITY_ICONS: Record<string, typeof BookOpen> = {
  lesson: CheckCircle2,
  quiz: ClipboardList,
  submission: FileCheck,
};

export default async function StudentDashboardPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as
    | (typeof session & { user: { id: string; role: string } })["user"]
    | undefined;

  if (!user || user.role !== "student") {
    redirect("/student/login");
  }

  const student = await prisma.student.findUnique({
    where: { id: user.id },
    include: { enrollment: { include: { course: true } } },
  });

  if (!student) redirect("/student/login");

  const courseId = student.enrollment.courseId;

  const [dashboard, badges] = await Promise.all([
    getStudentDashboardData(user.id, courseId),
    getStudentBadges(user.id),
  ]);

  return (
    <div className="space-y-6">
      {/* Clock In/Out Widget */}
      <ClockInWidget />

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold">Welcome back, {student.name}!</h1>
        <p className="text-blue-100 mt-1">
          {student.enrollment.course.title}
        </p>
        <p className="text-blue-200 text-xs mt-2">
          Enrolled {student.createdAt.toLocaleDateString("en-PH", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Progress Overview - 4 stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnalyticsCard
          title="Course Progress"
          value={`${dashboard.courseProgress.percent}%`}
          icon={BookOpen}
          colorClass="text-blue-400 bg-blue-900/40"
          subtitle={`${dashboard.courseProgress.completed} of ${dashboard.courseProgress.total} lessons`}
        />
        <AnalyticsCard
          title="Quiz Average"
          value={dashboard.quizAverage > 0 ? `${dashboard.quizAverage}%` : "--"}
          icon={ClipboardList}
          colorClass="text-emerald-400 bg-emerald-900/40"
          subtitle="Across all quiz attempts"
        />
        <AnalyticsCard
          title="Assignments"
          value={`${dashboard.assignmentsSubmitted}/${dashboard.totalAssignments}`}
          icon={FileCheck}
          colorClass="text-blue-400 bg-blue-900/40"
          subtitle="Submitted"
        />
        <AnalyticsCard
          title="Points"
          value={dashboard.totalPoints.toLocaleString()}
          icon={Star}
          colorClass="text-amber-400 bg-amber-900/40"
          subtitle="Total earned"
        />
      </div>

      {/* Course Progress Bar */}
      <div className="bg-ds-card rounded-xl border border-ds-border p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-ds-muted">Overall Course Progress</span>
          <span className="text-sm font-bold text-blue-400">{dashboard.courseProgress.percent}%</span>
        </div>
        <div className="w-full bg-ds-surface rounded-full h-3">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${dashboard.courseProgress.percent}%` }}
          />
        </div>
        <p className="text-xs text-ds-muted mt-2">
          {dashboard.courseProgress.completed} of {dashboard.courseProgress.total} lessons completed
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Continue Learning */}
        <div className="bg-ds-card rounded-xl border border-ds-border p-6">
          <h2 className="font-semibold text-ds-text mb-4">Continue Learning</h2>
          {dashboard.nextLesson ? (
            <Link
              href={`/student/courses/${courseId}/lessons/${dashboard.nextLesson.id}`}
              className="flex items-center justify-between p-4 border border-blue-800 bg-blue-900/20 rounded-lg hover:bg-blue-900/40 transition-colors group"
            >
              <div>
                <p className="font-medium text-ds-text">
                  Lesson {dashboard.nextLesson.order}: {dashboard.nextLesson.title}
                </p>
                {dashboard.nextLesson.durationMin > 0 && (
                  <p className="text-xs text-ds-muted mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {dashboard.nextLesson.durationMin} min
                  </p>
                )}
              </div>
              <ArrowRight className="h-5 w-5 text-blue-400 group-hover:translate-x-1 transition-transform" />
            </Link>
          ) : (
            <div className="p-4 bg-emerald-900/20 border border-emerald-800 rounded-lg text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
              <p className="font-medium text-emerald-400">All lessons completed!</p>
              <p className="text-xs text-emerald-400/70 mt-1">Congratulations on finishing the course content.</p>
            </div>
          )}
        </div>

        {/* Upcoming Assignments */}
        <div className="bg-ds-card rounded-xl border border-ds-border p-6">
          <h2 className="font-semibold text-ds-text mb-4">Upcoming Assignments</h2>
          {dashboard.upcomingAssignments.length > 0 ? (
            <div className="space-y-3">
              {dashboard.upcomingAssignments.map((a) => (
                <Link
                  key={a.id}
                  href={`/student/courses/${courseId}/assignments`}
                  className="flex items-center justify-between p-3 border border-ds-border rounded-lg hover:border-blue-700 hover:bg-ds-surface transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-ds-text">{a.title}</p>
                    <p className="text-xs text-ds-muted mt-0.5 flex items-center gap-1">
                      {a.dueDate ? (
                        <>
                          <CalendarDays className="h-3 w-3" />
                          Due {a.dueDate.toLocaleDateString("en-PH", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </>
                      ) : (
                        "No deadline"
                      )}
                    </p>
                  </div>
                  <span className="text-xs text-ds-muted">{a.maxPoints} pts</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ds-muted text-center py-4">
              No pending assignments. You&apos;re all caught up!
            </p>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-ds-card rounded-xl border border-ds-border p-6">
        <h2 className="font-semibold text-ds-text mb-4">Recent Activity</h2>
        {dashboard.recentActivity.length > 0 ? (
          <div className="space-y-3">
            {dashboard.recentActivity.map((activity) => {
              const Icon = ACTIVITY_ICONS[activity.type] ?? BookOpen;
              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 py-2 border-b border-ds-border last:border-0"
                >
                  <div className="w-8 h-8 rounded-full bg-ds-surface flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="h-4 w-4 text-ds-muted" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ds-text truncate">
                      {activity.title}
                    </p>
                    <p className="text-xs text-ds-muted">{activity.detail}</p>
                  </div>
                  <span className="text-xs text-ds-muted shrink-0">
                    {formatRelativeTime(activity.timestamp)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-ds-muted text-center py-4">
            No activity yet. Start your first lesson to get going!
          </p>
        )}
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <div className="bg-ds-card rounded-xl border border-ds-border p-6">
          <h2 className="font-semibold text-ds-text mb-4">Your Badges</h2>
          <div className="flex flex-wrap gap-3">
            {badges.map((sb) => (
              <div
                key={sb.id}
                className="flex items-center gap-2 bg-amber-900/20 border border-amber-800 rounded-lg px-3 py-2"
              >
                <span className="text-xl">{sb.badge.icon}</span>
                <div>
                  <div className="text-sm font-medium text-ds-text">{sb.badge.name}</div>
                  <div className="text-xs text-ds-muted">{sb.badge.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
