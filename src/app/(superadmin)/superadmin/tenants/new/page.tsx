import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "New Tenant — Super Admin",
};

export default function NewTenantPage() {
  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Onboard New Tenant</h1>
        <p className="text-gray-500 mt-1">
          Create a new organization with an admin account and default feature flags.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <strong>CLI Onboarding:</strong> Use the script below to create a tenant programmatically.
        </div>

        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Run on your server:</h2>
          <pre className="bg-gray-900 text-green-400 rounded-lg p-4 text-xs overflow-x-auto">
{`npx tsx --env-file=.env prisma/scripts/onboard-tenant.ts \\
  --name "Client Company Name" \\
  --subdomain "clientslug" \\
  --email "admin@client.com" \\
  --password "SecurePass123!" \\
  --plan PROFESSIONAL`}
          </pre>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <h3 className="font-medium text-gray-700 mb-1">Available Plans</h3>
            <ul className="space-y-1 text-gray-600">
              <li>• TRIAL — Basic features</li>
              <li>• STARTER — + Gamification</li>
              <li>• PROFESSIONAL — + AI + Jobs</li>
              <li>• ENTERPRISE — All features</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-700 mb-1">What gets created</h3>
            <ul className="space-y-1 text-gray-600">
              <li>• Organization record</li>
              <li>• Tenant admin account</li>
              <li>• Default feature flags</li>
              <li>• Subdomain reservation</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
