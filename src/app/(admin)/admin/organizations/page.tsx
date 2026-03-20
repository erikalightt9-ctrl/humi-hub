


"use client";
import { Building2 } from "lucide-react";
import { OrganizationManager } from "@/components/admin/OrganizationManager";

export const dynamic = "force-dynamic";

export default function AdminOrganizationsPage() {

  return (

    <div className="space-y-6">

      <div>

        <div className="flex items-center gap-3 mb-2">

          <div className="bg-purple-100 rounded-lg p-2">

            <Building2 className="h-5 w-5 text-purple-700" />

          </div>

          <div>

            <h1 className="text-2xl font-bold text-gray-900">Organizations</h1>

            <p className="text-sm text-gray-500">

              Manage corporate upskilling organizations and their managers

            </p>

          </div>

        </div>


      </div>

      <OrganizationManager />

    </div>

  );
}
}
