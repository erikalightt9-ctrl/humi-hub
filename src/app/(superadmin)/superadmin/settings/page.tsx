import {
  Settings,
  Globe,
  Mail,
  Shield,
  Database,
  CreditCard,
  Bell,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-ds-card rounded-xl border border-ds-border p-6 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4 text-ds-muted" />
        <h2 className="font-semibold text-ds-text">{title}</h2>
      </div>
      {description && <p className="text-xs text-ds-muted -mt-2">{description}</p>}
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm border-b border-ds-border pb-2 last:border-0 last:pb-0">
      <span className="text-ds-muted">{label}</span>
      <span className="text-ds-text font-medium font-mono text-xs">{value}</span>
    </div>
  );
}

function EnvBadge({ set }: { set: boolean }) {
  return set ? (
    <span className="inline-flex items-center gap-1 text-xs bg-emerald-900/40 text-emerald-400 px-2 py-0.5 rounded-full font-medium">
      ✓ Set
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs bg-red-900/40 text-red-400 px-2 py-0.5 rounded-full font-medium">
      ✗ Missing
    </span>
  );
}

// ---------------------------------------------------------------------------
// Page (server component — reads env vars server-side only)
// ---------------------------------------------------------------------------

export default function SuperAdminSettingsPage() {
  // Read env at render time — values are never exposed to the client bundle
  const env = {
    rootDomain: process.env.ROOT_DOMAIN ?? "(not set)",
    nextauthUrl: process.env.NEXTAUTH_URL ?? "(not set)",
    nextauthSecret: !!process.env.NEXTAUTH_SECRET,
    databaseUrl: !!process.env.DATABASE_URL,
    gmailUser: process.env.GMAIL_USER ? `${process.env.GMAIL_USER.slice(0, 4)}…` : "(not set)",
    gmailPass: !!process.env.GMAIL_APP_PASSWORD,
    emailFrom: process.env.EMAIL_FROM_ADDRESS ?? "(not set)",
    emailFromName: process.env.EMAIL_FROM_NAME ?? "(not set)",
    supportEmail: process.env.SUPPORT_EMAIL ?? "(not set)",
    stripeKey: !!process.env.STRIPE_SECRET_KEY,
    stripeWebhook: !!process.env.STRIPE_WEBHOOK_SECRET,
    nodeEnv: process.env.NODE_ENV ?? "development",
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="bg-violet-900/40 rounded-lg p-2">
            <Settings className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-ds-text">Platform Settings</h1>
            <p className="text-sm text-ds-muted">
              Read-only view of environment configuration. Edit values in your{" "}
              <code className="text-xs bg-ds-surface px-1 rounded">.env</code> file or deployment secrets.
            </p>
          </div>
        </div>
      </div>

      {/* Runtime */}
      <Section icon={Globe} title="Runtime">
        <div className="space-y-2">
          <Row label="NODE_ENV"        value={env.nodeEnv} />
          <Row label="ROOT_DOMAIN"     value={env.rootDomain} />
          <Row label="NEXTAUTH_URL"    value={env.nextauthUrl} />
        </div>
      </Section>

      {/* Secrets status */}
      <Section
        icon={Shield}
        title="Secrets"
        description="Sensitive values are not displayed — only whether they are set."
      >
        <div className="space-y-3">
          {[
            { label: "NEXTAUTH_SECRET",      set: env.nextauthSecret },
            { label: "DATABASE_URL",         set: env.databaseUrl },
            { label: "GMAIL_APP_PASSWORD",   set: env.gmailPass },
            { label: "STRIPE_SECRET_KEY",    set: env.stripeKey },
            { label: "STRIPE_WEBHOOK_SECRET",set: env.stripeWebhook },
          ].map(({ label, set }) => (
            <div key={label} className="flex items-center justify-between text-sm">
              <span className="text-ds-muted font-mono text-xs">{label}</span>
              <EnvBadge set={set} />
            </div>
          ))}
        </div>
      </Section>

      {/* Email */}
      <Section
        icon={Mail}
        title="Email (SMTP / Gmail)"
        description="Transactional email configuration used for welcome emails, password resets, and notifications."
      >
        <div className="space-y-2">
          <Row label="GMAIL_USER"        value={env.gmailUser} />
          <Row label="EMAIL_FROM_ADDRESS" value={env.emailFrom} />
          <Row label="EMAIL_FROM_NAME"   value={env.emailFromName} />
          <Row label="SUPPORT_EMAIL"     value={env.supportEmail} />
        </div>
      </Section>

      {/* Database */}
      <Section icon={Database} title="Database">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-ds-muted font-mono text-xs">DATABASE_URL</span>
            <EnvBadge set={env.databaseUrl} />
          </div>
          <p className="text-xs text-ds-muted">
            Schema migrations are managed with Prisma. Run{" "}
            <code className="bg-ds-surface px-1 rounded">npx prisma migrate deploy</code> to apply pending migrations.
          </p>
        </div>
      </Section>

      {/* Billing */}
      <Section
        icon={CreditCard}
        title="Billing (Stripe)"
        description="Stripe integration for tenant subscription payments."
      >
        <div className="space-y-3">
          {[
            { label: "STRIPE_SECRET_KEY",     set: env.stripeKey },
            { label: "STRIPE_WEBHOOK_SECRET", set: env.stripeWebhook },
          ].map(({ label, set }) => (
            <div key={label} className="flex items-center justify-between text-sm">
              <span className="text-ds-muted font-mono text-xs">{label}</span>
              <EnvBadge set={set} />
            </div>
          ))}
          <p className="text-xs text-ds-muted">
            Webhook endpoint: <code className="bg-ds-surface px-1 rounded">/api/webhooks/stripe</code>
          </p>
        </div>
      </Section>

      {/* Notifications info */}
      <Section
        icon={Bell}
        title="Notifications"
        description="Platform-level notification triggers."
      >
        <ul className="text-sm text-ds-muted space-y-1.5 list-disc list-inside">
          <li>Tenant welcome email on creation</li>
          <li>Admin credential emails for new managers</li>
          <li>Student enrollment confirmation emails</li>
          <li>Password reset emails</li>
          <li>Support ticket notifications</li>
        </ul>
        <p className="text-xs text-slate-400 mt-2">
          All transactional emails use the SMTP settings above. Templates live in{" "}
          <code className="bg-ds-surface px-1 rounded">src/lib/email/</code>.
        </p>
      </Section>
    </div>
  );
}
