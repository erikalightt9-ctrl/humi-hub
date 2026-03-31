import type { Metadata } from "next";
import { EmployerAuthForm } from "@/components/employer/EmployerAuthForm";

export const metadata: Metadata = { title: "Employer Registration — HUMI Hub" };

export default function EmployerRegisterPage() {
  return <EmployerAuthForm defaultMode="register" />;
}
