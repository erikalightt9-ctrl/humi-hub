import type { Metadata } from "next";
import { EmployerDashboard } from "@/components/public/EmployerDashboard";

export const metadata: Metadata = {
  title: "Hire Our VAs | HUMI Training Center",
  description:
    "Browse our top-rated, AI-assessed virtual assistant graduates. View verified scores, certifications, and portfolios to find your ideal VA hire.",
};

export default function EmployerDashboardPage() {
  return <EmployerDashboard />;
}
