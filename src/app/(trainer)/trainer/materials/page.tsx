import type { Metadata } from "next";
import { BookOpen } from "lucide-react";

export const metadata: Metadata = { title: "Materials | HUMI Trainer Portal" };

export default function TrainerMaterialsPage() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Training Materials
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage and share materials with your students.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
        <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <BookOpen className="h-8 w-8 text-blue-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Coming Soon
        </h2>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          You will be able to upload and manage course materials here. This
          feature is currently under development.
        </p>
      </div>
    </>
  );
}
