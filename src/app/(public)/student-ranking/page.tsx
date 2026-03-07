import type { Metadata } from "next";
import { StudentRankingBoard } from "@/components/public/StudentRankingBoard";

export const metadata: Metadata = {
  title: "Student Ranking | VA Training Center",
  description:
    "See the top-performing virtual assistant students ranked by composite scores across career readiness, quizzes, assignments, and more.",
};

export default function StudentRankingPage() {
  return <StudentRankingBoard />;
}
