

import type { Metadata } from "next";
import { StudentRankingAdmin } from "@/components/admin/StudentRankingAdmin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {

  title: "Student Ranking | HUMI Admin",


};

export default function AdminStudentRankingPage() {

  return <StudentRankingAdmin />;
}
}
