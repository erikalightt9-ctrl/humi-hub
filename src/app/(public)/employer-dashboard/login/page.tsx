import type { Metadata } from "next";
import { EmployerAuthForm } from "@/components/employer/EmployerAuthForm";

export const metadata: Metadata = { title: "Employer Login — HUMI Hub" };

export default function EmployerLoginPage() {
  return <EmployerAuthForm defaultMode="login" />;
}
