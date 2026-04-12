import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { SessionProvider } from "@/components/admin/SessionProvider";

export default async function EmployeePortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: string; mustChangePassword?: boolean } | undefined;

  if (!session || user?.role !== "employee") {
    redirect("/employee/login");
  }

  return <SessionProvider>{children}</SessionProvider>;
}
