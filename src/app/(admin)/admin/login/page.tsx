import { Suspense } from "react";
import { GraduationCap } from "lucide-react";
import { LoginForm } from "@/components/admin/LoginForm";

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-blue-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <div className="bg-blue-800 rounded-xl p-3">
              <GraduationCap className="h-8 w-8 text-blue-300" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Login</h1>
          <p className="text-blue-300 text-sm mt-1">VA Training Center Dashboard</p>
        </div>
        <Suspense fallback={<div className="bg-white rounded-2xl p-8 text-center text-gray-500">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
