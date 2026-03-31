"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface TenantInfo {
  id: string;
  name: string;
  siteName?: string | null;
  subdomain?: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  tagline?: string | null;
  isActive: boolean;
}

export default function TenantDirectAccessPage() {
  const { tenant_id } = useParams<{ tenant_id: string }>();
  const router = useRouter();
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function resolveTenant() {
      const res = await fetch(`/api/t/${tenant_id}`);
      if (!res.ok) {
        setError("Training platform not found or is no longer active.");
        return;
      }
      const json = await res.json();
      const data: TenantInfo = json.data;
      setTenant(data);

      // If tenant has a subdomain, redirect to it
      if (data.subdomain) {
        const host = window.location.host;
        // Remove any existing subdomain to get base domain
        const parts = host.split(".");
        const baseDomain =
          parts.length >= 2 ? parts.slice(-2).join(".") : host;
        const tenantUrl = `${window.location.protocol}//${data.subdomain}.${baseDomain}`;
        window.location.href = tenantUrl;
        return;
      }

      // No subdomain — redirect to tenant-login with slug fallback
      router.replace(`/tenant-login?slug=${encodeURIComponent(data.id)}`);
    }

    resolveTenant();
  }, [tenant_id, router]);

  const primary = tenant?.primaryColor ?? "#1e3a8a";

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Platform Not Found</h1>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <a href="/" className="text-blue-600 text-sm hover:underline">← Back to HUMI Hub</a>
        </div>
      </div>
    );
  }

  // Loading / redirecting
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
      {tenant?.logoUrl && (
        <img src={tenant.logoUrl} alt={tenant.siteName ?? tenant.name} className="h-16 object-contain" />
      )}
      <div
        className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
        style={{ borderColor: `${primary} transparent transparent transparent` }}
      />
      <p className="text-gray-600 text-sm font-medium">
        {tenant
          ? `Redirecting to ${tenant.siteName ?? tenant.name}…`
          : "Looking up training platform…"}
      </p>
    </div>
  );
}
