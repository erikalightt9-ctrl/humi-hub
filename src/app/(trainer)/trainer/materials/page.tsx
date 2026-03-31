import type { Metadata } from "next";
import { TrainerMaterials } from "@/components/trainer/TrainerMaterials";

export const metadata: Metadata = { title: "Materials | Humi Hub Trainer Portal" };
export const dynamic = "force-dynamic";

export default function TrainerMaterialsPage() {
  return <TrainerMaterials />;
}
