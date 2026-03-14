import { SessionProvider } from "@/components/admin/SessionProvider";

export default function CorporateRootLayout({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
