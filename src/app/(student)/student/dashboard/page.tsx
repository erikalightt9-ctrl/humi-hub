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

export const metadata: Metadata = { title: "Dashboard | Humi Hub Student" };

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

  // Fetch tenant branding if student belongs to an organization
  const org = student.organizationId
    ? await prisma.organization.findUnique({
        where: { id: student.organizationId },
        select: { name: true, siteName: true, logoUrl: true, primaryColor: true },
      })
    : null;

  const orgDisplayName = org?.siteName ?? org?.name ?? null;
  const orgPrimaryColor = org?.primaryColor ?? "#2563eb";

  const [dashboard, badges] = await Promise.all([
    getStudentDashboardData(user.id, courseId),
    getStudentBadges(user.id),
  ]);

  return (
    <div className="space-y-6">
      {/* Clock In/Out Widget */}
      <ClockInWidget />

      {/* Welcome Banner */}
      <div
        className="rounded-xl p-6 text-white"
        style={{
          background: `linear-gradient(135deg, ${orgPrimaryColor} 0%, ${orgPrimaryColor}cc 100%)`,
        }}
      >
        {/* Org branding row */}
        {orgDisplayName && (
          <div className="flex items-center gap-2 mb-3">
            {org?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={org.logoUrl}
                alt={orgDisplayName}
                className="h-6 w-auto object-contain brightness-0 invert"
              />
            ) : null}
            <span className="text-xs font-medium text-white/75">{orgDisplayName}</span>
          </div>
        )}
        <h1 className="text-2xl font-bold">Welcome back, {student.name}!</h1>
        <p className="text-white/85 mt-1">
          {student.enrollment.course.title}
        </p>
        <p className="text-white/60 text-xs mt-2">
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
          colorClass="text-blue-700 bg-blue-50"
          subtitle={`${dashboard.courseProgress.completed} of ${dashboard.courseProgress.total} lessons`}
        />
        <AnalyticsCard
          title="Quiz Average"
          value={dashboard.quizAverage > 0 ? `${dashboard.quizAverage}%` : "--"}
          icon={ClipboardList}
          colorClass="text-emerald-600 bg-emerald-50"
          subtitle="Across all quiz attempts"
        />
        <AnalyticsCard
          title="Assignments"
          value={`${dashboard.assignmentsSubmitted}/${dashboard.totalAssignments}`}
          icon={FileCheck}
          colorClass="text-blue-700 bg-blue-50"
          subtitle="Submitted"
        />
        <AnalyticsCard
          title="Points"
          value={dashboard.totalPoints.toLocaleString()}
          icon={Star}
          colorClass="text-amber-600 bg-amber-50"
          subtitle="Total earned"
        />
      </div>

      {/* Course Progress Bar */}
      <div className="bg-ds-card rounded-xl border border-ds-border p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-ds-muted">Overall Course Progress</span>
          <span className="text-sm font-bold text-blue-700">{dashboard.courseProgress.percent}%</span>
        </div>
        <div className="w-full bg-blue-50 rounded-full h-3">
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
              className="flex items-center justify-between p-4 border border-blue-200 bg-blue-50 rounded-lg hover:bg-blue-50 transition-colors group"
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
              <ArrowRight className="h-5 w-5 text-blue-700 group-hover:translate-x-1 transition-transform" />
            </Link>
          ) : (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
              <p className="font-medium text-emerald-600">All lessons completed!</p>
              <p className="text-xs text-emerald-600/70 mt-1">Congratulations on finishing the course content.</p>
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
                  className="flex items-center justify-between p-3 border border-ds-border rounded-lg hover:border-blue-700 hover:bg-slate-100 transition-colors"
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
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 mt-0.5">
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
                className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2"
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
