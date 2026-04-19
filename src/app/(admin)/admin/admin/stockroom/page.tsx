import { redirect } from "next/navigation";

export default function LegacyStockroomPage() {
  redirect("/admin/admin/inventory");
}
