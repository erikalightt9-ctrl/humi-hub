import type { Metadata } from "next";
import { AttendanceLiveTable } from "@/components/admin/AttendanceLiveTable";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Attendance | HUMI Admin",
  description: "Live attendance tracking for HUMI Training Center students",
};

export default function AdminAttendancePage() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
        <p className="text-gray-500 text-sm mt-1">
          Live view of student clock-in and clock-out activity
        </p>
      </div>

      <AttendanceLiveTable />
    </>
  );
}
