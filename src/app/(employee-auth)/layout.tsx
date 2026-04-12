import { SessionProvider } from "@/components/admin/SessionProvider";

export default function EmployeeAuthLayout({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
