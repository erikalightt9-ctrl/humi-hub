import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { CalendarClock, Clock, Users as UsersIcon } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { getTrainerSchedules } from "@/lib/repositories/trainer.repository";
import { ScheduleStatusBadge } from "@/components/admin/ScheduleStatusBadge";

export const metadata: Metadata = { title: "My Schedule | HUMI Hub Trainer Portal" };
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function TrainerSchedulePage() {
  const session = await getServerSession(authOptions);
  const user = session?.user as
    | (typeof session & { user: { id: string; role: string } })["user"]
    | undefined;

  if (!user || user.role !== "trainer") {
    redirect("/trainer/login");
  }

  const schedules = await getTrainerSchedules(user.id);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Schedule</h1>
        <p className="text-gray-500 text-sm mt-1">
          Your assigned training schedules and batches.
        </p>
      </div>

      {schedules.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schedules.map((schedule) => {
            const enrolled = schedule._count.students;
            const capacityPct =
              schedule.maxCapacity > 0
                ? Math.round((enrolled / schedule.maxCapacity) * 100)
                : 0;

            return (
              <div
                key={schedule.id}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 text-sm truncate flex-1">
                    {schedule.name}
                  </h3>
                  <ScheduleStatusBadge status={schedule.status} />
                </div>

                <p className="text-sm text-blue-700 font-medium mb-3">
                  {schedule.course.title}
                </p>

                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 shrink-0" />
                    <span>
                      {formatDate(schedule.startDate)} &ndash;{" "}
                      {formatDate(schedule.endDate)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 shrink-0" />
                    <span>
                      {formatTime(schedule.startDate)} &ndash;{" "}
                      {formatTime(schedule.endDate)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UsersIcon className="h-4 w-4 shrink-0" />
                    <span>
                      {enrolled} / {schedule.maxCapacity} students
                    </span>
                  </div>
                </div>

                {/* Capacity bar */}
                <div className="mt-3">
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        capacityPct >= 100
                          ? "bg-amber-500"
                          : capacityPct >= 75
                            ? "bg-blue-500"
                            : "bg-green-500"
                      }`}
                      style={{ width: `${Math.min(capacityPct, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {capacityPct}% capacity
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <div className="bg-blue-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <CalendarClock className="h-8 w-8 text-blue-700" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            No Schedules Assigned
          </h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            You have not been assigned to any training schedules yet. Contact
            your administrator for schedule assignments.
          </p>
        </div>
      )}
    </>
  );
}
