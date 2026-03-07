import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, XCircle, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Email Verification | VA Training Center",
};

type ErrorType = "expired" | "invalid" | "already_verified";

interface StatusConfig {
  readonly icon: React.ReactNode;
  readonly title: string;
  readonly description: string;
  readonly bgClass: string;
  readonly iconContainerClass: string;
}

function getErrorConfig(error: ErrorType): StatusConfig {
  const configs: Record<ErrorType, StatusConfig> = {
    expired: {
      icon: <AlertCircle className="h-12 w-12 text-amber-500" />,
      title: "Verification Link Expired",
      description:
        "This verification link has expired. Please contact support or re-submit your enrollment to receive a new verification email.",
      bgClass: "bg-amber-50 border-amber-200",
      iconContainerClass: "bg-amber-100",
    },
    invalid: {
      icon: <XCircle className="h-12 w-12 text-red-500" />,
      title: "Invalid Verification Link",
      description:
        "This verification link is invalid or has already been used. Please check your email for the correct link or contact support for assistance.",
      bgClass: "bg-red-50 border-red-200",
      iconContainerClass: "bg-red-100",
    },
    already_verified: {
      icon: <Info className="h-12 w-12 text-blue-500" />,
      title: "Email Already Verified",
      description:
        "Your email address has already been verified. You can track your enrollment status below or wait for an activation email once your application is approved.",
      bgClass: "bg-blue-50 border-blue-200",
      iconContainerClass: "bg-blue-100",
    },
  };

  return configs[error];
}

export default async function VerifyEmailPage({
  searchParams,
}: {
  readonly searchParams: Promise<{
    readonly success?: string;
    readonly error?: string;
    readonly id?: string;
  }>;
}) {
  const { success, error, id } = await searchParams;

  const isSuccess = success === "true";
  const errorType = error as ErrorType | undefined;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            VA Training Center
          </h1>
          <p className="text-gray-500 mt-1">Email Verification</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {isSuccess && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-green-100 p-4">
                  <CheckCircle2 className="h-12 w-12 text-green-500" />
                </div>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Email Verified!
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                Your email has been successfully verified. Our team will review
                your application and you will receive an activation email once
                approved.
              </p>
              <div className="pt-2 space-y-3">
                {id && (
                  <Button asChild className="w-full bg-blue-700 hover:bg-blue-800">
                    <Link href={`/enrollment-status/${id}`}>
                      Track Your Status
                    </Link>
                  </Button>
                )}
                <Button asChild variant="outline" className="w-full">
                  <Link href="/">Return to Home</Link>
                </Button>
              </div>
            </div>
          )}

          {!isSuccess && errorType && (
            <div className="text-center space-y-4">
              {(() => {
                const config = getErrorConfig(errorType);
                return (
                  <>
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
                  </>
                );
              })()}
              <div className="pt-2 space-y-3">
                {id && (
                  <Button asChild className="w-full bg-blue-700 hover:bg-blue-800">
                    <Link href={`/enrollment-status/${id}`}>
                      Track Your Status
                    </Link>
                  </Button>
                )}
                <Button asChild variant="outline" className="w-full">
                  <Link href="/contact">Contact Support</Link>
                </Button>
                <Button asChild variant="ghost" className="w-full">
                  <Link href="/">Return to Home</Link>
                </Button>
              </div>
            </div>
          )}

          {!isSuccess && !errorType && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-gray-100 p-4">
                  <AlertCircle className="h-12 w-12 text-gray-400" />
                </div>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                No Verification Data
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                It looks like you reached this page without a verification link.
                Please check your email for the verification link sent during
                enrollment.
              </p>
              <div className="pt-2">
                <Button asChild variant="outline" className="w-full">
                  <Link href="/">Return to Home</Link>
                </Button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Need help?{" "}
          <Link href="/contact" className="text-blue-600 hover:underline">
            Contact us
          </Link>{" "}
          at info@vatrainingcenter.com
        </p>
      </div>
    </div>
  );
}
