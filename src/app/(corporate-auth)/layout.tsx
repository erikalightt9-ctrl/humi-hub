import { SessionProvider } from "@/components/admin/SessionProvider";

export default function CorporateAuthLayout({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
