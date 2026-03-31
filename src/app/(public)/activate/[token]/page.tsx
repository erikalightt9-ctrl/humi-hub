import type { Metadata } from "next";
import Link from "next/link";
import { XCircle, AlertCircle } from "lucide-react";
import { validateActivationToken } from "@/lib/services/verification.service";
import { AccountActivationForm } from "@/components/public/AccountActivationForm";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Activate Your Account | HUMI Hub",
};

interface ErrorConfig {
  readonly icon: React.ReactNode;
  readonly title: string;
  readonly description: string;
  readonly bgClass: string;
  readonly iconContainerClass: string;
}

function getErrorConfig(error: "invalid" | "expired"): ErrorConfig {
  const configs: Record<"invalid" | "expired", ErrorConfig> = {
    expired: {
      icon: <AlertCircle className="h-12 w-12 text-amber-500" />,
      title: "Activation Link Expired",
      description:
        "This activation link has expired. Please contact support to receive a new activation link.",
      bgClass: "bg-amber-50 border-amber-200",
      iconContainerClass: "bg-amber-100",
    },
    invalid: {
      icon: <XCircle className="h-12 w-12 text-red-500" />,
      title: "Invalid Activation Link",
      description:
        "This activation link is invalid or has already been used. If you have already activated your account, you can log in below.",
      bgClass: "bg-red-50 border-red-200",
      iconContainerClass: "bg-red-100",
    },
  };

  return configs[error];
}

export default async function ActivatePage({
  params,
}: {
  readonly params: Promise<{ readonly token: string }>;
}) {
  const { token } = await params;
  const result = await validateActivationToken(token);

  if (!result.success) {
    const config = getErrorConfig(result.error);

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              HUMI Hub
            </h1>
            <p className="text-gray-500 mt-1">Account Activation</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className={`rounded-full p-4 ${config.iconContainerClass}`}>
                  {config.icon}
                </div>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                {config.title}
              </h2>
              <div className={`rounded-lg border p-4 ${config.bgClass}`}>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {config.description}
                </p>
              </div>
              <div className="pt-2 space-y-3">
                <Button asChild variant="outline" className="w-full">
                  <Link href="/contact">Contact Support</Link>
                </Button>
                <Button asChild variant="ghost" className="w-full">
                  <Link href="/portal?tab=student">Go to Login</Link>
                </Button>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Need help?{" "}
            <Link href="/contact" className="text-blue-600 hover:underline">
              Contact us
            </Link>{" "}
            at info@humihub.com
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            HUMI Hub
          </h1>
          <p className="text-gray-500 mt-1">Account Activation</p>
        </div>

        <AccountActivationForm
          token={token}
          name={result.enrollment.fullName}
          courseTitle={result.enrollment.courseTitle}
        />

        <p className="text-center text-xs text-gray-400 mt-6">
          Need help?{" "}
          <Link href="/contact" className="text-blue-600 hover:underline">
            Contact us
          </Link>{" "}
          at info@humihub.com
        </p>
      </div>
    </div>
  );
}
