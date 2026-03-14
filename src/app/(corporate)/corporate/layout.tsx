import { CorporateLayout } from "@/components/corporate/CorporateLayout";

export default function CorporatePagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CorporateLayout>{children}</CorporateLayout>;
}
