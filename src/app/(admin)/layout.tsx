import { SessionProvider } from "@/components/admin/SessionProvider";

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
