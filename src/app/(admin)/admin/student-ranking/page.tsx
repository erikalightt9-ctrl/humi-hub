import type { Metadata } from "next";
import { StudentRankingAdmin } from "@/components/admin/StudentRankingAdmin";

export const metadata: Metadata = {
  title: "Student Ranking | VA Admin",
};

export default function AdminStudentRankingPage() {
  return <StudentRankingAdmin />;
}
