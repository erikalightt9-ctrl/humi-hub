import { redirect } from "next/navigation";

/**
 * /login — Redirect to the unified portal page.
 * Tenant subdomains (e.g. acme.domain.com/login) are handled by tenant-proxy.ts
 * and rewritten to /tenant-login before reaching this file.
 */
export default function LoginPage() {
  redirect("/portal");
}
