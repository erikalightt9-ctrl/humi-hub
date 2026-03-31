import type { Metadata } from "next";
import { StudentRankingAdmin } from "@/components/admin/StudentRankingAdmin";

export const metadata: Metadata = {
  title: "Student Ranking | Humi Hub Admin",
};

export default function AdminStudentRankingPage() {
  return <StudentRankingAdmin />;
}
