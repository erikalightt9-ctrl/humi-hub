import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "New Tenant — Super Admin",
};

export default function NewTenantPage() {
  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ds-text">Onboard New Tenant</h1>
        <p className="text-ds-muted mt-1">
          Create a new organization with an admin account and default feature flags.
        </p>
      </div>

      <div className="bg-ds-card rounded-xl border border-ds-border p-6 space-y-4">
        <div className="bg-violet-900/20 border border-violet-800 rounded-xl p-4 text-sm text-violet-300">
          <strong>CLI Onboarding:</strong> Use the script below to create a tenant programmatically.
        </div>

        <div>
          <h2 className="text-sm font-semibold text-ds-text mb-2">Run on your server:</h2>
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
            <h3 className="font-medium text-ds-text mb-1">Available Plans</h3>
            <ul className="space-y-1 text-ds-muted">
              <li>• TRIAL — Basic features</li>
              <li>• STARTER — + Gamification</li>
              <li>• PROFESSIONAL — + AI + Jobs</li>
              <li>• ENTERPRISE — All features</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-ds-text mb-1">What gets created</h3>
            <ul className="space-y-1 text-ds-muted">
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
